import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  BellRing, 
  Mail, 
  AlertCircle, 
  MessageSquare, 
  Smartphone, 
  ExternalLink, 
  Loader2
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useNotificationSettings } from '@/hooks/use-subscriptions';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import SubscriptionService, { PushSubscriptionData } from '@/lib/subscription-service';

// Type for notification channels
type NotificationChannel = 'email' | 'webpush' | 'pushbullet' | 'pushover';

// API Key interface 
interface ApiKey {
  id: number;
  userId: number;
  service: string;
  apiKey: string;
  enabled: boolean;
}

const NotificationsPage: React.FC = () => {
  const { toast } = useToast();
  const { settings, updateSettings } = useNotificationSettings();
  
  // Channel states
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [webPushEnabled, setWebPushEnabled] = useState(false);
  const [pushbulletEnabled, setPushbulletEnabled] = useState(false);
  const [pushoverEnabled, setPushoverEnabled] = useState(false);
  
  // Configuration states
  const [webPushSupported, setWebPushSupported] = useState(false);
  const [webPushPermission, setWebPushPermission] = useState<NotificationPermission | null>(null);
  const [email, setEmail] = useState("john.smith@example.com");
  const [pushbulletKey, setPushbulletKey] = useState("");
  const [pushoverKey, setPushoverKey] = useState("");
  const [pushoverUser, setPushoverUser] = useState("");
  
  // UI states
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<NotificationChannel>('email');
  const [isAddingPushbullet, setIsAddingPushbullet] = useState(false);
  const [isAddingPushover, setIsAddingPushover] = useState(false);
  
  // Fetch API keys
  const { data: apiKeys = [], isLoading: isLoadingApiKeys } = useQuery<ApiKey[]>({
    queryKey: ['/api/settings/apikeys'],
    queryFn: SubscriptionService.fetchApiKeys,
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Initialize state from API keys
  useEffect(() => {
    if (apiKeys.length > 0) {
      // Find Pushbullet API key
      const pushbulletApiKey = apiKeys.find((key) => key.service === 'pushbullet');
      if (pushbulletApiKey) {
        setPushbulletEnabled(pushbulletApiKey.enabled);
        setPushbulletKey(pushbulletApiKey.apiKey); // This will be masked
      }
      
      // Find Pushover API key
      const pushoverApiKey = apiKeys.find((key) => key.service === 'pushover');
      if (pushoverApiKey) {
        setPushoverEnabled(pushoverApiKey.enabled);
        // Store masked version for display
        setPushoverKey(pushoverApiKey.apiKey);
      }
    }
  }, [apiKeys]);
  
  // Check if browser supports web push notifications
  useEffect(() => {
    const isWebPushSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    setWebPushSupported(isWebPushSupported);

    if (isWebPushSupported && 'Notification' in window) {
      setWebPushPermission(Notification.permission);
      
      // If already granted, update the state
      if (Notification.permission === 'granted') {
        setWebPushEnabled(true);
      }
    }
  }, []);
  
  // Handle web push subscription
  const handleWebPushToggle = async (checked: boolean) => {
    if (!webPushSupported) {
      toast({
        title: 'Browser not supported',
        description: 'Your browser does not support web push notifications',
        variant: 'destructive'
      });
      return;
    }

    setWebPushEnabled(checked);

    if (checked) {
      try {
        setIsSubscribing(true);

        // Request permission if not already granted
        if (webPushPermission !== 'granted') {
          const permission = await Notification.requestPermission();
          setWebPushPermission(permission);
          
          if (permission !== 'granted') {
            toast({
              title: 'Permission denied',
              description: 'You need to allow notifications in your browser',
              variant: 'destructive'
            });
            setWebPushEnabled(false);
            setIsSubscribing(false);
            return;
          }
        }

        // Get VAPID public key
        const vapidPublicKey = await SubscriptionService.getVapidPublicKey();
        
        // Register service worker if not already registered
        const registration = await navigator.serviceWorker.ready;
        
        // Get existing subscription or create a new one
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          // Convert VAPID public key to Uint8Array
          const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
          
          // Subscribe to push notifications
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey
          });
        }
        
        // Send subscription to server
        await SubscriptionService.subscribeToWebPush(subscription.toJSON() as unknown as PushSubscriptionData);
        
        toast({
          title: 'Notifications enabled',
          description: 'You will now receive browser notifications',
        });
      } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
        toast({
          title: 'Subscription failed',
          description: 'Failed to enable browser notifications',
          variant: 'destructive'
        });
        setWebPushEnabled(false);
      } finally {
        setIsSubscribing(false);
      }
    }
  };
  
  // Handle Pushbullet setup
  const handleAddPushbullet = async () => {
    if (!pushbulletKey) {
      toast({
        title: 'API Key Required',
        description: 'Please enter your Pushbullet API key',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsAddingPushbullet(true);
      
      // Save API key to server
      await SubscriptionService.saveApiKey('pushbullet', pushbulletKey);
      
      setPushbulletEnabled(true);
      
      toast({
        title: 'Pushbullet Connected',
        description: 'Your Pushbullet account has been connected successfully'
      });
    } catch (error) {
      console.error('Failed to set up Pushbullet:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect your Pushbullet account. Please check your API key and try again.',
        variant: 'destructive'
      });
    } finally {
      setIsAddingPushbullet(false);
    }
  };
  
  // Handle Pushover setup
  const handleAddPushover = async () => {
    if (!pushoverKey || !pushoverUser) {
      toast({
        title: 'API Keys Required',
        description: 'Please enter both your Pushover API token and User key',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsAddingPushover(true);
      
      // Format must be exactly "token:userkey" with no extra spaces
      const apiToken = pushoverKey.trim();
      const userKey = pushoverUser.trim();
      const combinedKey = `${apiToken}:${userKey}`;
      
      await SubscriptionService.saveApiKey('pushover', combinedKey);
      
      setPushoverEnabled(true);
      
      toast({
        title: 'Pushover Connected',
        description: 'Your Pushover account has been connected successfully'
      });
    } catch (error) {
      console.error('Failed to set up Pushover:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect your Pushover account. Please check your API keys and try again.',
        variant: 'destructive'
      });
    } finally {
      setIsAddingPushover(false);
    }
  };

  // Handle reminder days change
  const handleReminderDaysChange = (value: string) => {
    if (settings.data) {
      updateSettings.mutate({
        enabled: settings.data.enabled,
        reminderDays: parseInt(value, 10)
      });
    }
  };

  // Handle enabled change for reminders
  const handleEnabledChange = (enabled: boolean) => {
    if (settings.data) {
      updateSettings.mutate({
        enabled,
        reminderDays: settings.data.reminderDays
      });
    }
  };

  // Send test notification for the selected channel
  const sendTestNotification = async () => {
    try {
      setIsSendingTest(true);
      
      switch (selectedChannel) {
        case 'webpush':
          // Check if browser supports notifications
          if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            toast({
              title: 'Browser not supported',
              description: 'Your browser does not support web push notifications',
              variant: 'destructive'
            });
            return;
          }
          
          // Check permission
          if (Notification.permission !== 'granted') {
            toast({
              title: 'Permission needed',
              description: 'You need to enable browser notifications first',
              variant: 'destructive'
            });
            return;
          }
          
          // Get registration and subscription
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          
          if (!subscription) {
            toast({
              title: 'Not subscribed',
              description: 'You need to enable browser notifications first',
              variant: 'destructive'
            });
            return;
          }
          
          // Send test notification
          await SubscriptionService.sendTestNotification(
            'webpush', 
            subscription.toJSON() as unknown as PushSubscriptionData
          );
          break;
          
        case 'pushbullet':
          if (!pushbulletEnabled) {
            toast({
              title: 'Pushbullet not enabled',
              description: 'Please connect your Pushbullet account first',
              variant: 'destructive'
            });
            return;
          }
          
          await SubscriptionService.sendTestNotification('pushbullet');
          break;
          
        case 'pushover':
          if (!pushoverEnabled) {
            toast({
              title: 'Pushover not enabled',
              description: 'Please connect your Pushover account first',
              variant: 'destructive'
            });
            return;
          }
          
          await SubscriptionService.sendTestNotification('pushover')
            .catch(err => {
              console.error('Pushover test notification failed:', err);
              toast({
                title: 'Pushover Error',
                description: 'Failed to send Pushover notification. Please check your API key and user key.',
                variant: 'destructive'
              });
              setIsSendingTest(false);
              throw err; // Re-throw to stop further execution
            });
          break;
          
        case 'email':
        default:
          // Send email test notification
          await SubscriptionService.sendTestNotification('email');
          break;
      }
      
      // Show success message
      const channelNames = {
        email: 'email',
        webpush: 'browser notifications',
        pushbullet: 'Pushbullet',
        pushover: 'Pushover'
      };
      
      toast({
        title: 'Test notification sent',
        description: `A test notification has been sent via ${channelNames[selectedChannel]}`,
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send test notification',
        variant: 'destructive'
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Convert base64 string to Uint8Array for VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  };

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-800">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">Manage how and when you receive subscription alerts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Configure how you want to be notified about upcoming subscriptions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Methods */}
          <div className="space-y-5">
            <h3 className="text-md font-semibold">Notification Channels</h3>
            
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-50 rounded-md text-blue-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-500">
                    Receive email notifications for upcoming subscriptions
                  </p>
                </div>
              </div>
              <Switch 
                checked={emailEnabled}
                onCheckedChange={setEmailEnabled}
              />
            </div>
            
            {emailEnabled && (
              <div className="ml-11">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  type="email" 
                  id="email" 
                  placeholder="your@email.com" 
                  className="mt-1 max-w-md" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}
            
            {/* Web Push Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-50 rounded-md text-purple-600">
                  <BellRing className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Browser Notifications</p>
                  <p className="text-sm text-gray-500">
                    Receive push notifications in your browser
                    {!webPushSupported && " (Not supported in your browser)"}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                {isSubscribing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <Switch 
                  disabled={!webPushSupported || isSubscribing}
                  checked={webPushEnabled}
                  onCheckedChange={handleWebPushToggle}
                />
              </div>
            </div>
            
            {/* Pushbullet */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-50 rounded-md text-green-600">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Pushbullet</p>
                  <p className="text-sm text-gray-500">
                    Send notifications to your devices via Pushbullet
                  </p>
                </div>
              </div>
              <Switch 
                checked={pushbulletEnabled}
                disabled={isLoadingApiKeys || !pushbulletKey}
                onCheckedChange={setPushbulletEnabled}
              />
            </div>
            
            {(!pushbulletEnabled || !pushbulletKey) && (
              <div className="ml-11">
                <div className="flex flex-col space-y-2 max-w-md">
                  <div>
                    <Label htmlFor="pushbullet-key">API Key</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input 
                        type="password" 
                        id="pushbullet-key" 
                        placeholder="Your Pushbullet API key" 
                        value={pushbulletKey}
                        onChange={(e) => setPushbulletKey(e.target.value)}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleAddPushbullet}
                        disabled={isAddingPushbullet || !pushbulletKey}
                      >
                        {isAddingPushbullet && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Connect
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    <a 
                      href="https://www.pushbullet.com/#settings/account" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      Get your API key from Pushbullet
                    </a>
                  </div>
                </div>
              </div>
            )}
            
            {/* Pushover */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-amber-50 rounded-md text-amber-600">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Pushover</p>
                  <p className="text-sm text-gray-500">
                    Send alerts to your devices via Pushover app
                  </p>
                </div>
              </div>
              <Switch 
                checked={pushoverEnabled}
                disabled={isLoadingApiKeys || !pushoverKey || !pushoverUser}
                onCheckedChange={setPushoverEnabled}
              />
            </div>
            
            {(!pushoverEnabled || !pushoverKey || !pushoverUser) && (
              <div className="ml-11">
                <div className="flex flex-col space-y-2 max-w-md">
                  <div>
                    <Label htmlFor="pushover-key">API Token</Label>
                    <Input 
                      type="password" 
                      id="pushover-key" 
                      placeholder="Your Pushover application API token" 
                      className="mt-1"
                      value={pushoverKey}
                      onChange={(e) => setPushoverKey(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pushover-user">User Key</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input 
                        type="password" 
                        id="pushover-user" 
                        placeholder="Your Pushover user key" 
                        value={pushoverUser}
                        onChange={(e) => setPushoverUser(e.target.value)}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleAddPushover}
                        disabled={isAddingPushover || !pushoverKey || !pushoverUser}
                      >
                        {isAddingPushover && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Connect
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    <a 
                      href="https://pushover.net/apps/build" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      Register a Pushover application
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Reminder Preferences */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold">Reminder Preferences</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Reminders</p>
                <p className="text-sm text-gray-500">
                  Toggle all subscription reminders
                </p>
              </div>
              <Switch 
                checked={settings.data?.enabled || false}
                onCheckedChange={handleEnabledChange}
                disabled={settings.isLoading || updateSettings.isPending}
              />
            </div>

            <div>
              <Label htmlFor="reminder-days">Reminder Days Before Due Date</Label>
              <Select 
                value={settings.data?.reminderDays?.toString() || '7'}
                onValueChange={handleReminderDaysChange}
                disabled={settings.isLoading || updateSettings.isPending || !settings.data?.enabled}
              >
                <SelectTrigger id="reminder-days" className="w-full mt-1 max-w-xs">
                  <SelectValue placeholder="Select days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Days before due date</SelectLabel>
                    <SelectItem value="1">1 day before</SelectItem>
                    <SelectItem value="3">3 days before</SelectItem>
                    <SelectItem value="5">5 days before</SelectItem>
                    <SelectItem value="7">1 week before</SelectItem>
                    <SelectItem value="14">2 weeks before</SelectItem>
                    <SelectItem value="30">1 month before</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Test Notifications */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <h3 className="text-md font-semibold">Test Notifications</h3>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-48">
                <Select 
                  defaultValue={selectedChannel}
                  onValueChange={(value) => setSelectedChannel(value as NotificationChannel)}
                >
                  <SelectTrigger id="test-channel">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Channels</SelectLabel>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="webpush" disabled={!webPushEnabled}>Browser</SelectItem>
                      <SelectItem value="pushbullet" disabled={!pushbulletEnabled}>Pushbullet</SelectItem>
                      <SelectItem value="pushover" disabled={!pushoverEnabled}>Pushover</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                onClick={sendTestNotification}
                disabled={isSendingTest}
                className="flex-shrink-0"
              >
                {isSendingTest && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isSendingTest ? 'Sending...' : 'Send Test Notification'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;
