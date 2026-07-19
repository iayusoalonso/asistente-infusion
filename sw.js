const CACHE_NAME = 'infusion-app-v8';
const ASSETS = [
  '/asistente-infusion/',
  '/asistente-infusion/index.html',
  '/asistente-infusion/style.css',
  '/asistente-infusion/app.js',
  '/asistente-infusion/i18n.js',
  '/asistente-infusion/manifest.json',
  '/asistente-infusion/vendor/NoSleep.min.js',
  '/asistente-infusion/icon-192.png',
  '/asistente-infusion/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => {
          return caches.match('/asistente-infusion/index.html');
        })
      );
    })
  );
});

// Para actualización automática segura
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
