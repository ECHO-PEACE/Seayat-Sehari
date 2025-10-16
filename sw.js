
self.addEventListener('install', function(event) {
  self.skipWaiting();
});
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', function(event) {
  // simple network-first strategy
  event.respondWith(fetch(event.request).catch(function(){ return caches.match(event.request); }));
});
