// Service worker for web push notifications

self.addEventListener('push', function(event) {
  if (event.data) {
    // Parse the notification data
    const data = event.data.json();
    
    // Display the notification
    const options = {
      body: data.body || 'New notification from SubTrackr',
      icon: data.icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.tag || 'subscription-reminder',
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Open SubTrackr'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'SubTrackr', options)
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // This looks to see if the current window is already open and focuses it
  event.waitUntil(
    clients.matchAll({
      type: 'window'
    }).then(function(clientList) {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});