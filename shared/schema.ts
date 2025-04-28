import { pgTable, text, serial, integer, boolean, timestamp, real, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Now represents household members instead of authenticated users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),  // Changed from username to name
  email: text("email"),
  color: text("color").default("#3b82f6"), // Color for UI representation
  notificationEnabled: boolean("notification_enabled").default(true),
  reminderDays: integer("reminder_days").default(7),
  isDefault: boolean("is_default").default(false), // Flag for the default household member
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  service: text("service").notNull(), // 'pushbullet', 'pushover', etc.
  apiKey: text("api_key").notNull(),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  amount: real("amount").notNull(),
  dueDate: timestamp("due_date").notNull(),
  billingCycle: text("billing_cycle").notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull(),
});

export const servicePlans = pgTable("service_plans", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});


export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
  averagePrice: real("average_price"),
  icon: text("icon"),
  plans: text("plans"),  // JSON-encoded array of plans
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subscriptionId: integer("subscription_id").notNull(),
  message: text("message").notNull(),
  dueDate: timestamp("due_date").notNull(),
  sent: boolean("sent").default(false),
  sentAt: timestamp("sent_at"),
  type: text("type").notNull(), // email, push, etc.
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  color: true,
  notificationEnabled: true,
  reminderDays: true,
  isDefault: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  userId: true,
  name: true,
  category: true,
  description: true,
  amount: true,
  dueDate: true,
  billingCycle: true,
  active: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  color: true,
});

export const insertServicePlanSchema = createInsertSchema(servicePlans).pick({
  serviceId: true,
  name: true,
  price: true,
  description: true,
});

export const insertServiceSchema = createInsertSchema(services).pick({
  name: true,
  category: true,
  averagePrice: true,
  icon: true,
  plans: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  subscriptionId: true,
  message: true,
  dueDate: true,
  sent: true,
  sentAt: true,
  type: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).pick({
  userId: true,
  service: true,
  apiKey: true,
  enabled: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export type InsertServicePlan = z.infer<typeof insertServicePlanSchema>;
export type ServicePlan = typeof servicePlans.$inferSelect;


export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;