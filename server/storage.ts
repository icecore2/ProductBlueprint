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
import { DEFAULT_SERVICES, DEFAULT_USER } from "../client/src/lib/constants";

// Interface for storage operations
export interface IStorage {
  // Household member operations
  getUser(id: number): Promise<User | undefined>;
  getUserByName(name: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  setDefaultUser(id: number): Promise<User>;

  // Subscription operations
  getSubscriptions(userId: number): Promise<Subscription[]>;
  getSubscription(id: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription>;
  deleteSubscription(id: number): Promise<void>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Service operations
  getServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  
  // Notification operations
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: number, data: Partial<InsertNotification>): Promise<Notification>;
  deleteNotification(id: number): Promise<void>;
  
  // API key operations
  getApiKeys(userId: number): Promise<ApiKey[]>;
  getApiKeyByService(userId: number, service: string): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: number, data: Partial<InsertApiKey>): Promise<ApiKey>;
  deleteApiKey(id: number): Promise<void>;
  
  // Settings operations
  getNotificationSettings(userId: number): Promise<{ enabled: boolean; reminderDays: number }>;
  updateNotificationSettings(userId: number, settings: { enabled: boolean; reminderDays: number }): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private subscriptions: Map<number, Subscription>;
  private categories: Map<number, Category>;
  private services: Map<number, Service>;
  private notifications: Map<number, Notification>;
  private apiKeys: Map<number, ApiKey>;
  
  private userIdCounter: number;
  private subscriptionIdCounter: number;
  private categoryIdCounter: number;
  private serviceIdCounter: number;
  private notificationIdCounter: number;
  private apiKeyIdCounter: number;

  constructor() {
    this.users = new Map();
    this.subscriptions = new Map();
    this.categories = new Map();
    this.services = new Map();
    this.notifications = new Map();
    this.apiKeys = new Map();
    
    this.userIdCounter = 1;
    this.subscriptionIdCounter = 1;
    this.categoryIdCounter = 1;
    this.serviceIdCounter = 1;
    this.notificationIdCounter = 1;
    this.apiKeyIdCounter = 1;
    
    // Initialize with default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Add a default household member
    const defaultUser: InsertUser = {
      name: "Default Member", 
      email: "default@example.com",
      color: "#3b82f6", // Blue color
      notificationEnabled: true,
      reminderDays: 7,
      isDefault: true,
    };
    this.createUser(defaultUser);
    
    // Add default categories
    const categoryColors = {
      'Entertainment': '#3b82f6',
      'Music': '#8b5cf6',
      'Productivity': '#0ea5e9',
      'Security': '#4f46e5',
      'Utilities': '#10b981',
      'Health': '#ef4444',
      'Gaming': '#f97316',
      'Education': '#eab308',
      'Food': '#f59e0b',
      'Other': '#6b7280',
    };

    Object.entries(categoryColors).forEach(([name, color]) => {
      this.createCategory({ name, color });
    });
    
    // Add default services
    DEFAULT_SERVICES.forEach(service => {
      this.createService({
        name: service.name,
        category: service.category,
        averagePrice: service.averagePrice,
        icon: service.icon,
      });
    });
    
    // Add some sample subscriptions for the default user
    const sampleSubscriptions: Omit<InsertSubscription, 'id'>[] = [
      {
        userId: 1,
        name: 'Netflix',
        category: 'Entertainment',
        amount: 14.99,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        billingCycle: 'monthly',
        active: true,
        description: 'Standard HD plan',
      },
      {
        userId: 1,
        name: 'Spotify',
        category: 'Music',
        amount: 9.99,
        dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
        billingCycle: 'monthly',
        active: true,
        description: 'Premium individual plan',
      },
      {
        userId: 1,
        name: 'NordVPN',
        category: 'Security',
        amount: 11.99,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        billingCycle: 'monthly',
        active: true,
        description: 'Standard plan',
      },
      {
        userId: 1,
        name: 'Adobe Creative Cloud',
        category: 'Productivity',
        amount: 52.99,
        dueDate: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000), // 24 days from now
        billingCycle: 'monthly',
        active: true,
        description: 'All apps plan',
      },
    ];
    
    sampleSubscriptions.forEach(sub => this.createSubscription(sub));
  }

  // Household member operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByName(name: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.name === name) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser: User = {
      ...user,
      ...data,
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    if (!this.users.has(id)) {
      throw new Error(`User with ID ${id} not found`);
    }

    // Check if this is the default user
    const user = await this.getUser(id);
    if (user?.isDefault) {
      throw new Error('Cannot delete the default user');
    }

    this.users.delete(id);
  }

  async setDefaultUser(id: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }

    // Reset all other users to non-default
    for (const [userId, existingUser] of this.users.entries()) {
      if (existingUser.isDefault && userId !== id) {
        this.users.set(userId, { ...existingUser, isDefault: false });
      }
    }

    // Set the new default user
    const updatedUser: User = { ...user, isDefault: true };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Subscription operations
  async getSubscriptions(userId: number): Promise<Subscription[]> {
    const userSubscriptions: Subscription[] = [];
    for (const subscription of this.subscriptions.values()) {
      if (subscription.userId === userId) {
        userSubscriptions.push(subscription);
      }
    }
    return userSubscriptions;
  }

  async getSubscription(id: number): Promise<Subscription | undefined> {
    return this.subscriptions.get(id);
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const id = this.subscriptionIdCounter++;
    const now = new Date();
    const newSubscription: Subscription = {
      ...subscription,
      id,
      createdAt: now,
    };
    this.subscriptions.set(id, newSubscription);
    return newSubscription;
  }

  async updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) {
      throw new Error(`Subscription with ID ${id} not found`);
    }
    
    const updatedSubscription: Subscription = {
      ...subscription,
      ...data,
    };
    
    this.subscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }

  async deleteSubscription(id: number): Promise<void> {
    if (!this.subscriptions.has(id)) {
      throw new Error(`Subscription with ID ${id} not found`);
    }
    this.subscriptions.delete(id);
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  // Service operations
  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async createService(service: InsertService): Promise<Service> {
    const id = this.serviceIdCounter++;
    const newService: Service = { ...service, id };
    this.services.set(id, newService);
    return newService;
  }

  // Notification operations
  async getNotifications(userId: number): Promise<Notification[]> {
    const userNotifications: Notification[] = [];
    for (const notification of this.notifications.values()) {
      if (notification.userId === userId) {
        userNotifications.push(notification);
      }
    }
    return userNotifications;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const newNotification: Notification = { ...notification, id };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async updateNotification(id: number, data: Partial<InsertNotification>): Promise<Notification> {
    const notification = this.notifications.get(id);
    if (!notification) {
      throw new Error(`Notification with ID ${id} not found`);
    }
    
    const updatedNotification: Notification = {
      ...notification,
      ...data,
    };
    
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async deleteNotification(id: number): Promise<void> {
    if (!this.notifications.has(id)) {
      throw new Error(`Notification with ID ${id} not found`);
    }
    this.notifications.delete(id);
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
    
    const updatedUser: User = {
      ...user,
      notificationEnabled: settings.enabled,
      reminderDays: settings.reminderDays,
    };
    
    this.users.set(userId, updatedUser);
  }

  // API Key operations
  async getApiKeys(userId: number): Promise<ApiKey[]> {
    const userApiKeys: ApiKey[] = [];
    for (const apiKey of this.apiKeys.values()) {
      if (apiKey.userId === userId) {
        userApiKeys.push(apiKey);
      }
    }
    return userApiKeys;
  }

  async getApiKeyByService(userId: number, service: string): Promise<ApiKey | undefined> {
    for (const apiKey of this.apiKeys.values()) {
      if (apiKey.userId === userId && apiKey.service === service) {
        return apiKey;
      }
    }
    return undefined;
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    // Check if an API key for this service already exists for the user
    const existingKey = await this.getApiKeyByService(apiKey.userId, apiKey.service);
    
    // If it exists, update it instead of creating a new one
    if (existingKey) {
      return this.updateApiKey(existingKey.id, apiKey);
    }
    
    const id = this.apiKeyIdCounter++;
    const now = new Date();
    const newApiKey: ApiKey = {
      ...apiKey,
      id,
      createdAt: now
    };
    
    this.apiKeys.set(id, newApiKey);
    return newApiKey;
  }

  async updateApiKey(id: number, data: Partial<InsertApiKey>): Promise<ApiKey> {
    const apiKey = this.apiKeys.get(id);
    if (!apiKey) {
      throw new Error(`API key with ID ${id} not found`);
    }
    
    const updatedApiKey: ApiKey = {
      ...apiKey,
      ...data,
      // Preserve userId and service when updating
      userId: data.userId || apiKey.userId,
      service: data.service || apiKey.service,
    };
    
    this.apiKeys.set(id, updatedApiKey);
    return updatedApiKey;
  }

  async deleteApiKey(id: number): Promise<void> {
    if (!this.apiKeys.has(id)) {
      throw new Error(`API key with ID ${id} not found`);
    }
    this.apiKeys.delete(id);
  }
}

// Import DatabaseStorage
import { DatabaseStorage } from "./database-storage";

// Create and export storage instance
// Use DatabaseStorage instead of MemStorage for persistent storage
export const storage = new DatabaseStorage();
