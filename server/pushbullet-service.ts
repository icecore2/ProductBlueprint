import PushBullet from 'pushbullet';
import { log } from './vite';

// Interface for Pushbullet notification options
export interface PushbulletOptions {
  title: string;
  body: string;
  url?: string;
  deviceIden?: string;
}

let pushbulletClient: any = null;

/**
 * Initialize the Pushbullet client with the API key
 * @param apiKey The Pushbullet API key
 * @returns Boolean indicating whether initialization was successful
 */
export function initializePushbullet(apiKey: string): boolean {
  try {
    if (!apiKey) {
      log('No Pushbullet API key provided', 'pushbullet-service');
      return false;
    }

    pushbulletClient = new PushBullet(apiKey);
    log('Pushbullet client initialized', 'pushbullet-service');
    return true;
  } catch (error) {
    log(`Failed to initialize Pushbullet client: ${error instanceof Error ? error.message : 'Unknown error'}`, 'pushbullet-service');
    return false;
  }
}

/**
 * Send a push notification via Pushbullet
 * @param options Pushbullet notification options
 * @returns Promise resolving to boolean indicating success
 */
export async function sendPushbulletNotification(options: PushbulletOptions): Promise<boolean> {
  try {
    if (!pushbulletClient) {
      log('Pushbullet client not initialized', 'pushbullet-service');
      return false;
    }

    // If a specific device is targeted
    if (options.deviceIden) {
      await pushbulletClient.note(options.deviceIden, options.title, options.body);
    } else {
      // Send to all devices
      await pushbulletClient.note(null, options.title, options.body);
    }

    log(`Push notification sent: ${options.title}`, 'pushbullet-service');
    return true;
  } catch (error) {
    log(`Failed to send push notification: ${error instanceof Error ? error.message : 'Unknown error'}`, 'pushbullet-service');
    return false;
  }
}

/**
 * Get a list of user's devices from Pushbullet
 * @returns Promise resolving to array of devices
 */
export async function getPushbulletDevices(): Promise<any[]> {
  try {
    if (!pushbulletClient) {
      log('Pushbullet client not initialized', 'pushbullet-service');
      return [];
    }

    const response = await pushbulletClient.devices();
    return response.devices || [];
  } catch (error) {
    log(`Failed to get Pushbullet devices: ${error instanceof Error ? error.message : 'Unknown error'}`, 'pushbullet-service');
    return [];
  }
}

/**
 * Send a subscription reminder via Pushbullet
 * @param subscriptionName Name of the subscription
 * @param dueDate Due date for the subscription payment
 * @param amount Subscription amount
 * @returns Promise resolving to boolean indicating success
 */
export async function sendSubscriptionReminderPushbullet(
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

  const title = `SubTrackr: ${subscriptionName} payment due soon`;
  const body = `Your ${subscriptionName} subscription payment of ${formattedAmount} is due on ${formattedDate}.`;

  return sendPushbulletNotification({ title, body });
}

/**
 * Send a test notification to verify Pushbullet setup
 * @returns Promise resolving to boolean indicating success
 */
export async function sendPushbulletTest(): Promise<boolean> {
  return sendPushbulletNotification({
    title: 'SubTrackr Test Notification',
    body: 'This is a test notification from SubTrackr to verify your Pushbullet setup.'
  });
}

export default {
  initializePushbullet,
  sendPushbulletNotification,
  getPushbulletDevices,
  sendSubscriptionReminderPushbullet,
  sendPushbulletTest
};