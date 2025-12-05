const CACHE_NAME = 'vision-map-cache-v1';
// List the assets you want to cache on install (your main index.html, CSS, JS, etc.)
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css', // If you have a main style file
  '/app.js',     // If you have a main JS bundle
  '/icons/icon-192x192.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return the response
        if (response) {
          return response;
        }
        // No cache match - fetch from network
        return fetch(event.request);
      })
  );
});

// Add an activate event to clean up old caches (optional but recommended)
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
