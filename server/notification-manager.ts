import { log } from './vite';
import { sendEmail, sendSubscriptionReminder } from './email-service';
import {
  initializePushbullet,
  sendPushbulletNotification,
  sendSubscriptionReminderPushbullet
} from './pushbullet-service';
import {
  initializePushover,
  sendPushoverNotification,
  sendSubscriptionReminderPushover
} from './pushover-service';
import {
  initializeWebPush,
  sendWebPushNotification,
  sendSubscriptionReminderWebPush
} from './web-push-service';
import { storage } from './storage';
import type { Subscription } from '@shared/schema';
import type { PushSubscription } from 'web-push';

// Supported notification channels
export type NotificationChannel = 'email' | 'pushbullet' | 'pushover' | 'webpush';

// Configuration status for each channel
interface ChannelStatus {
  initialized: boolean;
  enabled: boolean;
  error?: string;
}

// Notification settings for a user
export interface UserNotificationSettings {
  userId: number;
  email?: string;
  pushbulletApiKey?: string;
  pushoverApiKey?: string;
  pushoverUserKey?: string;
  webPushSubscription?: any;
  channels: Record<NotificationChannel, boolean>;
  reminderDays: number;
}

// Class to manage notification channels
export class NotificationManager {
  private static instance: NotificationManager;
  private channelStatus: Record<NotificationChannel, ChannelStatus>;
  private userSettings: Map<number, UserNotificationSettings>;

  private constructor() {
    // Initialize channel status
    this.channelStatus = {
      email: { initialized: true, enabled: true }, // Email is always initialized
      pushbullet: { initialized: false, enabled: false },
      pushover: { initialized: false, enabled: false },
      webpush: { initialized: false, enabled: false }
    };
    
    this.userSettings = new Map();
  }

  /**
   * Get the NotificationManager instance (singleton)
   */
  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Initialize a user's notification settings
   */
  public async initializeUserSettings(userId: number): Promise<UserNotificationSettings> {
    try {
      // If we already have settings for this user, return them
      if (this.userSettings.has(userId)) {
        return this.userSettings.get(userId)!;
      }

      // Get the user from storage
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // Get notification settings
      const notificationSettings = await storage.getNotificationSettings(userId);

      // Create default user settings
      const settings: UserNotificationSettings = {
        userId,
        email: user.email || undefined,
        channels: {
          email: true,
          pushbullet: false,
          pushover: false,
          webpush: false
        },
        reminderDays: notificationSettings.reminderDays
      };

      // Store and return settings
      this.userSettings.set(userId, settings);
      return settings;
    } catch (error) {
      log(`Failed to initialize user settings: ${error instanceof Error ? error.message : 'Unknown error'}`, 'notification-manager');
      throw error;
    }
  }

  /**
   * Update a user's notification settings
   */
  public async updateUserSettings(userId: number, settings: Partial<UserNotificationSettings>): Promise<UserNotificationSettings> {
    try {
      // Make sure user settings are initialized
      if (!this.userSettings.has(userId)) {
        await this.initializeUserSettings(userId);
      }

      const currentSettings = this.userSettings.get(userId)!;
      
      // Update settings
      const updatedSettings: UserNotificationSettings = {
        ...currentSettings,
        ...settings,
        channels: {
          ...currentSettings.channels,
          ...(settings.channels || {})
        }
      };

      // If Pushbullet API key is provided, initialize it
      if (settings.pushbulletApiKey && settings.pushbulletApiKey !== currentSettings.pushbulletApiKey) {
        this.channelStatus.pushbullet.initialized = initializePushbullet(settings.pushbulletApiKey);
        this.channelStatus.pushbullet.enabled = this.channelStatus.pushbullet.initialized;
        
        if (!this.channelStatus.pushbullet.initialized) {
          this.channelStatus.pushbullet.error = 'Failed to initialize Pushbullet';
        }
      }

      // If Pushover API key is provided, initialize it
      if (settings.pushoverApiKey && settings.pushoverUserKey && 
         (settings.pushoverApiKey !== currentSettings.pushoverApiKey || 
          settings.pushoverUserKey !== currentSettings.pushoverUserKey)) {
        this.channelStatus.pushover.initialized = initializePushover(
          settings.pushoverApiKey, 
          settings.pushoverUserKey
        );
        this.channelStatus.pushover.enabled = this.channelStatus.pushover.initialized;
        
        if (!this.channelStatus.pushover.initialized) {
          this.channelStatus.pushover.error = 'Failed to initialize Pushover';
        }
      }

      // If Web Push subscription is provided, enable the channel
      if (settings.webPushSubscription && 
         JSON.stringify(settings.webPushSubscription) !== JSON.stringify(currentSettings.webPushSubscription)) {
        // We don't need to initialize web push on a per-user basis
        // VAPID keys are set globally
        this.channelStatus.webpush.enabled = true;
        updatedSettings.channels.webpush = true;
      }

      // Store updated settings
      this.userSettings.set(userId, updatedSettings);

      // Update storage if reminder days changed
      if (settings.reminderDays !== undefined && settings.reminderDays !== currentSettings.reminderDays) {
        await storage.updateNotificationSettings(userId, {
          enabled: true, // Assume enabled if updating
          reminderDays: settings.reminderDays
        });
      }

      return updatedSettings;
    } catch (error) {
      log(`Failed to update user settings: ${error instanceof Error ? error.message : 'Unknown error'}`, 'notification-manager');
      throw error;
    }
  }

  /**
   * Get status of all notification channels
   */
  public getChannelStatus(): Record<NotificationChannel, ChannelStatus> {
    return { ...this.channelStatus };
  }

  /**
   * Send a subscription reminder through all enabled channels
   */
  public async sendSubscriptionReminders(
    userId: number,
    subscription: Subscription
  ): Promise<Record<NotificationChannel, boolean>> {
    try {
      // Make sure user settings are initialized
      if (!this.userSettings.has(userId)) {
        await this.initializeUserSettings(userId);
      }

      const settings = this.userSettings.get(userId)!;
      const results: Record<NotificationChannel, boolean> = {
        email: false,
        pushbullet: false,
        pushover: false,
        webpush: false
      };

      // Send email notification if enabled
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
          log(`Failed to send email notification: ${error instanceof Error ? error.message : 'Unknown error'}`, 'notification-manager');
        }
      }

      // Send Pushbullet notification if enabled
      if (settings.channels.pushbullet && this.channelStatus.pushbullet.initialized) {
        try {
          results.pushbullet = await sendSubscriptionReminderPushbullet(
            subscription.name,
            new Date(subscription.dueDate),
            subscription.amount
          );
        } catch (error) {
          log(`Failed to send Pushbullet notification: ${error instanceof Error ? error.message : 'Unknown error'}`, 'notification-manager');
        }
      }

      // Send Pushover notification if enabled
      if (settings.channels.pushover && this.channelStatus.pushover.initialized) {
        try {
          results.pushover = await sendSubscriptionReminderPushover(
            subscription.name,
            new Date(subscription.dueDate),
            subscription.amount
          );
        } catch (error) {
          log(`Failed to send Pushover notification: ${error instanceof Error ? error.message : 'Unknown error'}`, 'notification-manager');
        }
      }

      // Send Web Push notification if enabled
      if (settings.channels.webpush && settings.webPushSubscription) {
        try {
          results.webpush = await sendSubscriptionReminderWebPush(
            settings.webPushSubscription as PushSubscription,
            subscription.name,
            new Date(subscription.dueDate),
            subscription.amount
          );
        } catch (error) {
          log(`Failed to send Web Push notification: ${error instanceof Error ? error.message : 'Unknown error'}`, 'notification-manager');
        }
      }

      return results;
    } catch (error) {
      log(`Failed to send subscription reminders: ${error instanceof Error ? error.message : 'Unknown error'}`, 'notification-manager');
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
  public async sendTestNotification(
    userId: number,
    channel: NotificationChannel
  ): Promise<boolean> {
    try {
      // Make sure user settings are initialized
      if (!this.userSettings.has(userId)) {
        await this.initializeUserSettings(userId);
      }

      const settings = this.userSettings.get(userId)!;

      switch (channel) {
        case 'email':
          if (!settings.email) {
            return false;
          }
          await sendEmail({
            to: settings.email,
            subject: 'SubTrackr Test Notification',
            text: 'This is a test notification from SubTrackr.',
            html: '<p>This is a test notification from <strong>SubTrackr</strong>.</p>'
          });
          return true;

        case 'pushbullet':
          if (!this.channelStatus.pushbullet.initialized) {
            return false;
          }
          return await sendPushbulletNotification({
            title: 'SubTrackr Test Notification',
            body: 'This is a test notification from SubTrackr.'
          });

        case 'pushover':
          if (!this.channelStatus.pushover.initialized) {
            return false;
          }
          return await sendPushoverNotification({
            title: 'SubTrackr Test Notification',
            message: 'This is a test notification from SubTrackr.'
          });
        
        case 'webpush':
          if (!settings.webPushSubscription) {
            return false;
          }
          return await sendSubscriptionReminderWebPush(
            settings.webPushSubscription as PushSubscription,
            'Test Subscription',
            new Date(Date.now() + 86400000), // Tomorrow
            9.99
          );
        
        default:
          return false;
      }
    } catch (error) {
      log(`Failed to send test notification: ${error instanceof Error ? error.message : 'Unknown error'}`, 'notification-manager');
      return false;
    }
  }
}

// Export singleton instance
export const notificationManager = NotificationManager.getInstance();

export default notificationManager;