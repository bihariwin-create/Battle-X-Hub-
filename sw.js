// Minimal service worker — only exists to satisfy PWA "installable" criteria.
// It intentionally does NOT cache HTML pages, so users always get the latest
// content and the existing auto-update banner keeps working correctly.

const CACHE_NAME = 'battle-x-hub-static-v1';
const STATIC_ASSETS = [
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Never intercept HTML navigations — always go to network so updates show up.
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }
  // For static icons only, try cache first for speed, fall back to network.
  if (STATIC_ASSETS.some((asset) => req.url.endsWith(asset))) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
    return;
  }
  // Everything else: just pass through to the network as normal.
});
