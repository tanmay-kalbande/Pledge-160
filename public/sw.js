// Service Worker for Pledge 160 - Provides offline support and caching
const CACHE_NAME = 'pledge160-v4';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json'
];

// Install - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip Supabase API calls (always fetch from network)
    if (event.request.url.includes('supabase.co')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone and cache successful responses
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Fallback to cache if network fails
                return caches.match(event.request);
            })
    );
});

// Push Notification Handler
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Pledge 160';
    const options = {
        body: data.body || 'You have a new notification',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'partnership-request',
        requireInteraction: true,
        data: data.url || '/'
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If app is already open, focus it
            for (const client of clientList) {
                if (client.url === event.notification.data && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data);
            }
        })
    );
});
