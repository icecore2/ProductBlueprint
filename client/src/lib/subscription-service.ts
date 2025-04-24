import { apiRequest } from './queryClient';
import type { Subscription, InsertSubscription, Category, Service } from '@shared/schema';

export interface PushSubscriptionData {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface ApiKey {
  id: number;
  userId: number;
  service: string;
  apiKey: string;
  enabled: boolean;
}

export const SubscriptionService = {
  /**
   * Fetches all subscriptions for the current user
   */
  async fetchSubscriptions(): Promise<Subscription[]> {
    const response = await apiRequest('/api/subscriptions');
    return response.json();
  },

  /**
   * Fetches a subscription by ID
   */
  async fetchSubscription(id: number): Promise<Subscription> {
    const response = await apiRequest(`/api/subscriptions/${id}`);
    return response.json();
  },

  /**
   * Creates a new subscription
   */
  async createSubscription(subscription: Omit<InsertSubscription, 'userId'>): Promise<Subscription> {
    const response = await apiRequest('/api/subscriptions', { 
      method: 'POST', 
      data: subscription 
    });
    return response.json();
  },

  /**
   * Updates an existing subscription
   */
  async updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription> {
    const response = await apiRequest(`/api/subscriptions/${id}`, { 
      method: 'PUT', 
      data: subscription 
    });
    return response.json();
  },

  /**
   * Deletes a subscription by ID
   */
  async deleteSubscription(id: number): Promise<void> {
    await apiRequest(`/api/subscriptions/${id}`, { method: 'DELETE' });
  },

  /**
   * Fetches all categories
   */
  async fetchCategories(): Promise<Category[]> {
    const response = await apiRequest('/api/categories');
    return response.json();
  },

  /**
   * Fetches all available services for import
   */
  async fetchServices(): Promise<Service[]> {
    const response = await apiRequest('/api/services');
    return response.json();
  },

  /**
   * Fetches summary stats for dashboard
   */
  async fetchSummary(): Promise<{
    monthlySpending: number;
    activeCount: number;
    nextDue: { date: string; service: string; amount: number } | null;
  }> {
    const response = await apiRequest('/api/subscriptions/summary');
    return response.json();
  },

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: { enabled: boolean; reminderDays: number }): Promise<void> {
    await apiRequest('/api/settings/notifications', {
      method: 'PUT',
      data: settings
    });
  },

  /**
   * Fetch notification settings
   */
  async fetchNotificationSettings(): Promise<{ enabled: boolean; reminderDays: number }> {
    const response = await apiRequest('/api/settings/notifications');
    return response.json();
  },
  
  /**
   * Gets VAPID public key for Web Push
   */
  async getVapidPublicKey(): Promise<string> {
    const response = await apiRequest('/api/web-push/vapid-public-key');
    const data = await response.json();
    return data.publicKey;
  },
  
  /**
   * Subscribes to Web Push notifications
   */
  async subscribeToWebPush(subscription: PushSubscriptionData): Promise<void> {
    await apiRequest('/api/web-push/subscribe', {
      method: 'POST',
      data: subscription
    });
  },
  
  /**
   * Sends a test notification through a specific channel
   */
  async sendTestNotification(channel: 'email' | 'pushbullet' | 'pushover' | 'webpush', subscription?: PushSubscriptionData): Promise<void> {
    await apiRequest(`/api/notifications/test/${channel}`, {
      method: 'POST',
      data: channel === 'webpush' && subscription ? { subscription } : undefined
    });
  },

  /**
   * Fetch API keys for the current user
   */
  async fetchApiKeys(): Promise<ApiKey[]> {
    const response = await apiRequest('/api/settings/apikeys');
    return response.json();
  },

  /**
   * Save or update an API key
   */
  async saveApiKey(service: string, apiKey: string, enabled: boolean = true): Promise<ApiKey> {
    const response = await apiRequest('/api/settings/apikeys', {
      method: 'POST',
      data: { service, apiKey, enabled }
    });
    return response.json();
  },

  /**
   * Update an existing API key
   */
  async updateApiKey(id: number, data: { apiKey?: string, enabled?: boolean }): Promise<ApiKey> {
    const response = await apiRequest(`/api/settings/apikeys/${id}`, {
      method: 'PUT',
      data
    });
    return response.json();
  },

  /**
   * Delete an API key
   */
  async deleteApiKey(id: number): Promise<void> {
    await apiRequest(`/api/settings/apikeys/${id}`, { method: 'DELETE' });
  }
};

export default SubscriptionService;
