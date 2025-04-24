import type { BillingCycle } from './types';

export const CATEGORIES = [
  'Entertainment',
  'Music',
  'Productivity',
  'Security',
  'Utilities',
  'Health',
  'Gaming',
  'Education',
  'Food',
  'Other'
];

export const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'weekly', label: 'Weekly' },
];

export const DEFAULT_SERVICES = [
  {
    name: 'Netflix',
    category: 'Entertainment',
    averagePrice: 14.99,
    icon: 'Film'
  },
  {
    name: 'Spotify',
    category: 'Music',
    averagePrice: 9.99,
    icon: 'Music'
  },
  {
    name: 'Amazon Prime',
    category: 'Entertainment',
    averagePrice: 12.99,
    icon: 'ShoppingBag'
  },
  {
    name: 'Adobe Creative Cloud',
    category: 'Productivity',
    averagePrice: 52.99,
    icon: 'Layers'
  },
  {
    name: 'Microsoft 365',
    category: 'Productivity',
    averagePrice: 6.99,
    icon: 'FileText'
  },
  {
    name: 'NordVPN',
    category: 'Security',
    averagePrice: 11.99,
    icon: 'Shield'
  },
  {
    name: 'Disney+',
    category: 'Entertainment',
    averagePrice: 7.99,
    icon: 'Tv'
  },
  {
    name: 'YouTube Premium',
    category: 'Entertainment',
    averagePrice: 11.99,
    icon: 'Youtube'
  },
  {
    name: 'Apple Music',
    category: 'Music',
    averagePrice: 9.99,
    icon: 'Music'
  },
  {
    name: 'Hulu',
    category: 'Entertainment',
    averagePrice: 7.99,
    icon: 'Film'
  },
  {
    name: 'HBO Max',
    category: 'Entertainment',
    averagePrice: 14.99,
    icon: 'Film'
  },
  {
    name: 'Apple TV+',
    category: 'Entertainment',
    averagePrice: 4.99,
    icon: 'Tv'
  },
  {
    name: 'iCloud',
    category: 'Utilities',
    averagePrice: 2.99,
    icon: 'Cloud'
  },
  {
    name: 'Dropbox',
    category: 'Utilities',
    averagePrice: 11.99,
    icon: 'HardDrive'
  },
  {
    name: 'Google One',
    category: 'Utilities',
    averagePrice: 1.99,
    icon: 'Cloud'
  },
  {
    name: 'Slack',
    category: 'Productivity',
    averagePrice: 7.99,
    icon: 'MessageSquare'
  },
  {
    name: 'Notion',
    category: 'Productivity',
    averagePrice: 5.00,
    icon: 'FileText'
  },
];

export const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const DEFAULT_USER = {
  username: 'demo_user',
  email: 'demo@example.com',
  notificationEnabled: true,
  reminderDays: 7
};

export const MOCK_AVATAR_INITIALS = 'JS';
export const MOCK_USER_NAME = 'John Smith';
