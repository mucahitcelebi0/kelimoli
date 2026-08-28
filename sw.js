// =====================================================================
// Kelimoli — Service Worker
// Stratejiler:
//   - HTML (navigasyon): network-first → güncel UI almak için
//   - Statik varlık (css/js/svg/woff2/manifest): cache-first → hızlı açılış
//   - YouTube iframe API: passthrough (cache'lemiyoruz)
// Not: Fontlar artık uygulamayla gömülü (fonts/*.woff2) — aynı origin'den
// geldikleri için cache-first dalına düşerler, ayrı bir Google Fonts
// stratejisine gerek kalmadı.
// =====================================================================

const VERSION = 'kelimoli-v77';
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

// İlk yüklemede precache edilecek temel dosyalar
const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './kelimoli-data.js',
  './app.js',
  './manifest.json',
  './icon.svg',
  './icon-maskable.svg',
  './firebase-config.js',
  './firebase-bundle.js',
  './firebase-sync.js',
  './revenuecat-config.js',
  './fonts/inter-latin.woff2',
  './fonts/inter-latin-ext.woff2',
  './fonts/playfair-latin.woff2',
  './fonts/playfair-latin-ext.woff2',
];

// ---- Install: precache ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ---- Activate: eski cache'leri temizle ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ---- Fetch: stratejiye göre yanıtla ----
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Sadece GET'leri cache'liyoruz
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // YouTube iframe API ve video — passthrough
  if (url.hostname.includes('youtube.com') || url.hostname.includes('ytimg.com') || url.hostname.includes('googlevideo.com')) {
    return; // varsayılan fetch
  }

  // HTML navigation → network-first
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Aynı origin statik varlık (fontlar dahil) → cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Diğer cross-origin: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(req));
});

// ---- Stratejiler ----
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    return cached || Response.error();
  }
}

async function networkFirst(request) {
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Son çare: index.html'i geri ver (SPA fallback)
    const fallback = await caches.match('./index.html');
    return fallback || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  return cached || (await networkPromise) || Response.error();
}

// ---- Mesaj kanalı: client'tan "skipWaiting" tetikle ----
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
