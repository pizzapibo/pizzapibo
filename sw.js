/* PIBO service worker — deliberately minimal.
   Exists so the site is installable. We do NOT cache app content:
   the menu and prices must always be fresh from store.json. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
    // network only; fall back to whatever the browser has if offline
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
