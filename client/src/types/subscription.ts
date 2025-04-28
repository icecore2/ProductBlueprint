export type BillingCycle = 'monthly' | 'yearly' | 'quarterly';

export interface SubscriptionFormData {
  name: string;
  category: string;
  amount: number;
  dueDate: Date;
  billingCycle: BillingCycle;
  description?: string;
} 