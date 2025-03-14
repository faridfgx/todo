// Service Worker for Vault To-Do App
const CACHE_NAME = 'vault-todo-v1';
const BASE_PATH = '/todo'; // GitHub Pages subdirectory
const ASSETS_TO_CACHE = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/app.js`,
  `${BASE_PATH}/styles.css`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/icon-192.png`,
  `${BASE_PATH}/icon-512.png`
];

// Install event - Cache initial assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - Serve from cache, then network with cache update
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If not in cache, fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache non-GET requests or if response is not ok
            if (event.request.method !== 'GET' || !networkResponse.ok) {
              return networkResponse;
            }
            
            // Clone the response as it can only be consumed once
            const responseToCache = networkResponse.clone();
            
            // Add to cache for future requests
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
              
            return networkResponse;
          })
          .catch(() => {
            // If both cache and network fail, return a fallback
            if (event.request.mode === 'navigate') {
              return caches.match(`${BASE_PATH}/index.html`);
            }
            
            return new Response('Network error occurred', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Handle background sync for adding tasks while offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

// Function to sync tasks when coming back online
async function syncTasks() {
  // In a real app, you might send pending tasks to a server here
  // For this local app, we're just notifying the user
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_COMPLETE',
      message: 'All changes synced successfully'
    });
  });
}