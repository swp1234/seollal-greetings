const CACHE_NAME = 'seollal-greetings-v1';
const ASSETS = [
  '/seollal-greetings/',
  '/seollal-greetings/index.html',
  '/seollal-greetings/css/style.css',
  '/seollal-greetings/js/app.js',
  '/seollal-greetings/js/i18n.js',
  '/seollal-greetings/js/locales/ko.json',
  '/seollal-greetings/js/locales/en.json',
  '/seollal-greetings/js/locales/ja.json',
  '/seollal-greetings/js/locales/zh.json',
  '/seollal-greetings/js/locales/hi.json',
  '/seollal-greetings/js/locales/ru.json',
  '/seollal-greetings/js/locales/es.json',
  '/seollal-greetings/js/locales/pt.json',
  '/seollal-greetings/js/locales/id.json',
  '/seollal-greetings/js/locales/tr.json',
  '/seollal-greetings/js/locales/de.json',
  '/seollal-greetings/js/locales/fr.json',
  '/seollal-greetings/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetched = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
