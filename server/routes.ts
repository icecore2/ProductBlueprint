import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertSubscriptionSchema,
  insertNotificationSchema,
} from "@shared/schema";
import { getVapidPublicKey, initializeWebPush } from './web-push-service';
// Helper functions
const calculateTotalMonthlySpending = (subscriptions: any[]): number => {
  return subscriptions.reduce((total, sub) => {
    if (sub.billingCycle === 'monthly') {
      return total + sub.amount;
    } else if (sub.billingCycle === 'yearly') {
      return total + (sub.amount / 12);
    } else if (sub.billingCycle === 'quarterly') {
      return total + (sub.amount / 3);
    } else if (sub.billingCycle === 'weekly') {
      return total + (sub.amount * 4.33); // Average 4.33 weeks per month
    }
    return total;
  }, 0);
};

const getUpcomingSubscription = (subscriptions: any[]): any | null => {
  if (!subscriptions.length) return null;

  // Sort by due date ascending
  const sorted = [...subscriptions].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  // Find the first subscription with a due date in the future
  const now = new Date();
  const upcoming = sorted.find(sub => new Date(sub.dueDate) > now);

  return upcoming || sorted[0]; // Return the first future due date or the first one if all are past
};
import { sendEmail } from "./email-service";

// Helper function to get user ID (using query parameter userId or defaulting to the default household member)
async function getUserId(req: Request): Promise<number> {
  // If the request specifies a user ID, use that
  if (req.query.userId && !isNaN(Number(req.query.userId))) {
    return Number(req.query.userId);
  }

  // Otherwise find the default household member
  try {
    const users = await storage.getAllUsers();
    const defaultUser = users.find(user => user.isDefault);
    if (defaultUser) {
      return defaultUser.id;
    }

    // If no default user is found, return the first user or 1
    return users.length > 0 ? users[0].id : 1;
  } catch (error) {
    console.error("Error getting default user:", error);
    return 1; // Fallback to user ID 1
  }
}

// Validate subscription request body
const validateSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserId(req);
    const subscription = insertSubscriptionSchema.parse({
      ...req.body,
      userId,
      dueDate: new Date(req.body.dueDate)
    });
    req.body = subscription;
    next();
  } catch (error) {
    res.status(400).json({ error: "Invalid subscription data" });
  }
};

// Validate notification settings
const validateNotificationSettings = (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      enabled: z.boolean(),
      reminderDays: z.number().int().min(1).max(30),
    });

    const settings = schema.parse(req.body);
    req.body = settings;
    next();
  } catch (error) {
    res.status(400).json({ error: "Invalid notification settings" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Get all subscriptions
  app.get("/api/subscriptions", async (req: Request, res: Response) => {
    try {
      const userId = await getUserId(req);
      const subscriptions = await storage.getSubscriptions(userId);
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // Get subscription summary
  app.get("/api/subscriptions/summary", async (req: Request, res: Response) => {
    try {
      // Check if we want household summary (all members) or individual summary
      const showHousehold = req.query.household === 'true';

      if (showHousehold) {
        // Get all household members
        const members = await storage.getAllUsers();
        const householdSubscriptions = [];

        // Get subscriptions for each member
        for (const member of members) {
          const memberSubscriptions = await storage.getSubscriptions(member.id);
          householdSubscriptions.push(...memberSubscriptions);
        }

        // Calculate household statistics
        const monthlySpending = calculateTotalMonthlySpending(householdSubscriptions);
        const activeCount = householdSubscriptions.filter(sub => sub.active).length;
        const nextDue = getUpcomingSubscription(householdSubscriptions);

        // Group spending by household member for the breakdown
        const memberSpending = [];
        for (const member of members) {
          const memberSubs = householdSubscriptions.filter(sub => sub.userId === member.id);
          if (memberSubs.length > 0) {
            memberSpending.push({
              memberId: member.id,
              memberName: member.name,
              memberColor: member.color,
              spending: calculateTotalMonthlySpending(memberSubs),
              count: memberSubs.length,
              isDefault: member.isDefault,
            });
          }
        }

        res.json({
          isHousehold: true,
          monthlySpending,
          activeCount,
          nextDue: nextDue ? {
            date: nextDue.dueDate,
            service: nextDue.name,
            amount: nextDue.amount,
            memberId: nextDue.userId
          } : null,
          memberBreakdown: memberSpending
        });
      } else {
        // Individual member summary (original behavior)
        const userId = await getUserId(req);
        const subscriptions = await storage.getSubscriptions(userId);

        const monthlySpending = calculateTotalMonthlySpending(subscriptions);
        const activeCount = subscriptions.filter(sub => sub.active).length;

        const nextDue = getUpcomingSubscription(subscriptions);

        res.json({
          isHousehold: false,
          monthlySpending,
          activeCount,
          nextDue: nextDue ? {
            date: nextDue.dueDate,
            service: nextDue.name,
            amount: nextDue.amount,
          } : null,
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch summary" });
    }
  });

  // Get subscription by ID
  app.get("/api/subscriptions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const subscription = await storage.getSubscription(id);

      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      // Verify the subscription belongs to the current user
      const userId = await getUserId(req);
      if (subscription.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized access to subscription" });
      }

      res.json(subscription);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  // Create a new subscription
  app.post("/api/subscriptions", validateSubscription, async (req: Request, res: Response) => {
    try {
      const newSubscription = await storage.createSubscription(req.body);
      res.status(201).json(newSubscription);
    } catch (error) {
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // Update a subscription
  app.put("/api/subscriptions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const subscription = await storage.getSubscription(id);

      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      // Verify the subscription belongs to the current user
      const userId = await getUserId(req);
      if (subscription.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized access to subscription" });
      }

      const updatedSubscription = await storage.updateSubscription(id, {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        userId, // Ensure userId doesn't change
      });

      res.json(updatedSubscription);
    } catch (error) {
      res.status(500).json({ error: "Failed to update subscription" });
    }
  });

  // Delete a subscription
  app.delete("/api/subscriptions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const subscription = await storage.getSubscription(id);

      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      // Verify the subscription belongs to the current user
      const userId = await getUserId(req);
      if (subscription.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized access to subscription" });
      }

      await storage.deleteSubscription(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete subscription" });
    }
  });

  // Get all categories
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Get all services
  app.get("/api/services", async (req: Request, res: Response) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  // Create a custom service
  app.post("/api/services/custom", async (req: Request, res: Response) => {
    try {
      const { name, category, averagePrice, icon } = req.body;

      if (!name || !category || !averagePrice || !icon) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if service with this name already exists
      const existingServices = await storage.getServices();
      const serviceExists = existingServices.some(
        (service) => service.name.toLowerCase() === name.toLowerCase()
      );

      if (serviceExists) {
        return res.status(400).json({ error: "A service with this name already exists" });
      }

      const newService = await storage.createService({
        name,
        category,
        averagePrice,
        icon
      });

      res.status(201).json(newService);
    } catch (error) {
      res.status(500).json({ error: "Failed to create custom service" });
    }
  });

  // Get notifications
  app.get("/api/notifications", async (req: Request, res: Response) => {
    try {
      const userId = await getUserId(req);
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Get notification settings
  app.get("/api/settings/notifications", async (req: Request, res: Response) => {
    try {
      const userId = await getUserId(req);
      const settings = await storage.getNotificationSettings(userId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notification settings" });
    }
  });

  // Update notification settings
  app.put("/api/settings/notifications", validateNotificationSettings, async (req: Request, res: Response) => {
    try {
      const userId = await getUserId(req);
      await storage.updateNotificationSettings(userId, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update notification settings" });
    }
  });

  // Send test notification
  app.post("/api/notifications/test", async (req: Request, res: Response) => {
    try {
      const userId = await getUserId(req);
      const user = await storage.getUser(userId);

      if (!user || !user.email) {
        return res.status(400).json({ error: "User email not found" });
      }

      await sendEmail({
        to: user.email,
        subject: "SubTrackr Test Notification",
        text: "This is a test notification from SubTrackr.",
        html: "<p>This is a test notification from <strong>SubTrackr</strong>.</p>",
      });

      res.json({ success: true, message: "Test notification sent" });
    } catch (error) {
      res.status(500).json({ error: "Failed to send test notification" });
    }
  });

  // Household member endpoints
  // Get all household members
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch household members" });
    }
  });

  // Create a new household member
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const newUser = await storage.createUser(req.body);
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to create household member" });
    }
  });

  // Update a household member
  app.put("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "Household member not found" });
      }

      // Get current user to check permissions (in a real app, you'd check auth)
      const currentUserId = await getUserId(req);

      // Update the user
      const updatedUser = await storage.updateUser(id, req.body);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update household member" });
    }
  });

  // Delete a household member
  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "Household member not found" });
      }

      // Check if the user is the default one
      if (user.isDefault) {
        return res.status(400).json({ error: "Cannot delete the default household member" });
      }

      // Get current user to check permissions (in a real app, you'd check auth)
      const currentUserId = await getUserId(req);

      // Delete the user
      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete household member" });
    }
  });

  // Set a household member as the default
  app.put("/api/users/:id/set-default", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "Household member not found" });
      }

      // Get current user to check permissions (in a real app, you'd check auth)
      const currentUserId = await getUserId(req);

      // Update the user as default
      const updatedUser = await storage.setDefaultUser(id);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to set default household member" });
    }
  });

  // API Key endpoints
  // Get all API keys for the current user
  app.get("/api/settings/apikeys", async (req: Request, res: Response) => {
    try {
      const userId = await getUserId(req);
      const apiKeys = await storage.getApiKeys(userId);

      // Mask API keys for security
      const maskedApiKeys = apiKeys.map(key => ({
        ...key,
        apiKey: `${key.apiKey.substring(0, 4)}...${key.apiKey.substring(key.apiKey.length - 4)}`
      }));

      res.json(maskedApiKeys);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });

  // Create or update an API key
  app.post("/api/settings/apikeys", async (req: Request, res: Response) => {
    try {
      const userId = await getUserId(req);
      const { service, apiKey, enabled = true } = req.body;

      if (!service || !apiKey) {
        return res.status(400).json({ error: "Service and API key are required" });
      }

      const newApiKey = await storage.createApiKey({
        userId,
        service,
        apiKey,
        enabled
      });

      // Mask API key for security
      const maskedApiKey = {
        ...newApiKey,
        apiKey: `${newApiKey.apiKey.substring(0, 4)}...${newApiKey.apiKey.substring(newApiKey.apiKey.length - 4)}`
      };

      res.status(201).json(maskedApiKey);
    } catch (error) {
      res.status(500).json({ error: "Failed to save API key" });
    }
  });

  // Update an API key
  app.put("/api/settings/apikeys/:id", async (req: Request, res: Response) => {
    try {
      const userId = await getUserId(req);
      const id = parseInt(req.params.id);
      const { apiKey, enabled } = req.body;

      // First check if the API key belongs to the current user
      const existingKey = await storage.getApiKeys(userId);
      const userOwnsKey = existingKey.some(key => key.id === id);

      if (!userOwnsKey) {
        return res.status(403).json({ error: "Unauthorized access to API key" });
      }

      const updatedKey = await storage.updateApiKey(id, { 
        apiKey,
        enabled
      });

      // Mask API key for security
      const maskedApiKey = {
        ...updatedKey,
        apiKey: `${updatedKey.apiKey.substring(0, 4)}...${updatedKey.apiKey.substring(updatedKey.apiKey.length - 4)}`
      };

      res.json(maskedApiKey);
    } catch (error) {
      res.status(500).json({ error: "Failed to update API key" });
    }
  });

  // Delete an API key
  app.delete("/api/settings/apikeys/:id", async (req: Request, res: Response) => {
    try {
      const userId = await getUserId(req);
      const id = parseInt(req.params.id);

      // First check if the API key belongs to the current user
      const existingKey = await storage.getApiKeys(userId);
      const userOwnsKey = existingKey.some(key => key.id === id);

      if (!userOwnsKey) {
        return res.status(403).json({ error: "Unauthorized access to API key" });
      }

      await storage.deleteApiKey(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete API key" });
    }
  });

  // Get the VAPID public key for Web Push
  app.get("/api/web-push/vapid-public-key", (req: Request, res: Response) => {
    const publicKey = getVapidPublicKey();
    if (!publicKey) {
      return res.status(500).json({ error: "Web Push not configured" });
    }
    res.json({ publicKey });
  });

  // Subscribe to Web Push notifications
  app.post("/api/web-push/subscribe", async (req: Request, res: Response) => {
    try {
      const userId = await getUserId(req);
      const subscription = req.body;

      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ error: "Invalid push subscription" });
      }

      // Initialize Web Push if not already done
      if (!getVapidPublicKey()) {
        // For the demo, we'll generate VAPID keys on the fly
        // In a production app, these would be stored securely
        const vapidKeys = {
          publicKey: "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U",
          privateKey: "UUxI4O8-FbRouAevSmBQ6RLtizUKNR6D3MjjOmRchrg"
        };

        initializeWebPush(
          vapidKeys.publicKey,
          vapidKeys.privateKey,
          "admin@subtrackr.com"
        );
      }

      // Import the notification manager
      const { notificationManager } = await import("./notification-manager");

      // Update the user's notification settings
      await notificationManager.updateUserSettings(userId, {
        webPushSubscription: subscription,
        channels: {
          email: true,
          pushbullet: false,
          pushover: false,
          webpush: true
        }
      });

      res.json({ success: true, message: "Web Push subscription saved" });
    } catch (error) {
      res.status(500).json({ error: "Failed to subscribe to Web Push notifications" });
    }
  });

  // Test a notification channel
  app.post("/api/notifications/test/:channel", async (req: Request, res: Response) => {
    try {
      const userId = await getUserId(req);
      const channel = req.params.channel as "email" | "pushbullet" | "pushover" | "webpush";

      if (!["email", "pushbullet", "pushover", "webpush"].includes(channel)) {
        return res.status(400).json({ error: "Invalid notification channel" });
      }

      // Import the notification manager
      const { notificationManager } = await import("./notification-manager");

      // Initialize user settings first
      await notificationManager.initializeUserSettings(userId);

      // If testing Pushbullet, check for API key
      if (channel === "pushbullet") {
        const apiKey = await storage.getApiKeyByService(userId, "pushbullet");
        if (!apiKey) {
          return res.status(400).json({ error: "Pushbullet API key not found" });
        }

        // Update notification manager with the API key
        await notificationManager.updateUserSettings(userId, {
          pushbulletApiKey: apiKey.apiKey,
          channels: {
            email: true,
            pushbullet: true,
            pushover: false,
            webpush: false
          }
        });
      }

      // If testing Pushover, check for API key
      if (channel === "pushover") {
        const apiKey = await storage.getApiKeyByService(userId, "pushover");

        if (!apiKey) {
          return res.status(400).json({ error: "Pushover API key not found" });
        }

        // For Pushover, we need to split the stored key into API token and user key parts
        // The format is expected to be "token:userkey"
        const parts = apiKey.apiKey.split(':');

        if (parts.length !== 2) {
          return res.status(400).json({ error: "Invalid Pushover API key format. Expected format: 'token:userkey'" });
        }

        const [pushoverApiKey, pushoverUserKey] = parts;

        // Validate key formats
        if (!pushoverApiKey || pushoverApiKey.length < 10 || !pushoverUserKey || pushoverUserKey.length < 10) {
          return res.status(400).json({ 
            error: "Invalid Pushover API key or user key format",
            details: `API key length: ${pushoverApiKey ? pushoverApiKey.length : 0}, User key length: ${pushoverUserKey ? pushoverUserKey.length : 0}. Both should be at least 10 characters.`
          });
        }

        // Update notification manager with the API key
        await notificationManager.updateUserSettings(userId, {
          pushoverApiKey,
          pushoverUserKey,
          channels: {
            email: true,
            pushbullet: false,
            pushover: true,
            webpush: false
          }
        });
      }

      // If testing Web Push, check for subscription
      if (channel === "webpush") {
        const subscription = req.body.subscription;
        if (subscription) {
          // Update notification manager with the subscription
          await notificationManager.updateUserSettings(userId, {
            webPushSubscription: subscription,
            channels: {
              email: true,
              pushbullet: false,
              pushover: false,
              webpush: true
            }
          });
        }
      }

      let success = false;
      try {
        success = await notificationManager.sendTestNotification(userId, channel);
        if (!success) {
          return res.status(400).json({ error: `Failed to send test notification via ${channel}` });
        }
      } catch (error) {
        console.error(`Error sending test notification via ${channel}:`, error);
        return res.status(400).json({ 
          error: `Failed to send test notification via ${channel}`,
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }

      // If we get here, the notification was sent successfully
      res.json({ success: true, message: `Test notification sent via ${channel}` });
    } catch (error) {
      res.status(500).json({ error: "Failed to send test notification" });
    }
  });

  return httpServer;
}