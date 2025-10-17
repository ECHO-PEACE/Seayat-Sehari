const CACHE_NAME = 'seayat-cache-v1';
const urlsToCache = [
  '/', // Root path
  '/index3.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.png', 
  '/logo.jpg', 
  'https://cdn.jsdelivr.net/npm/chart.js' 
];

// Event: Install - Service Worker diinstal dan aset statis di-cache
self.addEventListener('install', event => {
  console.log('[Service Worker] Menginstal dan Caching App Shell');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Membuka cache dan menambahkan URL');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Menginstruksikan SW baru untuk segera mengambil alih kontrol
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[Service Worker] Gagal menambah ke cache:', err);
      })
  );
});

// Event: Activate - Service Worker baru membersihkan cache lama
self.addEventListener('activate', event => {
  console.log('[Service Worker] Mengaktifkan dan Membersihkan Cache Lama');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Hapus cache yang tidak ada di whitelist
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        // Menginstruksikan SW untuk mengambil alih kontrol atas semua client
        return self.clients.claim();
    })
  );
});

// Event: Fetch - Service Worker mencegat permintaan jaringan
// Strategi: Cache-First (untuk aset yang sudah di-cache saat instal)
self.addEventListener('fetch', event => {
  // Hanya tangani permintaan GET
  if (event.request.method !== 'GET') {
    return;
  }
    
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache Hit: Mengembalikan aset dari cache
        if (response) {
          return response;
        }

        // Cache Miss: Ambil dari jaringan
        return fetch(event.request).then(
          networkResponse => {
            // Cek jika response valid (misal: bukan 404, type basic/CORS)
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'opaque') {
              return networkResponse;
            }

            // Kloning response karena response stream hanya bisa dibaca sekali
            const responseToCache = networkResponse.clone();
            
            // Simpan response jaringan ke cache (Cache-as-you-go)
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
            console.warn('[Service Worker] Fetch gagal:', error);
            // Anda bisa menambahkan fallback di sini, misalnya mengembalikan halaman offline khusus
        });
      })
  );
});