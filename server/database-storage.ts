import { eq, and } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  subscriptions,
  categories,
  services,
  notifications,
  apiKeys,
  type User,
  type InsertUser,
  type Subscription,
  type InsertSubscription,
  type Category,
  type InsertCategory,
  type Service,
  type InsertService,
  type Notification,
  type InsertNotification,
  type ApiKey,
  type InsertApiKey
} from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByName(name: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.name, name));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    // Check if this is the default user
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }

    if (user.isDefault) {
      throw new Error('Cannot delete the default user');
    }

    const result = await db.delete(users).where(eq(users.id, id));
    if (!result) {
      throw new Error(`User with ID ${id} not found`);
    }
  }

  async setDefaultUser(id: number): Promise<User> {
    // Check if user exists
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }

    // Begin a transaction to ensure atomic updates
    // First, set all users to non-default
    await db
      .update(users)
      .set({ isDefault: false })
      .where(eq(users.isDefault, true));

    // Then set the specified user as default
    const [updatedUser] = await db
      .update(users)
      .set({ isDefault: true })
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  // Subscription operations
  async getSubscriptions(userId: number): Promise<Subscription[]> {
    return db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
  }

  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription;
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db
      .insert(subscriptions)
      .values({
        ...subscription,
        createdAt: new Date()
      })
      .returning();
    return newSubscription;
  }

  async updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription> {
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set(data)
      .where(eq(subscriptions.id, id))
      .returning();

    if (!updatedSubscription) {
      throw new Error(`Subscription with ID ${id} not found`);
    }

    return updatedSubscription;
  }

  async deleteSubscription(id: number): Promise<void> {
    const result = await db.delete(subscriptions).where(eq(subscriptions.id, id));
    if (!result) {
      throw new Error(`Subscription with ID ${id} not found`);
    }
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  // Service operations
  async getServices(): Promise<Service[]> {
    try {
      const result = await db.select().from(services);
      return result;
    } catch (error) {
      console.error("Error fetching services:", error);
      throw error;
    }
  }

  async createService(data: InsertService): Promise<Service> {
    try {
      const [newService] = await db
        .insert(services)
        .values(data)
        .returning();

      return newService;
    } catch (error) {
      console.error("Error creating service:", error);
      throw error;
    }
  }

  // Notification operations
  async getNotifications(userId: number): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async updateNotification(id: number, data: Partial<InsertNotification>): Promise<Notification> {
    const [updatedNotification] = await db
      .update(notifications)
      .set(data)
      .where(eq(notifications.id, id))
      .returning();

    if (!updatedNotification) {
      throw new Error(`Notification with ID ${id} not found`);
    }

    return updatedNotification;
  }

  async deleteNotification(id: number): Promise<void> {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    if (!result) {
      throw new Error(`Notification with ID ${id} not found`);
    }
  }

  // API key operations
  async getApiKeys(userId: number): Promise<ApiKey[]> {
    return db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
  }

  async getApiKeyByService(userId: number, service: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.userId, userId),
          eq(apiKeys.service, service)
        )
      );
    return apiKey;
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    // Check if an API key for this service already exists for the user
    const existingKey = await this.getApiKeyByService(apiKey.userId, apiKey.service);

    // If it exists, update it instead of creating a new one
    if (existingKey) {
      return this.updateApiKey(existingKey.id, apiKey);
    }

    const [newApiKey] = await db
      .insert(apiKeys)
      .values({
        ...apiKey,
        createdAt: new Date()
      })
      .returning();

    return newApiKey;
  }

  async updateApiKey(id: number, data: Partial<InsertApiKey>): Promise<ApiKey> {
    const [updatedApiKey] = await db
      .update(apiKeys)
      .set(data)
      .where(eq(apiKeys.id, id))
      .returning();

    if (!updatedApiKey) {
      throw new Error(`API key with ID ${id} not found`);
    }

    return updatedApiKey;
  }

  async deleteApiKey(id: number): Promise<void> {
    const result = await db.delete(apiKeys).where(eq(apiKeys.id, id));
    if (!result) {
      throw new Error(`API key with ID ${id} not found`);
    }
  }

  // Settings operations
  async getNotificationSettings(userId: number): Promise<{ enabled: boolean; reminderDays: number }> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    return {
      enabled: user.notificationEnabled ?? true,
      reminderDays: user.reminderDays ?? 7,
    };
  }

  async updateNotificationSettings(userId: number, settings: { enabled: boolean; reminderDays: number }): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    await db
      .update(users)
      .set({
        notificationEnabled: settings.enabled,
        reminderDays: settings.reminderDays,
      })
      .where(eq(users.id, userId));
  }
}