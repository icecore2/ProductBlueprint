import nodemailer from 'nodemailer';
import { log } from './vite';

// Interface for email objects
export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// For production, you would use actual SMTP settings
// For demo purposes, we'll use a mock service that logs emails
let transporter: nodemailer.Transporter;

// Initialize the email transport
function initializeTransport() {
  // In production, you would use something like:
  // const transportConfig = {
  //   host: process.env.SMTP_HOST || 'smtp.example.com',
  //   port: parseInt(process.env.SMTP_PORT || '587', 10),
  //   secure: process.env.SMTP_SECURE === 'true',
  //   auth: {
  //     user: process.env.SMTP_USER || '',
  //     pass: process.env.SMTP_PASS || '',
  //   },
  // };

  // For development/demo, we'll use nodemailer's "ethereal" test account
  // This creates a temporary test account that we can use to view sent emails
  if (process.env.NODE_ENV === 'development') {
    // Create a test account for demo purposes
    nodemailer.createTestAccount().then((testAccount) => {
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      log('Created test email account', 'email-service');
    }).catch(error => {
      log(`Failed to create test email account: ${error.message}`, 'email-service');
      createFallbackTransport();
    });
  } else {
    createFallbackTransport();
  }
}

// Create a fallback transport that just logs emails
function createFallbackTransport() {
  transporter = {
    sendMail: async (options: nodemailer.SendMailOptions) => {
      log(`Email would be sent: 
        To: ${options.to}
        Subject: ${options.subject}
        Text: ${options.text?.substring(0, 100)}${options.text && options.text.length > 100 ? '...' : ''}`, 
      'email-service');
      
      return {
        accepted: [options.to],
        rejected: [],
        response: 'OK: simulated email sent',
        messageId: `mock-${Date.now()}@subtrackr.app`
      };
    }
  } as unknown as nodemailer.Transporter;
}

// Initialize on import
initializeTransport();

/**
 * Send an email
 * @param options Email options including to, subject, text and optional html
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    if (!transporter) {
      log('Email transporter not initialized', 'email-service');
      createFallbackTransport();
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: '"SubTrackr" <notifications@subtrackr.app>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development' && 'messageUrl' in info) {
      // Log the URL to view the email in the Ethereal inbox
      log(`Email preview URL: ${info.messageUrl}`, 'email-service');
    }
  } catch (error) {
    log(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`, 'email-service');
    throw error;
  }
}

/**
 * Send a subscription reminder email
 * @param to Recipient email address
 * @param subscriptionName Name of the subscription
 * @param dueDate Due date for the subscription payment
 * @param amount Subscription amount
 */
export async function sendSubscriptionReminder(
  to: string,
  subscriptionName: string,
  dueDate: Date,
  amount: number
): Promise<void> {
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

  const subject = `Reminder: ${subscriptionName} payment due soon`;
  
  const text = `
    Hello,

    This is a reminder that your ${subscriptionName} subscription payment of ${formattedAmount} is due on ${formattedDate}.

    To view more details or update this subscription, please visit your SubTrackr dashboard.

    Best regards,
    The SubTrackr Team
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Subscription Payment Reminder</h2>
      <p>Hello,</p>
      <p>This is a reminder that your <strong>${subscriptionName}</strong> subscription payment is due soon.</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 16px; margin: 20px 0;">
        <p><strong>Subscription:</strong> ${subscriptionName}</p>
        <p><strong>Amount:</strong> ${formattedAmount}</p>
        <p><strong>Due Date:</strong> ${formattedDate}</p>
      </div>
      <p>To view more details or update this subscription, please visit your SubTrackr dashboard.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
        <p>Best regards,<br>The SubTrackr Team</p>
      </div>
    </div>
  `;

  await sendEmail({
    to,
    subject,
    text,
    html,
  });
}

/**
 * Schedule notifications for upcoming subscription payments
 * This function would normally run on a scheduled basis (via cron, etc.)
 * But for this demo we'll have it run on-demand
 */
export async function checkAndSendDueNotifications(
  storage: any, 
  notificationSettings: { userId: number, enabled: boolean, reminderDays: number }[]
): Promise<void> {
  try {
    for (const setting of notificationSettings) {
      if (!setting.enabled) continue;
      
      const userId = setting.userId;
      const reminderDays = setting.reminderDays;
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user || !user.email) continue;
      
      // Get all active subscriptions for this user
      const subscriptions = await storage.getSubscriptions(userId);
      const now = new Date();
      
      // Calculate the comparison date for notifications
      const notificationThreshold = new Date();
      notificationThreshold.setDate(notificationThreshold.getDate() + reminderDays);
      
      for (const subscription of subscriptions) {
        if (!subscription.active) continue;
        
        const dueDate = new Date(subscription.dueDate);
        
        // Check if the subscription is due within the reminder period
        // and if it's in the future (not already past due)
        if (dueDate <= notificationThreshold && dueDate > now) {
          // Check if we've already sent a notification for this
          const existingNotifications = await storage.getNotifications(userId);
          const alreadyNotified = existingNotifications.some(n => 
            n.subscriptionId === subscription.id && 
            new Date(n.dueDate).getTime() === dueDate.getTime() &&
            n.sent
          );
          
          if (!alreadyNotified) {
            // Send email notification
            await sendSubscriptionReminder(
              user.email,
              subscription.name,
              dueDate,
              subscription.amount
            );
            
            // Record the notification
            await storage.createNotification({
              userId,
              subscriptionId: subscription.id,
              message: `Your ${subscription.name} subscription payment of $${subscription.amount} is due on ${dueDate.toLocaleDateString()}.`,
              dueDate,
              sent: true,
              sentAt: new Date(),
              type: 'email'
            });
            
            log(`Sent notification for ${subscription.name} to user ${userId}`, 'email-service');
          }
        }
      }
    }
  } catch (error) {
    log(`Error sending notifications: ${error instanceof Error ? error.message : 'Unknown error'}`, 'email-service');
  }
}

export default {
  sendEmail,
  sendSubscriptionReminder,
  checkAndSendDueNotifications
};
