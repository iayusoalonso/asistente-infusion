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

// --- INSTALACIÓN ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => {
        // No activamos aún: esperamos a que el usuario cierre la app
        return self.skipWaiting();
      })
  );
});

// --- ACTIVACIÓN ---
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

// --- FETCH ---
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => {
          // Offline: si no está en caché, devuelve index.html
          return caches.match('/asistente-infusion/index.html');
        })
      );
    })
  );
});

// --- AVISO DE NUEVA VERSIÓN ---
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
