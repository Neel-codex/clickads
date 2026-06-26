/* PocketOption AI Signal Pro - Service Worker
 * Offline app shell + network-first for navigation, cache-first for static assets.
 */
const CACHE_VERSION = 'v1';
const APP_SHELL_CACHE = `aisignal-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `aisignal-runtime-${CACHE_VERSION}`;

const APP_SHELL = ['/', '/offline', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![APP_SHELL_CACHE, RUNTIME_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Never cache Supabase / API calls.
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) {
    return;
  }

  // Navigation requests: network-first with offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/offline')),
        ),
    );
    return;
  }

  // Static assets: cache-first.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        }),
    ),
  );
});

// Push notifications (license/signal/announcement alerts).
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'AI Signal Pro', body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || 'AI Signal Pro', {
      body: payload.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: payload.data || {},
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url || '/'));
});
