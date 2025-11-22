// Clean and safe service worker — NO CACHING (prevents old broken files loading)

const CACHE_NAME = "farm-v3";

self.addEventListener("install", event => {
    // Activate immediately
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    // Remove ALL old caches so new code always loads
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            )
        )
    );
    self.clients.claim();
});

// Do NOT cache files — always fetch newest from GitHub
self.addEventListener("fetch", event => {
    event.respondWith(fetch(event.request));
});
