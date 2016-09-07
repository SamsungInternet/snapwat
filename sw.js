const CACHE_NAME = 'cache-v1';

// The advice is to not cache too much on install.
// This is the minimal amount needed to display the initial page.
const IMMEDIATE_CACHE_URLS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/build/bundle.js',
  '/images/emojione/1f600.svg',
  '/images/iconic/trash.svg',
  '/images/iconic/camera-slr.svg',
  'https://fonts.googleapis.com/css?family=Open+Sans:400,700,300,400italic,700italic,300italic,600,600italic,800,800italic'
];

self.addEventListener('install', event => {

  function onInstall () {

    console.log('Service worker installation', CACHE_NAME);

    return caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching pre-defined assets on installation...', IMMEDIATE_CACHE_URLS);
        return cache.addAll(IMMEDIATE_CACHE_URLS);
      });
  }

  event.waitUntil(onInstall(event));
});

self.addEventListener('fetch', event => {

  // If we can fetch latest version, then do so
  const responsePromise = fetch(event.request)
    .then(response => {

      if (!response || response.status >= 300 || response.type !== 'basic') {
        // Don't cache response if it's not within our domain or not 2xx status
        reiturn response;
      }

      // Clone it to allow us to cache it
      const responseToCache = response.clone();

      caches.open(CACHE_NAME)
        .then(cache => {
          cache.put(event.request, responseToCache);
        });

      return response;
    })
    .catch(err => {

      console.log('Fetch failed, maybe we are offline. Try cache...', err);

      return caches.match(event.request)
        .then(response => {
            if (response) {
              console.log('Cache hit', event.request);
              return response;
            } else {
              console.log('Offline cache miss =(');
            }
          }
        );

    });

  event.respondWith(responsePromise);

});

self.addEventListener('activate', function(event) {
  
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Clear out old cache versions
          if (cacheWhitelist.indexOf(cacheName) == -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
