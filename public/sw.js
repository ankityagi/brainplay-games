/* BrainPlay offline support (so games, play codes and the parent page work on a flight).
   On install it saves every file of the site (listed in precache.json, written at build time).
   Pages load from the network when online and fall back to the saved copy offline;
   other files load from the saved copy first. Google Fonts are saved the first time they load. */
const PREFIX = 'brainplay-';
const FONTS = PREFIX + 'fonts';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const res = await fetch('/precache.json', { cache: 'no-store' });
    const { version, files } = await res.json();
    const cache = await caches.open(PREFIX + version);
    await cache.addAll(files.map((f) => new Request(f, { cache: 'reload' })));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const res = await fetch('/precache.json', { cache: 'no-store' }).catch(() => null);
    const keep = res && res.ok ? PREFIX + (await res.json()).version : null;
    const names = await caches.keys();
    // drop older builds' caches, but only once the new one is known to exist
    if (keep && names.includes(keep)) {
      await Promise.all(names.filter((n) => n.startsWith(PREFIX) && n !== keep && n !== FONTS).map((n) => caches.delete(n)));
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith((async () => {
      const cache = await caches.open(FONTS);
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
      return res;
    })());
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/precache.json' || url.pathname === '/sw.js') return;

  if (req.mode === 'navigate') {
    // fresh page when online, saved page offline (the app routes with #, so "/" serves it all)
    event.respondWith((async () => {
      try {
        return await fetch(req);
      } catch {
        return (await caches.match(req, { ignoreSearch: true })) || (await caches.match('/index.html')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    return fetch(req);
  })());
});
