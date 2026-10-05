// Izgovor service worker: keeps the app working offline.
// The page is fetched fresh when online (so updates arrive), and from the cache when offline.
const CACHE = 'izgovor-2026-10-05.1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('izgovor-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function timeout(ms) { return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)); }

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    e.respondWith((async () => {
      try {
        const r = await Promise.race([fetch(req, { cache: 'no-cache' }), timeout(4000)]);
        if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); }
        return r;
      } catch (err) {
        return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
