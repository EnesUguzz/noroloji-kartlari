// Service worker: sitedeki tüm dosyaları önbelleğe alır; önce önbellek, yoksa ağ.
// CACHE_VERSION ve DOSYALAR `node tools/sw_guncelle.mjs` ile güncellenir.
const CACHE_VERSION = 'nk-2026-11-24-3';
const DOSYALAR = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'css/fonts.css',
  'fonts/inter-latin-400-normal.woff2',
  'fonts/inter-latin-500-normal.woff2',
  'fonts/inter-latin-600-normal.woff2',
  'fonts/inter-latin-ext-400-normal.woff2',
  'fonts/inter-latin-ext-500-normal.woff2',
  'fonts/inter-latin-ext-600-normal.woff2',
  'fonts/space-grotesk-latin-500-normal.woff2',
  'fonts/space-grotesk-latin-600-normal.woff2',
  'fonts/space-grotesk-latin-700-normal.woff2',
  'fonts/space-grotesk-latin-ext-500-normal.woff2',
  'fonts/space-grotesk-latin-ext-600-normal.woff2',
  'fonts/space-grotesk-latin-ext-700-normal.woff2',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'js/app.js',
  'js/kayit.js',
  'js/oturum.js',
  'js/srs.js',
  'js/surum.js',
  'js/tarih.js',
  'js/test.js',
  'js/ui/ana.js',
  'js/ui/ayarlar.js',
  'js/ui/calis.js',
  'js/ui/ortak.js',
  'js/ui/test.js',
  'data/bolum1.js',
  'data/bolum2.js',
  'data/bolum3.js',
  'data/bolum4.js',
  'data/bolum6.js',
  'data/index.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(DOSYALAR)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((adlar) => Promise.all(adlar.filter((a) => a !== CACHE_VERSION).map((a) => caches.delete(a))))
      .then(() => self.clients.claim()),
  );
});

// Sayfa "Yenile" dediğinde bekleyen yeni sürüm devreye girer.
self.addEventListener('message', (e) => {
  if (e.data === 'GUNCELLE') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const onbellek = await caches.open(CACHE_VERSION);
    const bulunan = await onbellek.match(e.request, { ignoreSearch: true });
    if (bulunan) return bulunan;
    if (e.request.mode === 'navigate') {
      const kabuk = await onbellek.match('./');
      try { return await fetch(e.request); } catch { if (kabuk) return kabuk; throw new Error('çevrimdışı'); }
    }
    return fetch(e.request);
  })());
});
