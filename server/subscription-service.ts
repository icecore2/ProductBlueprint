import { storage } from "./storage";
import { sendSubscriptionReminder, checkAndSendDueNotifications } from "./email-service";
import type { Subscription, InsertSubscription } from "@shared/schema";
import { log } from "./vite";

/**
 * Service for managing subscriptions and related operations
 */
export class SubscriptionService {
  /**
   * Process all due notifications for all users
   * This would typically be run on a schedule, but for demo purposes
   * we'll make it available to be triggered manually
   */
  static async processNotifications(): Promise<void> {
    try {
      // Get all users
      const users = await this.getAllUsers();
      
      // For each user, get their notification settings
      const notificationSettings = await Promise.all(
        users.map(async (user) => {
          const settings = await storage.getNotificationSettings(user.id);
          return {
            userId: user.id,
            enabled: settings.enabled,
            reminderDays: settings.reminderDays,
          };
        })
      );
      
      // Process notifications
      await checkAndSendDueNotifications(storage, notificationSettings);
      
      log("Processed all due notifications", "subscription-service");
    } catch (error) {
      log(`Error processing notifications: ${error instanceof Error ? error.message : "Unknown error"}`, "subscription-service");
      throw error;
    }
  }
  
  /**
   * Calculate subscription statistics
   */
  static async calculateStats(userId: number): Promise<{
    totalMonthly: number;
    activeCount: number;
    nextDue: { subscription: Subscription; daysRemaining: number } | null;
    categoryBreakdown: { [key: string]: { count: number; total: number } };
  }> {
    try {
      const subscriptions = await storage.getSubscriptions(userId);
      
      // Calculate total monthly spending
      let totalMonthly = 0;
      const categoryBreakdown: { [key: string]: { count: number; total: number } } = {};
      
      subscriptions.forEach((sub) => {
        if (!sub.active) return;
        
        // Calculate normalized monthly amount
        let monthlyAmount = sub.amount;
        switch (sub.billingCycle) {
          case "yearly":
            monthlyAmount = sub.amount / 12;
            break;
          case "quarterly":
            monthlyAmount = sub.amount / 3;
            break;
          case "weekly":
            monthlyAmount = sub.amount * 4.33; // Average weeks per month
            break;
        }
        
        totalMonthly += monthlyAmount;
        
        // Calculate category breakdown
        if (!categoryBreakdown[sub.category]) {
          categoryBreakdown[sub.category] = { count: 0, total: 0 };
        }
        categoryBreakdown[sub.category].count += 1;
        categoryBreakdown[sub.category].total += monthlyAmount;
      });
      
      // Find next due subscription
      const now = new Date();
      let nextDue: { subscription: Subscription; daysRemaining: number } | null = null;
      
      subscriptions
        .filter((sub) => new Date(sub.dueDate) >= now)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .forEach((sub) => {
          if (!nextDue) {
            const dueDate = new Date(sub.dueDate);
            const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            nextDue = { subscription: sub, daysRemaining };
          }
        });
      
      // If no future subscriptions, get the most recently due
      if (!nextDue && subscriptions.length > 0) {
        const mostRecent = [...subscriptions]
          .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())[0];
        
        const dueDate = new Date(mostRecent.dueDate);
        const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        nextDue = { subscription: mostRecent, daysRemaining };
      }
      
      return {
        totalMonthly,
        activeCount: subscriptions.filter((sub) => sub.active).length,
        nextDue,
        categoryBreakdown,
      };
    } catch (error) {
      log(`Error calculating stats: ${error instanceof Error ? error.message : "Unknown error"}`, "subscription-service");
      throw error;
    }
  }
  
  /**
   * Send a test notification to a user
   */
  static async sendTestNotification(userId: number): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      
      if (!user || !user.email) {
        log(`Cannot send test notification: User ${userId} not found or has no email`, "subscription-service");
        return false;
      }
      
      // Create a fake subscription for the test
      const testSubscription: Partial<Subscription> = {
        name: "Test Subscription",
        amount: 9.99,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      };
      
      await sendSubscriptionReminder(
        user.email,
        testSubscription.name as string,
        testSubscription.dueDate as Date,
        testSubscription.amount as number
      );
      
      log(`Sent test notification to user ${userId}`, "subscription-service");
      return true;
    } catch (error) {
      log(`Error sending test notification: ${error instanceof Error ? error.message : "Unknown error"}`, "subscription-service");
      return false;
    }
  }
  
  /**
   * Helper method to get all users
   * In a real application, this would have pagination
   */
  private static async getAllUsers() {
    // Implementation is simplified for the demo
    // In a real app with a database, we'd use a more efficient query
    const userIds = [];
    for (let i = 1; i <= 100; i++) { // Arbitrary limit of 100 for demo
      const user = await storage.getUser(i);
      if (user) {
        userIds.push(user);
      } else {
        break; // Assume IDs are sequential
      }
    }
    return userIds;
  }
  
  /**
   * Create a new subscription
   */
  static async createSubscription(subscriptionData: Omit<InsertSubscription, "id">): Promise<Subscription> {
    try {
      const newSubscription = await storage.createSubscription(subscriptionData);
      log(`Created new subscription: ${newSubscription.name} for user ${newSubscription.userId}`, "subscription-service");
      return newSubscription;
    } catch (error) {
      log(`Error creating subscription: ${error instanceof Error ? error.message : "Unknown error"}`, "subscription-service");
      throw error;
    }
  }
  
  /**
   * Update an existing subscription
   */
  static async updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription> {
    try {
      const updatedSubscription = await storage.updateSubscription(id, data);
      log(`Updated subscription ${id}: ${updatedSubscription.name}`, "subscription-service");
      return updatedSubscription;
    } catch (error) {
      log(`Error updating subscription: ${error instanceof Error ? error.message : "Unknown error"}`, "subscription-service");
      throw error;
    }
  }
  
  /**
   * Delete a subscription
   */
  static async deleteSubscription(id: number): Promise<void> {
    try {
      await storage.deleteSubscription(id);
      log(`Deleted subscription ${id}`, "subscription-service");
    } catch (error) {
      log(`Error deleting subscription: ${error instanceof Error ? error.message : "Unknown error"}`, "subscription-service");
      throw error;
    }
  }
}

export default SubscriptionService;
