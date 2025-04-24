import { Subscription, Category, Service, Notification } from '@shared/schema';

export type SummaryStats = {
  monthlySpending: number;
  activeCount: number;
  nextDue: {
    date: string;
    service: string;
    amount: number;
  } | null;
};

export type CategorySummary = {
  category: string;
  total: number;
  count: number;
  percentage: number;
};

export type SubscriptionWithStatus = Subscription & {
  status: 'active' | 'upcoming' | 'overdue';
  timeRemaining: string;
};

export type BillingCycle = 'monthly' | 'yearly' | 'quarterly' | 'weekly';

export type SubscriptionFormData = {
  name: string;
  category: string;
  amount: number;
  dueDate: Date;
  billingCycle: BillingCycle;
  description?: string;
};

export type NotificationSettings = {
  enabled: boolean;
  reminderDays: number;
};

export type NotificationMethod = 'email' | 'push' | 'web';

export type NotificationPreferences = {
  methods: NotificationMethod[];
  reminderDays: number;
};
