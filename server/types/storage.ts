export interface User {
  id: number;
  name: string;
  color: string | null;
  email: string | null;
  notificationEnabled: boolean | null;
  reminderDays: number | null;
  isDefault: boolean | null;
}

export interface Subscription {
  id: number;
  name: string;
  description: string | null;
  userId: number;
  createdAt: Date | null;
  category: string;
  amount: number;
  dueDate: Date;
  billingCycle: string;
  active: boolean | null;
}

export interface Service {
  id: number;
  name: string;
  icon: string | null;
  category: string;
  averagePrice: number | null;
}

export interface Notification {
  type: string;
  id: number;
  userId: number;
  dueDate: Date;
  subscriptionId: number;
  message: string;
  sent: boolean | null;
  sentAt: Date | null;
}

export interface ApiKey {
  enabled: boolean | null;
  id: number;
  userId: number;
  service: string;
  apiKey: string;
  createdAt: Date | null;
} 