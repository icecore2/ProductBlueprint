var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// client/src/lib/constants.ts
var init_constants = __esm({
  "client/src/lib/constants.ts"() {
    "use strict";
  }
});

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  apiKeys: () => apiKeys,
  categories: () => categories,
  insertApiKeySchema: () => insertApiKeySchema,
  insertCategorySchema: () => insertCategorySchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertServiceSchema: () => insertServiceSchema,
  insertSubscriptionSchema: () => insertSubscriptionSchema,
  insertUserSchema: () => insertUserSchema,
  notifications: () => notifications,
  services: () => services,
  subscriptions: () => subscriptions,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users, apiKeys, subscriptions, categories, services, notifications, insertUserSchema, insertSubscriptionSchema, insertCategorySchema, insertServiceSchema, insertNotificationSchema, insertApiKeySchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      // Changed from username to name
      email: text("email"),
      color: text("color").default("#3b82f6"),
      // Color for UI representation
      notificationEnabled: boolean("notification_enabled").default(true),
      reminderDays: integer("reminder_days").default(7),
      isDefault: boolean("is_default").default(false)
      // Flag for the default household member
    });
    apiKeys = pgTable("api_keys", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull(),
      service: text("service").notNull(),
      // 'pushbullet', 'pushover', etc.
      apiKey: text("api_key").notNull(),
      enabled: boolean("enabled").default(true),
      createdAt: timestamp("created_at").defaultNow()
    });
    subscriptions = pgTable("subscriptions", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull(),
      name: text("name").notNull(),
      category: text("category").notNull(),
      description: text("description"),
      amount: real("amount").notNull(),
      dueDate: timestamp("due_date").notNull(),
      billingCycle: text("billing_cycle").notNull(),
      active: boolean("active").default(true),
      createdAt: timestamp("created_at").defaultNow()
    });
    categories = pgTable("categories", {
      id: serial("id").primaryKey(),
      name: text("name").notNull().unique(),
      color: text("color").notNull()
    });
    services = pgTable("services", {
      id: serial("id").primaryKey(),
      name: text("name").notNull().unique(),
      category: text("category").notNull(),
      averagePrice: real("average_price"),
      icon: text("icon")
    });
    notifications = pgTable("notifications", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull(),
      subscriptionId: integer("subscription_id").notNull(),
      message: text("message").notNull(),
      dueDate: timestamp("due_date").notNull(),
      sent: boolean("sent").default(false),
      sentAt: timestamp("sent_at"),
      type: text("type").notNull()
      // email, push, etc.
    });
    insertUserSchema = createInsertSchema(users).pick({
      name: true,
      email: true,
      color: true,
      notificationEnabled: true,
      reminderDays: true,
      isDefault: true
    });
    insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
      userId: true,
      name: true,
      category: true,
      description: true,
      amount: true,
      dueDate: true,
      billingCycle: true,
      active: true
    });
    insertCategorySchema = createInsertSchema(categories).pick({
      name: true,
      color: true
    });
    insertServiceSchema = createInsertSchema(services).pick({
      name: true,
      category: true,
      averagePrice: true,
      icon: true
    });
    insertNotificationSchema = createInsertSchema(notifications).pick({
      userId: true,
      subscriptionId: true,
      message: true,
      dueDate: true,
      sent: true,
      sentAt: true,
      type: true
    });
    insertApiKeySchema = createInsertSchema(apiKeys).pick({
      userId: true,
      service: true,
      apiKey: true,
      enabled: true
    });
  }
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    neonConfig.webSocketConstructor = ws;
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    console.log("[db] Connecting to the database...");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      // Maximum number of clients
      idleTimeoutMillis: 3e4,
      // Close idle clients after 30s
      connectionTimeoutMillis: 1e4
      // Timeout after 10s when connecting
    });
    db = drizzle(pool, { schema: schema_exports });
    pool.on("error", (err) => {
      console.error("[db] Unexpected error on idle client", err);
      process.exit(-1);
    });
    pool.query("SELECT NOW()", []).then(() => console.log("[db] Successfully connected to the database")).catch((err) => console.error("[db] Error connecting to the database:", err));
  }
});

// server/database-storage.ts
import { eq, and } from "drizzle-orm";
var DatabaseStorage;
var init_database_storage = __esm({
  "server/database-storage.ts"() {
    "use strict";
    init_db();
    init_schema();
    DatabaseStorage = class {
      // User operations
      async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
      }
      async getUserByName(name) {
        const [user] = await db.select().from(users).where(eq(users.name, name));
        return user;
      }
      async createUser(user) {
        const [newUser] = await db.insert(users).values(user).returning();
        return newUser;
      }
      async getAllUsers() {
        return db.select().from(users);
      }
      async updateUser(id, data) {
        const [updatedUser] = await db.update(users).set(data).where(eq(users.id, id)).returning();
        if (!updatedUser) {
          throw new Error(`User with ID ${id} not found`);
        }
        return updatedUser;
      }
      async deleteUser(id) {
        const user = await this.getUser(id);
        if (!user) {
          throw new Error(`User with ID ${id} not found`);
        }
        if (user.isDefault) {
          throw new Error("Cannot delete the default user");
        }
        const result = await db.delete(users).where(eq(users.id, id));
        if (!result) {
          throw new Error(`User with ID ${id} not found`);
        }
      }
      async setDefaultUser(id) {
        const user = await this.getUser(id);
        if (!user) {
          throw new Error(`User with ID ${id} not found`);
        }
        await db.update(users).set({ isDefault: false }).where(eq(users.isDefault, true));
        const [updatedUser] = await db.update(users).set({ isDefault: true }).where(eq(users.id, id)).returning();
        return updatedUser;
      }
      // Subscription operations
      async getSubscriptions(userId) {
        return db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
      }
      async getSubscription(id) {
        const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
        return subscription;
      }
      async createSubscription(subscription) {
        const [newSubscription] = await db.insert(subscriptions).values({
          ...subscription,
          createdAt: /* @__PURE__ */ new Date()
        }).returning();
        return newSubscription;
      }
      async updateSubscription(id, data) {
        const [updatedSubscription] = await db.update(subscriptions).set(data).where(eq(subscriptions.id, id)).returning();
        if (!updatedSubscription) {
          throw new Error(`Subscription with ID ${id} not found`);
        }
        return updatedSubscription;
      }
      async deleteSubscription(id) {
        const result = await db.delete(subscriptions).where(eq(subscriptions.id, id));
        if (!result) {
          throw new Error(`Subscription with ID ${id} not found`);
        }
      }
      // Category operations
      async getCategories() {
        return db.select().from(categories);
      }
      async createCategory(category) {
        const [newCategory] = await db.insert(categories).values(category).returning();
        return newCategory;
      }
      // Service operations
      async getServices() {
        try {
          const result = await db.select().from(services);
          return result;
        } catch (error) {
          console.error("Error fetching services:", error);
          throw error;
        }
      }
      async createService(data) {
        try {
          const [newService] = await db.insert(services).values(data).returning();
          return newService;
        } catch (error) {
          console.error("Error creating service:", error);
          throw error;
        }
      }
      // Notification operations
      async getNotifications(userId) {
        return db.select().from(notifications).where(eq(notifications.userId, userId));
      }
      async createNotification(notification) {
        const [newNotification] = await db.insert(notifications).values(notification).returning();
        return newNotification;
      }
      async updateNotification(id, data) {
        const [updatedNotification] = await db.update(notifications).set(data).where(eq(notifications.id, id)).returning();
        if (!updatedNotification) {
          throw new Error(`Notification with ID ${id} not found`);
        }
        return updatedNotification;
      }
      async deleteNotification(id) {
        const result = await db.delete(notifications).where(eq(notifications.id, id));
        if (!result) {
          throw new Error(`Notification with ID ${id} not found`);
        }
      }
      // API key operations
      async getApiKeys(userId) {
        return db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
      }
      async getApiKeyByService(userId, service) {
        const [apiKey] = await db.select().from(apiKeys).where(
          and(
            eq(apiKeys.userId, userId),
            eq(apiKeys.service, service)
          )
        );
        return apiKey;
      }
      async createApiKey(apiKey) {
        const existingKey = await this.getApiKeyByService(apiKey.userId, apiKey.service);
        if (existingKey) {
          return this.updateApiKey(existingKey.id, apiKey);
        }
        const [newApiKey] = await db.insert(apiKeys).values({
          ...apiKey,
          createdAt: /* @__PURE__ */ new Date()
        }).returning();
        return newApiKey;
      }
      async updateApiKey(id, data) {
        const [updatedApiKey] = await db.update(apiKeys).set(data).where(eq(apiKeys.id, id)).returning();
        if (!updatedApiKey) {
          throw new Error(`API key with ID ${id} not found`);
        }
        return updatedApiKey;
      }
      async deleteApiKey(id) {
        const result = await db.delete(apiKeys).where(eq(apiKeys.id, id));
        if (!result) {
          throw new Error(`API key with ID ${id} not found`);
        }
      }
      // Settings operations
      async getNotificationSettings(userId) {
        const user = await this.getUser(userId);
        if (!user) {
          throw new Error(`User with ID ${userId} not found`);
        }
        return {
          enabled: user.notificationEnabled ?? true,
          reminderDays: user.reminderDays ?? 7
        };
      }
      async updateNotificationSettings(userId, settings) {
        const user = await this.getUser(userId);
        if (!user) {
          throw new Error(`User with ID ${userId} not found`);
        }
        await db.update(users).set({
          notificationEnabled: settings.enabled,
          reminderDays: settings.reminderDays
        }).where(eq(users.id, userId));
      }
    };
  }
});

// server/storage.ts
var storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_constants();
    init_database_storage();
    storage = new DatabaseStorage();
  }
});

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default;
var init_vite_config = __esm({
  async "vite.config.ts"() {
    "use strict";
    vite_config_default = defineConfig({
      plugins: [
        react(),
        runtimeErrorOverlay(),
        ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
          await import("@replit/vite-plugin-cartographer").then(
            (m) => m.cartographer()
          )
        ] : []
      ],
      resolve: {
        alias: {
          "@": path.resolve(import.meta.dirname, "client", "src"),
          "@shared": path.resolve(import.meta.dirname, "shared"),
          "@assets": path.resolve(import.meta.dirname, "attached_assets")
        }
      },
      root: path.resolve(import.meta.dirname, "client"),
      build: {
        outDir: path.resolve(import.meta.dirname, "dist/public"),
        emptyOutDir: true
      }
    });
  }
});

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { nanoid } from "nanoid";
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}
var viteLogger;
var init_vite = __esm({
  async "server/vite.ts"() {
    "use strict";
    await init_vite_config();
    viteLogger = createLogger();
  }
});

// server/web-push-service.ts
import webpush from "web-push";
function initializeWebPush(publicKey, privateKey, email) {
  try {
    if (!publicKey || !privateKey || !email) {
      log("Missing VAPID keys or contact email", "web-push-service");
      return false;
    }
    vapidPublicKey = publicKey;
    vapidPrivateKey = privateKey;
    webpush.setVapidDetails(
      `mailto:${email}`,
      publicKey,
      privateKey
    );
    log("Web Push service initialized", "web-push-service");
    return true;
  } catch (error) {
    log(`Failed to initialize Web Push service: ${error instanceof Error ? error.message : "Unknown error"}`, "web-push-service");
    return false;
  }
}
function getVapidPublicKey() {
  return vapidPublicKey;
}
async function sendWebPushNotification(subscription, options) {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      log("Web Push service not initialized", "web-push-service");
      return false;
    }
    const payload = JSON.stringify({
      title: options.title,
      body: options.body,
      icon: options.icon,
      tag: options.tag,
      data: options.data,
      url: options.url
    });
    await webpush.sendNotification(subscription, payload);
    log(`Web Push notification sent: ${options.title}`, "web-push-service");
    return true;
  } catch (error) {
    log(`Failed to send Web Push notification: ${error instanceof Error ? error.message : "Unknown error"}`, "web-push-service");
    return false;
  }
}
async function sendSubscriptionReminderWebPush(subscription, subscriptionName, dueDate, amount) {
  const formattedDate = dueDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
  return sendWebPushNotification(
    subscription,
    {
      title: `SubTrackr: ${subscriptionName} payment due soon`,
      body: `Your ${subscriptionName} subscription payment of ${formattedAmount} is due on ${formattedDate}.`,
      tag: "subscription-reminder",
      data: {
        subscriptionName,
        dueDate: dueDate.toISOString(),
        amount
      }
    }
  );
}
var vapidPublicKey, vapidPrivateKey;
var init_web_push_service = __esm({
  async "server/web-push-service.ts"() {
    "use strict";
    await init_vite();
    vapidPublicKey = null;
    vapidPrivateKey = null;
  }
});

// server/email-service.ts
import nodemailer from "nodemailer";
function initializeTransport() {
  if (process.env.NODE_ENV === "development") {
    nodemailer.createTestAccount().then((testAccount) => {
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      log("Created test email account", "email-service");
    }).catch((error) => {
      log(`Failed to create test email account: ${error.message}`, "email-service");
      createFallbackTransport();
    });
  } else {
    createFallbackTransport();
  }
}
function createFallbackTransport() {
  transporter = {
    sendMail: async (options) => {
      const textPreview = typeof options.text === "string" ? options.text.substring(0, 100) + (options.text.length > 100 ? "..." : "") : "[non-string content]";
      log(
        `Email would be sent: 
        To: ${options.to}
        Subject: ${options.subject}
        Text: ${textPreview}`,
        "email-service"
      );
      return {
        accepted: [options.to],
        rejected: [],
        response: "OK: simulated email sent",
        messageId: `mock-${Date.now()}@subtrackr.app`
      };
    }
  };
}
async function sendEmail(options) {
  try {
    if (!transporter) {
      log("Email transporter not initialized", "email-service");
      createFallbackTransport();
    }
    const mailOptions = {
      from: '"SubTrackr" <notifications@subtrackr.app>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };
    const info = await transporter.sendMail(mailOptions);
    if (process.env.NODE_ENV === "development" && "messageUrl" in info) {
      log(`Email preview URL: ${info.messageUrl}`, "email-service");
    }
  } catch (error) {
    log(`Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`, "email-service");
    throw error;
  }
}
async function sendSubscriptionReminder(to, subscriptionName, dueDate, amount) {
  const formattedDate = dueDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
  const subject = `Reminder: ${subscriptionName} payment due soon`;
  const text2 = `
    Hello,

    This is a reminder that your ${subscriptionName} subscription payment of ${formattedAmount} is due on ${formattedDate}.

    To view more details or update this subscription, please visit your SubTrackr dashboard.

    Best regards,
    The SubTrackr Team
  `;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Subscription Payment Reminder</h2>
      <p>Hello,</p>
      <p>This is a reminder that your <strong>${subscriptionName}</strong> subscription payment is due soon.</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 16px; margin: 20px 0;">
        <p><strong>Subscription:</strong> ${subscriptionName}</p>
        <p><strong>Amount:</strong> ${formattedAmount}</p>
        <p><strong>Due Date:</strong> ${formattedDate}</p>
      </div>
      <p>To view more details or update this subscription, please visit your SubTrackr dashboard.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
        <p>Best regards,<br>The SubTrackr Team</p>
      </div>
    </div>
  `;
  await sendEmail({
    to,
    subject,
    text: text2,
    html
  });
}
var transporter;
var init_email_service = __esm({
  async "server/email-service.ts"() {
    "use strict";
    await init_vite();
    initializeTransport();
  }
});

// server/pushbullet-service.ts
import PushBullet from "pushbullet";
function initializePushbullet(apiKey) {
  try {
    if (!apiKey) {
      log("No Pushbullet API key provided", "pushbullet-service");
      return false;
    }
    pushbulletClient = new PushBullet(apiKey);
    log("Pushbullet client initialized", "pushbullet-service");
    return true;
  } catch (error) {
    log(`Failed to initialize Pushbullet client: ${error instanceof Error ? error.message : "Unknown error"}`, "pushbullet-service");
    return false;
  }
}
async function sendPushbulletNotification(options) {
  try {
    if (!pushbulletClient) {
      log("Pushbullet client not initialized", "pushbullet-service");
      return false;
    }
    if (options.deviceIden) {
      await pushbulletClient.note(options.deviceIden, options.title, options.body);
    } else {
      await pushbulletClient.note(null, options.title, options.body);
    }
    log(`Push notification sent: ${options.title}`, "pushbullet-service");
    return true;
  } catch (error) {
    log(`Failed to send push notification: ${error instanceof Error ? error.message : "Unknown error"}`, "pushbullet-service");
    return false;
  }
}
async function sendSubscriptionReminderPushbullet(subscriptionName, dueDate, amount) {
  const formattedDate = dueDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
  const title = `SubTrackr: ${subscriptionName} payment due soon`;
  const body = `Your ${subscriptionName} subscription payment of ${formattedAmount} is due on ${formattedDate}.`;
  return sendPushbulletNotification({ title, body });
}
var pushbulletClient;
var init_pushbullet_service = __esm({
  async "server/pushbullet-service.ts"() {
    "use strict";
    await init_vite();
    pushbulletClient = null;
  }
});

// server/pushover-service.ts
import axios from "axios";
function initializePushover(apiToken, userKey) {
  try {
    if (!apiToken || !userKey) {
      log("No Pushover API token or user key provided", "pushover-service");
      return false;
    }
    const trimmedToken = apiToken.trim();
    const trimmedKey = userKey.trim();
    if (trimmedToken.length < 10 || trimmedKey.length < 10) {
      log(`Invalid Pushover API token or user key format - token length: ${trimmedToken.length}, key length: ${trimmedKey.length}`, "pushover-service");
      return false;
    }
    if (trimmedToken.includes(":") || trimmedKey.includes(":")) {
      log("Invalid Pushover token or key - contains colon character", "pushover-service");
      return false;
    }
    pushoverApiToken = trimmedToken;
    pushoverUserKey = trimmedKey;
    log("Pushover client initialized", "pushover-service");
    return true;
  } catch (error) {
    log(`Failed to initialize Pushover client: ${error instanceof Error ? error.message : "Unknown error"}`, "pushover-service");
    return false;
  }
}
async function sendPushoverNotification(options) {
  try {
    if (!pushoverApiToken || !pushoverUserKey) {
      log("Pushover client not initialized", "pushover-service");
      throw new Error("Pushover client not initialized");
    }
    const payload = {
      token: pushoverApiToken,
      user: pushoverUserKey,
      title: options.title,
      message: options.message,
      url: options.url,
      url_title: options.urlTitle,
      priority: options.priority || 0,
      sound: options.sound,
      device: options.device
    };
    log(`Sending Pushover notification to ${pushoverUserKey.substring(0, 5)}...`, "pushover-service");
    try {
      const response = await axios.post("https://api.pushover.net/1/messages.json", payload);
      if (response.status === 200) {
        log(`Push notification sent: ${options.title}`, "pushover-service");
        return true;
      } else {
        log(`Failed to send push notification: ${response.statusText}`, "pushover-service");
        throw new Error(`Pushover API returned status ${response.status}: ${response.statusText}`);
      }
    } catch (axiosError) {
      if (axiosError.response) {
        log(`Pushover API error: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`, "pushover-service");
        throw new Error(`Pushover API error: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
      } else if (axiosError.request) {
        log("No response received from Pushover API", "pushover-service");
        throw new Error("No response received from Pushover API");
      } else {
        log(`Error setting up Pushover request: ${axiosError.message}`, "pushover-service");
        throw new Error(`Error setting up Pushover request: ${axiosError.message}`);
      }
    }
  } catch (error) {
    log(`Failed to send push notification: ${error instanceof Error ? error.message : "Unknown error"}`, "pushover-service");
    throw error;
  }
}
async function sendSubscriptionReminderPushover(subscriptionName, dueDate, amount) {
  const formattedDate = dueDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
  const title = `SubTrackr: ${subscriptionName} payment due soon`;
  const message = `Your ${subscriptionName} subscription payment of ${formattedAmount} is due on ${formattedDate}.`;
  return sendPushoverNotification({
    title,
    message,
    priority: 0,
    sound: "pushover"
  });
}
var pushoverUserKey, pushoverApiToken;
var init_pushover_service = __esm({
  async "server/pushover-service.ts"() {
    "use strict";
    await init_vite();
    pushoverUserKey = null;
    pushoverApiToken = null;
  }
});

// server/notification-manager.ts
var notification_manager_exports = {};
__export(notification_manager_exports, {
  NotificationManager: () => NotificationManager,
  default: () => notification_manager_default,
  notificationManager: () => notificationManager
});
var NotificationManager, notificationManager, notification_manager_default;
var init_notification_manager = __esm({
  async "server/notification-manager.ts"() {
    "use strict";
    await init_vite();
    await init_email_service();
    await init_pushbullet_service();
    await init_pushover_service();
    await init_web_push_service();
    init_storage();
    NotificationManager = class _NotificationManager {
      static instance;
      channelStatus;
      userSettings;
      constructor() {
        this.channelStatus = {
          email: { initialized: true, enabled: true },
          // Email is always initialized
          pushbullet: { initialized: false, enabled: false },
          pushover: { initialized: false, enabled: false },
          webpush: { initialized: false, enabled: false }
        };
        this.userSettings = /* @__PURE__ */ new Map();
      }
      /**
       * Get the NotificationManager instance (singleton)
       */
      static getInstance() {
        if (!_NotificationManager.instance) {
          _NotificationManager.instance = new _NotificationManager();
        }
        return _NotificationManager.instance;
      }
      /**
       * Initialize a user's notification settings
       */
      async initializeUserSettings(userId) {
        try {
          if (this.userSettings.has(userId)) {
            return this.userSettings.get(userId);
          }
          const user = await storage.getUser(userId);
          if (!user) {
            throw new Error(`User with ID ${userId} not found`);
          }
          const notificationSettings = await storage.getNotificationSettings(userId);
          const settings = {
            userId,
            email: user.email || void 0,
            channels: {
              email: true,
              pushbullet: false,
              pushover: false,
              webpush: false
            },
            reminderDays: notificationSettings.reminderDays
          };
          this.userSettings.set(userId, settings);
          return settings;
        } catch (error) {
          log(`Failed to initialize user settings: ${error instanceof Error ? error.message : "Unknown error"}`, "notification-manager");
          throw error;
        }
      }
      /**
       * Update a user's notification settings
       */
      async updateUserSettings(userId, settings) {
        try {
          if (!this.userSettings.has(userId)) {
            await this.initializeUserSettings(userId);
          }
          const currentSettings = this.userSettings.get(userId);
          const updatedSettings = {
            ...currentSettings,
            ...settings,
            channels: {
              ...currentSettings.channels,
              ...settings.channels || {}
            }
          };
          if (settings.pushbulletApiKey && settings.pushbulletApiKey !== currentSettings.pushbulletApiKey) {
            this.channelStatus.pushbullet.initialized = initializePushbullet(settings.pushbulletApiKey);
            this.channelStatus.pushbullet.enabled = this.channelStatus.pushbullet.initialized;
            if (!this.channelStatus.pushbullet.initialized) {
              this.channelStatus.pushbullet.error = "Failed to initialize Pushbullet";
            }
          }
          if (settings.pushoverApiKey && settings.pushoverUserKey && (settings.pushoverApiKey !== currentSettings.pushoverApiKey || settings.pushoverUserKey !== currentSettings.pushoverUserKey)) {
            this.channelStatus.pushover.initialized = initializePushover(
              settings.pushoverApiKey,
              settings.pushoverUserKey
            );
            this.channelStatus.pushover.enabled = this.channelStatus.pushover.initialized;
            if (!this.channelStatus.pushover.initialized) {
              this.channelStatus.pushover.error = "Failed to initialize Pushover";
            }
          }
          if (settings.webPushSubscription && JSON.stringify(settings.webPushSubscription) !== JSON.stringify(currentSettings.webPushSubscription)) {
            this.channelStatus.webpush.enabled = true;
            updatedSettings.channels.webpush = true;
          }
          this.userSettings.set(userId, updatedSettings);
          if (settings.reminderDays !== void 0 && settings.reminderDays !== currentSettings.reminderDays) {
            await storage.updateNotificationSettings(userId, {
              enabled: true,
              // Assume enabled if updating
              reminderDays: settings.reminderDays
            });
          }
          return updatedSettings;
        } catch (error) {
          log(`Failed to update user settings: ${error instanceof Error ? error.message : "Unknown error"}`, "notification-manager");
          throw error;
        }
      }
      /**
       * Get status of all notification channels
       */
      getChannelStatus() {
        return { ...this.channelStatus };
      }
      /**
       * Send a subscription reminder through all enabled channels
       */
      async sendSubscriptionReminders(userId, subscription) {
        try {
          if (!this.userSettings.has(userId)) {
            await this.initializeUserSettings(userId);
          }
          const settings = this.userSettings.get(userId);
          const results = {
            email: false,
            pushbullet: false,
            pushover: false,
            webpush: false
          };
          if (settings.channels.email && settings.email) {
            try {
              await sendSubscriptionReminder(
                settings.email,
                subscription.name,
                new Date(subscription.dueDate),
                subscription.amount
              );
              results.email = true;
            } catch (error) {
              log(`Failed to send email notification: ${error instanceof Error ? error.message : "Unknown error"}`, "notification-manager");
            }
          }
          if (settings.channels.pushbullet && this.channelStatus.pushbullet.initialized) {
            try {
              results.pushbullet = await sendSubscriptionReminderPushbullet(
                subscription.name,
                new Date(subscription.dueDate),
                subscription.amount
              );
            } catch (error) {
              log(`Failed to send Pushbullet notification: ${error instanceof Error ? error.message : "Unknown error"}`, "notification-manager");
            }
          }
          if (settings.channels.pushover && this.channelStatus.pushover.initialized) {
            try {
              results.pushover = await sendSubscriptionReminderPushover(
                subscription.name,
                new Date(subscription.dueDate),
                subscription.amount
              );
            } catch (error) {
              log(`Failed to send Pushover notification: ${error instanceof Error ? error.message : "Unknown error"}`, "notification-manager");
            }
          }
          if (settings.channels.webpush && settings.webPushSubscription) {
            try {
              results.webpush = await sendSubscriptionReminderWebPush(
                settings.webPushSubscription,
                subscription.name,
                new Date(subscription.dueDate),
                subscription.amount
              );
            } catch (error) {
              log(`Failed to send Web Push notification: ${error instanceof Error ? error.message : "Unknown error"}`, "notification-manager");
            }
          }
          return results;
        } catch (error) {
          log(`Failed to send subscription reminders: ${error instanceof Error ? error.message : "Unknown error"}`, "notification-manager");
          return {
            email: false,
            pushbullet: false,
            pushover: false,
            webpush: false
          };
        }
      }
      /**
       * Send a test notification through a specific channel
       */
      async sendTestNotification(userId, channel) {
        try {
          if (!this.userSettings.has(userId)) {
            await this.initializeUserSettings(userId);
          }
          const settings = this.userSettings.get(userId);
          switch (channel) {
            case "email":
              if (!settings.email) {
                return false;
              }
              await sendEmail({
                to: settings.email,
                subject: "SubTrackr Test Notification",
                text: "This is a test notification from SubTrackr.",
                html: "<p>This is a test notification from <strong>SubTrackr</strong>.</p>"
              });
              return true;
            case "pushbullet":
              if (!this.channelStatus.pushbullet.initialized) {
                return false;
              }
              return await sendPushbulletNotification({
                title: "SubTrackr Test Notification",
                body: "This is a test notification from SubTrackr."
              });
            case "pushover":
              if (!this.channelStatus.pushover.initialized) {
                return false;
              }
              return await sendPushoverNotification({
                title: "SubTrackr Test Notification",
                message: "This is a test notification from SubTrackr."
              });
            case "webpush":
              if (!settings.webPushSubscription) {
                return false;
              }
              return await sendSubscriptionReminderWebPush(
                settings.webPushSubscription,
                "Test Subscription",
                new Date(Date.now() + 864e5),
                // Tomorrow
                9.99
              );
            default:
              return false;
          }
        } catch (error) {
          log(`Failed to send test notification: ${error instanceof Error ? error.message : "Unknown error"}`, "notification-manager");
          return false;
        }
      }
    };
    notificationManager = NotificationManager.getInstance();
    notification_manager_default = notificationManager;
  }
});

// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
init_storage();
init_schema();
await init_web_push_service();
await init_email_service();
import { createServer } from "http";
import { z } from "zod";
var calculateTotalMonthlySpending = (subscriptions2) => {
  return subscriptions2.reduce((total, sub) => {
    if (sub.billingCycle === "monthly") {
      return total + sub.amount;
    } else if (sub.billingCycle === "yearly") {
      return total + sub.amount / 12;
    } else if (sub.billingCycle === "quarterly") {
      return total + sub.amount / 3;
    } else if (sub.billingCycle === "weekly") {
      return total + sub.amount * 4.33;
    }
    return total;
  }, 0);
};
var getUpcomingSubscription = (subscriptions2) => {
  if (!subscriptions2.length) return null;
  const sorted = [...subscriptions2].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
  const now = /* @__PURE__ */ new Date();
  const upcoming = sorted.find((sub) => new Date(sub.dueDate) > now);
  return upcoming || sorted[0];
};
async function getUserId(req) {
  if (req.query.userId && !isNaN(Number(req.query.userId))) {
    return Number(req.query.userId);
  }
  try {
    const users2 = await storage.getAllUsers();
    const defaultUser = users2.find((user) => user.isDefault);
    if (defaultUser) {
      return defaultUser.id;
    }
    return users2.length > 0 ? users2[0].id : 1;
  } catch (error) {
    console.error("Error getting default user:", error);
    return 1;
  }
}
var validateSubscription = async (req, res, next) => {
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
var validateNotificationSettings = (req, res, next) => {
  try {
    const schema = z.object({
      enabled: z.boolean(),
      reminderDays: z.number().int().min(1).max(30)
    });
    const settings = schema.parse(req.body);
    req.body = settings;
    next();
  } catch (error) {
    res.status(400).json({ error: "Invalid notification settings" });
  }
};
async function registerRoutes(app2) {
  const httpServer = createServer(app2);
  app2.get("/api/subscriptions", async (req, res) => {
    try {
      const userId = await getUserId(req);
      const subscriptions2 = await storage.getSubscriptions(userId);
      res.json(subscriptions2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });
  app2.get("/api/subscriptions/summary", async (req, res) => {
    try {
      const showHousehold = req.query.household === "true";
      if (showHousehold) {
        const members = await storage.getAllUsers();
        const householdSubscriptions = [];
        for (const member of members) {
          const memberSubscriptions = await storage.getSubscriptions(member.id);
          householdSubscriptions.push(...memberSubscriptions);
        }
        const monthlySpending = calculateTotalMonthlySpending(householdSubscriptions);
        const activeCount = householdSubscriptions.filter((sub) => sub.active).length;
        const nextDue = getUpcomingSubscription(householdSubscriptions);
        const memberSpending = [];
        for (const member of members) {
          const memberSubs = householdSubscriptions.filter((sub) => sub.userId === member.id);
          if (memberSubs.length > 0) {
            memberSpending.push({
              memberId: member.id,
              memberName: member.name,
              memberColor: member.color,
              spending: calculateTotalMonthlySpending(memberSubs),
              count: memberSubs.length,
              isDefault: member.isDefault
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
        const userId = await getUserId(req);
        const subscriptions2 = await storage.getSubscriptions(userId);
        const monthlySpending = calculateTotalMonthlySpending(subscriptions2);
        const activeCount = subscriptions2.filter((sub) => sub.active).length;
        const nextDue = getUpcomingSubscription(subscriptions2);
        res.json({
          isHousehold: false,
          monthlySpending,
          activeCount,
          nextDue: nextDue ? {
            date: nextDue.dueDate,
            service: nextDue.name,
            amount: nextDue.amount
          } : null
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch summary" });
    }
  });
  app2.get("/api/subscriptions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subscription = await storage.getSubscription(id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      const userId = await getUserId(req);
      if (subscription.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized access to subscription" });
      }
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });
  app2.post("/api/subscriptions", validateSubscription, async (req, res) => {
    try {
      const newSubscription = await storage.createSubscription(req.body);
      res.status(201).json(newSubscription);
    } catch (error) {
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });
  app2.put("/api/subscriptions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subscription = await storage.getSubscription(id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      const userId = await getUserId(req);
      if (subscription.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized access to subscription" });
      }
      const updatedSubscription = await storage.updateSubscription(id, {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : void 0,
        userId
        // Ensure userId doesn't change
      });
      res.json(updatedSubscription);
    } catch (error) {
      res.status(500).json({ error: "Failed to update subscription" });
    }
  });
  app2.delete("/api/subscriptions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subscription = await storage.getSubscription(id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
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
  app2.get("/api/categories", async (req, res) => {
    try {
      const categories2 = await storage.getCategories();
      res.json(categories2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  app2.get("/api/services", async (req, res) => {
    try {
      const services2 = await storage.getServices();
      res.json(services2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });
  app2.post("/api/services/custom", async (req, res) => {
    try {
      const { name, category, averagePrice, icon } = req.body;
      if (!name || !category || !averagePrice || !icon) {
        return res.status(400).json({ error: "Missing required fields" });
      }
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
  app2.get("/api/notifications", async (req, res) => {
    try {
      const userId = await getUserId(req);
      const notifications2 = await storage.getNotifications(userId);
      res.json(notifications2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });
  app2.get("/api/settings/notifications", async (req, res) => {
    try {
      const userId = await getUserId(req);
      const settings = await storage.getNotificationSettings(userId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notification settings" });
    }
  });
  app2.put("/api/settings/notifications", validateNotificationSettings, async (req, res) => {
    try {
      const userId = await getUserId(req);
      await storage.updateNotificationSettings(userId, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update notification settings" });
    }
  });
  app2.post("/api/notifications/test", async (req, res) => {
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
        html: "<p>This is a test notification from <strong>SubTrackr</strong>.</p>"
      });
      res.json({ success: true, message: "Test notification sent" });
    } catch (error) {
      res.status(500).json({ error: "Failed to send test notification" });
    }
  });
  app2.get("/api/users", async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      res.json(users2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch household members" });
    }
  });
  app2.post("/api/users", async (req, res) => {
    try {
      const newUser = await storage.createUser(req.body);
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to create household member" });
    }
  });
  app2.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "Household member not found" });
      }
      const currentUserId = await getUserId(req);
      const updatedUser = await storage.updateUser(id, req.body);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update household member" });
    }
  });
  app2.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "Household member not found" });
      }
      if (user.isDefault) {
        return res.status(400).json({ error: "Cannot delete the default household member" });
      }
      const currentUserId = await getUserId(req);
      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete household member" });
    }
  });
  app2.put("/api/users/:id/set-default", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "Household member not found" });
      }
      const currentUserId = await getUserId(req);
      const updatedUser = await storage.setDefaultUser(id);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to set default household member" });
    }
  });
  app2.get("/api/settings/apikeys", async (req, res) => {
    try {
      const userId = await getUserId(req);
      const apiKeys2 = await storage.getApiKeys(userId);
      const maskedApiKeys = apiKeys2.map((key) => ({
        ...key,
        apiKey: `${key.apiKey.substring(0, 4)}...${key.apiKey.substring(key.apiKey.length - 4)}`
      }));
      res.json(maskedApiKeys);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });
  app2.post("/api/settings/apikeys", async (req, res) => {
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
      const maskedApiKey = {
        ...newApiKey,
        apiKey: `${newApiKey.apiKey.substring(0, 4)}...${newApiKey.apiKey.substring(newApiKey.apiKey.length - 4)}`
      };
      res.status(201).json(maskedApiKey);
    } catch (error) {
      res.status(500).json({ error: "Failed to save API key" });
    }
  });
  app2.put("/api/settings/apikeys/:id", async (req, res) => {
    try {
      const userId = await getUserId(req);
      const id = parseInt(req.params.id);
      const { apiKey, enabled } = req.body;
      const existingKey = await storage.getApiKeys(userId);
      const userOwnsKey = existingKey.some((key) => key.id === id);
      if (!userOwnsKey) {
        return res.status(403).json({ error: "Unauthorized access to API key" });
      }
      const updatedKey = await storage.updateApiKey(id, {
        apiKey,
        enabled
      });
      const maskedApiKey = {
        ...updatedKey,
        apiKey: `${updatedKey.apiKey.substring(0, 4)}...${updatedKey.apiKey.substring(updatedKey.apiKey.length - 4)}`
      };
      res.json(maskedApiKey);
    } catch (error) {
      res.status(500).json({ error: "Failed to update API key" });
    }
  });
  app2.delete("/api/settings/apikeys/:id", async (req, res) => {
    try {
      const userId = await getUserId(req);
      const id = parseInt(req.params.id);
      const existingKey = await storage.getApiKeys(userId);
      const userOwnsKey = existingKey.some((key) => key.id === id);
      if (!userOwnsKey) {
        return res.status(403).json({ error: "Unauthorized access to API key" });
      }
      await storage.deleteApiKey(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete API key" });
    }
  });
  app2.get("/api/web-push/vapid-public-key", (req, res) => {
    const publicKey = getVapidPublicKey();
    if (!publicKey) {
      return res.status(500).json({ error: "Web Push not configured" });
    }
    res.json({ publicKey });
  });
  app2.post("/api/web-push/subscribe", async (req, res) => {
    try {
      const userId = await getUserId(req);
      const subscription = req.body;
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ error: "Invalid push subscription" });
      }
      if (!getVapidPublicKey()) {
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
      const { notificationManager: notificationManager2 } = await init_notification_manager().then(() => notification_manager_exports);
      await notificationManager2.updateUserSettings(userId, {
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
  app2.post("/api/notifications/test/:channel", async (req, res) => {
    try {
      const userId = await getUserId(req);
      const channel = req.params.channel;
      if (!["email", "pushbullet", "pushover", "webpush"].includes(channel)) {
        return res.status(400).json({ error: "Invalid notification channel" });
      }
      const { notificationManager: notificationManager2 } = await init_notification_manager().then(() => notification_manager_exports);
      await notificationManager2.initializeUserSettings(userId);
      if (channel === "pushbullet") {
        const apiKey = await storage.getApiKeyByService(userId, "pushbullet");
        if (!apiKey) {
          return res.status(400).json({ error: "Pushbullet API key not found" });
        }
        await notificationManager2.updateUserSettings(userId, {
          pushbulletApiKey: apiKey.apiKey,
          channels: {
            email: true,
            pushbullet: true,
            pushover: false,
            webpush: false
          }
        });
      }
      if (channel === "pushover") {
        const apiKey = await storage.getApiKeyByService(userId, "pushover");
        if (!apiKey) {
          return res.status(400).json({ error: "Pushover API key not found" });
        }
        const parts = apiKey.apiKey.split(":");
        if (parts.length !== 2) {
          return res.status(400).json({ error: "Invalid Pushover API key format. Expected format: 'token:userkey'" });
        }
        const [pushoverApiKey, pushoverUserKey2] = parts;
        if (!pushoverApiKey || pushoverApiKey.length < 10 || !pushoverUserKey2 || pushoverUserKey2.length < 10) {
          return res.status(400).json({
            error: "Invalid Pushover API key or user key format",
            details: `API key length: ${pushoverApiKey ? pushoverApiKey.length : 0}, User key length: ${pushoverUserKey2 ? pushoverUserKey2.length : 0}. Both should be at least 10 characters.`
          });
        }
        await notificationManager2.updateUserSettings(userId, {
          pushoverApiKey,
          pushoverUserKey: pushoverUserKey2,
          channels: {
            email: true,
            pushbullet: false,
            pushover: true,
            webpush: false
          }
        });
      }
      if (channel === "webpush") {
        const subscription = req.body.subscription;
        if (subscription) {
          await notificationManager2.updateUserSettings(userId, {
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
        success = await notificationManager2.sendTestNotification(userId, channel);
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
      res.json({ success: true, message: `Test notification sent via ${channel}` });
    } catch (error) {
      res.status(500).json({ error: "Failed to send test notification" });
    }
  });
  return httpServer;
}

// server/index.ts
await init_vite();
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: false
  }, () => {
    log(`serving on port ${port}`);
  });
})();
