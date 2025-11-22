const CACHE = "farm-field-v4";

// IMPORTANT: correct GitHub Pages paths
const ROOT = "/farm-field-table/";

const FILES = [
  ROOT,
  ROOT + "index.html",
  ROOT + "daily-report.html",
  ROOT + "app.js",
  ROOT + "manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((n) => {
          if (n !== CACHE) return caches.delete(n);
        })
      )
    )
  );
  self.clients.claim();
});

// Online → update cache
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  if (url.origin === location.origin) {
    return e.respondWith(
      fetch(e.request)
        .then((resp) => {
          const clone = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
          return resp;
        })
        .catch(() => caches.match(e.request))
    );
  }

  return e.respondWith(fetch(e.request));
});
