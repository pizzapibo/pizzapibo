/* PIBO service worker — cache-first for the app shell, network-first for data */
const CACHE = 'pibo-shell-v2';
const SHELL = ['./', './index.html', './css/style.css', './js/main.js', './manifest.json'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    // never cache Firebase / model / analytics traffic
    if (!url.origin.startsWith(self.location.origin) || url.pathname.endsWith('.glb') || url.pathname.endsWith('.usdz')) return;
    e.respondWith(
        caches.match(req).then(hit => hit || fetch(req).then(res => {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
            return res;
        }).catch(() => hit))
    );
});
