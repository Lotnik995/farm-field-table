const CACHE = 'farm-field-v1';
const FILES = ['/', '/index.html', '/styles.css', '/app.js', '/daily-report.html'];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', (e)=>{ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (e)=>{
  e.respondWith(caches.match(e.request).then(resp => resp || fetch(e.request)));
});
