const CACHE_NAME = 'infusion-app-v3'; // <--- Cambiado a v3 para forzar actualización
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './i18n.js',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/nosleep/0.12.0/NoSleep.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});
