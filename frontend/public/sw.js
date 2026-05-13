// public/sw.js

// 1. Listen for the 'push' event from the server
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'New Message', body: 'You have a new update.' };

  const options = {
    body: data.body,
    icon: '/logo192.png', // Path to your Ashram logo
    badge: '/badge.png',
    data: { url: data.url }, // The URL to open when clicked
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Open Chat' },
      { action: 'close', title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 2. Handle Notification Clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/chat')
    );
  }
});