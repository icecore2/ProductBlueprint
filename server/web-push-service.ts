import webpush from 'web-push';
import { log } from './vite';

// Interface for Web Push notification options
export interface WebPushOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
  url?: string;
}

let vapidPublicKey: string | null = null;
let vapidPrivateKey: string | null = null;

/**
 * Initialize the Web Push service with VAPID keys
 * @param publicKey VAPID public key
 * @param privateKey VAPID private key
 * @param email Contact email for VAPID
 * @returns Boolean indicating whether initialization was successful
 */
export function initializeWebPush(publicKey: string, privateKey: string, email: string): boolean {
  try {
    if (!publicKey || !privateKey || !email) {
      log('Missing VAPID keys or contact email', 'web-push-service');
      return false;
    }

    vapidPublicKey = publicKey;
    vapidPrivateKey = privateKey;

    webpush.setVapidDetails(
      `mailto:${email}`,
      publicKey,
      privateKey
    );

    log('Web Push service initialized', 'web-push-service');
    return true;
  } catch (error) {
    log(`Failed to initialize Web Push service: ${error instanceof Error ? error.message : 'Unknown error'}`, 'web-push-service');
    return false;
  }
}

/**
 * Get the VAPID public key for browser subscription
 * @returns VAPID public key or null if not initialized
 */
export function getVapidPublicKey(): string | null {
  return vapidPublicKey;
}

/**
 * Send a web push notification
 * @param subscription PushSubscription object from browser
 * @param options Notification options
 * @returns Promise resolving to boolean indicating success
 */
export async function sendWebPushNotification(
  subscription: webpush.PushSubscription,
  options: WebPushOptions
): Promise<boolean> {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      log('Web Push service not initialized', 'web-push-service');
      return false;
    }

    const payload = JSON.stringify({
      title: options.title,
      body: options.body,
      icon: options.icon,
      tag: options.tag,
      data: options.data,
      url: options.url
    });

    await webpush.sendNotification(subscription, payload);
    log(`Web Push notification sent: ${options.title}`, 'web-push-service');
    return true;
  } catch (error) {
    log(`Failed to send Web Push notification: ${error instanceof Error ? error.message : 'Unknown error'}`, 'web-push-service');
    return false;
  }
}

/**
 * Send a subscription reminder via Web Push
 * @param subscription PushSubscription object from browser
 * @param subscriptionName Name of the subscription
 * @param dueDate Due date for the subscription payment
 * @param amount Subscription amount
 * @returns Promise resolving to boolean indicating success
 */
export async function sendSubscriptionReminderWebPush(
  subscription: webpush.PushSubscription,
  subscriptionName: string,
  dueDate: Date,
  amount: number
): Promise<boolean> {
  const formattedDate = dueDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

  return sendWebPushNotification(
    subscription,
    {
      title: `SubTrackr: ${subscriptionName} payment due soon`,
      body: `Your ${subscriptionName} subscription payment of ${formattedAmount} is due on ${formattedDate}.`,
      tag: 'subscription-reminder',
      data: {
        subscriptionName,
        dueDate: dueDate.toISOString(),
        amount
      }
    }
  );
}

/**
 * Send a test notification to verify Web Push setup
 * @param subscription PushSubscription object from browser
 * @returns Promise resolving to boolean indicating success
 */
export async function sendWebPushTest(subscription: webpush.PushSubscription): Promise<boolean> {
  return sendWebPushNotification(
    subscription,
    {
      title: 'SubTrackr Test Notification',
      body: 'This is a test notification from SubTrackr to verify your Web Push setup.',
      tag: 'test-notification'
    }
  );
}

export default {
  initializeWebPush,
  getVapidPublicKey,
  sendWebPushNotification,
  sendSubscriptionReminderWebPush,
  sendWebPushTest
};