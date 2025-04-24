
import axios from 'axios';
import { log } from './vite';

// Interface for Pushover notification options
export interface PushoverOptions {
  title: string;
  message: string;
  url?: string;
  urlTitle?: string;
  priority?: number;
  sound?: string;
  device?: string;
}

let pushoverUserKey: string | null = null;
let pushoverApiToken: string | null = null;

/**
 * Initialize the Pushover client with the API token and user key
 * @param apiToken The Pushover API token
 * @param userKey The Pushover user key
 * @returns Boolean indicating whether initialization was successful
 */
export function initializePushover(apiToken: string, userKey: string): boolean {
  try {
    if (!apiToken || !userKey) {
      log('No Pushover API token or user key provided', 'pushover-service');
      return false;
    }

    // Trim whitespace from the token and key
    const trimmedToken = apiToken.trim();
    const trimmedKey = userKey.trim();

    // Validate that the API token and user key are in the expected format
    // Pushover API tokens are typically 30 characters
    // User keys are typically 30 characters
    if (trimmedToken.length < 10 || trimmedKey.length < 10) {
      log(`Invalid Pushover API token or user key format - token length: ${trimmedToken.length}, key length: ${trimmedKey.length}`, 'pushover-service');
      return false;
    }

    // Validate the token doesn't contain a colon as it would indicate wrong format
    if (trimmedToken.includes(':') || trimmedKey.includes(':')) {
      log('Invalid Pushover token or key - contains colon character', 'pushover-service');
      return false;
    }

    pushoverApiToken = trimmedToken;
    pushoverUserKey = trimmedKey;
    log('Pushover client initialized', 'pushover-service');
    return true;
  } catch (error) {
    log(`Failed to initialize Pushover client: ${error instanceof Error ? error.message : 'Unknown error'}`, 'pushover-service');
    return false;
  }
}

/**
 * Send a push notification via Pushover
 * @param options Pushover notification options
 * @returns Promise resolving to boolean indicating success
 */
export async function sendPushoverNotification(options: PushoverOptions): Promise<boolean> {
  try {
    if (!pushoverApiToken || !pushoverUserKey) {
      log('Pushover client not initialized', 'pushover-service');
      throw new Error('Pushover client not initialized');
    }

    const payload = {
      token: pushoverApiToken,
      user: pushoverUserKey,
      title: options.title,
      message: options.message,
      url: options.url,
      url_title: options.urlTitle,
      priority: options.priority || 0,
      sound: options.sound,
      device: options.device
    };

    log(`Sending Pushover notification to ${pushoverUserKey.substring(0, 5)}...`, 'pushover-service');
    
    try {
      const response = await axios.post('https://api.pushover.net/1/messages.json', payload);
      
      if (response.status === 200) {
        log(`Push notification sent: ${options.title}`, 'pushover-service');
        return true;
      } else {
        log(`Failed to send push notification: ${response.statusText}`, 'pushover-service');
        throw new Error(`Pushover API returned status ${response.status}: ${response.statusText}`);
      }
    } catch (axiosError: any) {
      if (axiosError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        log(`Pushover API error: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`, 'pushover-service');
        throw new Error(`Pushover API error: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
      } else if (axiosError.request) {
        // The request was made but no response was received
        log('No response received from Pushover API', 'pushover-service');
        throw new Error('No response received from Pushover API');
      } else {
        // Something happened in setting up the request that triggered an Error
        log(`Error setting up Pushover request: ${axiosError.message}`, 'pushover-service');
        throw new Error(`Error setting up Pushover request: ${axiosError.message}`);
      }
    }
  } catch (error) {
    log(`Failed to send push notification: ${error instanceof Error ? error.message : 'Unknown error'}`, 'pushover-service');
    throw error;
  }
}

/**
 * Send a subscription reminder via Pushover
 * @param subscriptionName Name of the subscription
 * @param dueDate Due date for the subscription payment
 * @param amount Subscription amount
 * @returns Promise resolving to boolean indicating success
 */
export async function sendSubscriptionReminderPushover(
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
  const message = `Your ${subscriptionName} subscription payment of ${formattedAmount} is due on ${formattedDate}.`;

  return sendPushoverNotification({ 
    title, 
    message,
    priority: 0,
    sound: 'pushover' 
  });
}

/**
 * Send a test notification to verify Pushover setup
 * @returns Promise resolving to boolean indicating success
 */
export async function sendPushoverTest(): Promise<boolean> {
  return sendPushoverNotification({
    title: 'SubTrackr Test Notification',
    message: 'This is a test notification from SubTrackr to verify your Pushover setup.'
  });
}

export default {
  initializePushover,
  sendPushoverNotification,
  sendSubscriptionReminderPushover,
  sendPushoverTest
};
