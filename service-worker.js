const CACHE = "farm-field-v1";
const ROOT = "/farm-field-table/";
const FILES = [ ROOT, ROOT + "index.html", ROOT + "daily-report.html", ROOT + "app.js", ROOT + "manifest.json", ROOT + "icons/icon-192.png", ROOT + "icons/icon-512.png", ROOT + "icons/apple-icon-180.png" ];
self.addEventListener("install", (e)=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", (e)=>{ e.waitUntil(caches.keys().then(keys=> Promise.all(keys.map(k=> { if(k!==CACHE) return caches.delete(k); })))); self.clients.claim(); });
self.addEventListener("fetch", (e)=>{ const url = new URL(e.request.url); if(url.origin === location.origin){ e.respondWith(fetch(e.request).then(resp=>{ const clone = resp.clone(); caches.open(CACHE).then(cache=>cache.put(e.request, clone)); return resp; }).catch(()=>caches.match(e.request))); }else{ e.respondWith(fetch(e.request)); } });