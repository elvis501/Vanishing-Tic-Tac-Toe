/* Vanishing XO — service worker
 * The page is served network-first (so edits show up on the next load),
 * everything else cache-first. Only successful responses are cached, so a
 * proxy/error page can never replace the real game. All URLs are relative,
 * so the site works from any sub-path (GitHub Pages project sites included).
 */
const VERSION = 'v2';
const CACHE = `vxo-${VERSION}`;

const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

/** Cache a response, but never an error page. */
function cacheResponse(request, response) {
  if (!response || !(response.ok || response.type === 'opaque')) return;
  caches.open(CACHE).then(cache => cache.put(request, response));
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('vxo-') && key !== CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') return;

  // The game page: network first, cache is the offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          cacheResponse('./index.html', response.clone());
          return response;
        }
        const cached = await caches.match('./index.html');
        return cached || response;              // 4xx/5xx only if we have nothing better
      } catch {
        const cached = await caches.match('./index.html');
        return cached || Response.error();
      }
    })());
    return;
  }

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (!sameOrigin && !FONT_HOSTS.includes(url.hostname)) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      cacheResponse(request, response.clone());
      return response;
    } catch {
      return Response.error();
    }
  })());
});
