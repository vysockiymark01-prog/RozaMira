// Service worker «Розы Мира» — полный офлайн-кэш сайта.
// При обновлении контента поменяйте CACHE_VERSION, чтобы клиенты подтянули новые файлы.
const CACHE_VERSION = 'rm-v2';
const CACHE_NAME = `rozamira-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "./404.html",
  "./about.html",
  "./assets/app.js",
  "./assets/favicon.svg",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512-maskable.png",
  "./assets/icons/icon-512.png",
  "./assets/search-data.js",
  "./assets/style.css",
  "./glossary.html",
  "./index.html",
  "./manifest.json",
  "./map.html",
  "./notes.html",
  "./privacy.html",
  "./search.html",
  "./who.html",
  "./Главы/Книга 1 — главы 1-3/index.html",
  "./Главы/Книга 10 — главы 1-5/index.html",
  "./Главы/Книга 11 — главы 1-4/index.html",
  "./Главы/Книга 12 — главы 1-5/index.html",
  "./Главы/Книга 2 — главы 1-3/index.html",
  "./Главы/Книга 3 — главы 1-3/index.html",
  "./Главы/Книга 4 — главы 1-3/index.html",
  "./Главы/Книга 5 — главы 1-3/index.html",
  "./Главы/Книга 6 — главы 1-3/index.html",
  "./Главы/Книга 7 — главы 1-3/index.html",
  "./Главы/Книга 8 — главы 1-4/index.html",
  "./Главы/Книга 9 — главы 1-4/index.html"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        if (req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
