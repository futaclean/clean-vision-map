const CACHE_NAME = 'cleanfuta-static-v1';
const DYNAMIC_CACHE = 'cleanfuta-dynamic-v1';

// List of static files to pre-cache, including the PWA icon.
const urlsToCache = [
  '/',
  '/index.html',
  '/looo.png',  // <-- Your PWA icon
  // Add main CSS/JS bundles here if your build tool doesn't handle caching them automatically
];

// 1. Installation: Pre-cache static assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching static assets.');
        return cache.addAll(urlsToCache).catch(error => {
            console.error('[Service Worker] Failed to pre-cache some files:', error);
        });
      })
  );
  self.skipWaiting();
});

// 2. Fetching: Cache-first strategy for static content
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request)
                .then(networkResponse => {
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }
                    
                    const responseToCache = networkResponse.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return networkResponse;
                }).catch(() => {
                    return caches.match('/index.html'); 
                });
        })
    );
});

// 3. Activation: Clean up old caches
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating...');
    const cacheWhitelist = [CACHE_NAME, DYNAMIC_CACHE];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) 
    );
});
