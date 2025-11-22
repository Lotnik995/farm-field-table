// Clean and safe service worker

const CACHE_NAME = "farm-v3"; 

self.addEventListener("install", event => {
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(key => {
                if (key !== CACHE_NAME) return caches.delete(key);
            }))
        )
    );
    self.clients.claim();
});

// No file caching! Avoids breaking the app.
self.addEventListener("fetch", event => {
    event.respondWith(fetch(event.request));
});
