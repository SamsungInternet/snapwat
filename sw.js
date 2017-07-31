var CACHE_NAME = 'cache-v1.4';

// The advice is to not cache too much on install.
// This is the minimal amount needed to display the initial page.
var PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/build/bundle.js',
  '/images/emoji/f1.svg',
  '/images/iconic/trash.svg',
  '/images/iconic/arrow-right.svg',
  'https://fonts.googleapis.com/css?family=Open+Sans:400,700,300,400italic,700italic,300italic,600,600italic,800,800italic'
];

self.addEventListener('install', function(event) {

  function onInstall () {

    console.log('Service worker installation', CACHE_NAME);

    return caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Caching pre-defined assets on installation...', PRECACHE_URLS);
        return cache.addAll(PRECACHE_URLS);
      });
  }

  event.waitUntil(onInstall(event));
});

/**
 * Cache other resources, e.g. the rest of the emojis, on fetch.
 */
self.addEventListener('fetch', function(event) {

  // If we can fetch latest version, then do so
  var responsePromise = fetch(event.request)
    .then(function(response) {

      // Don't cache response unless it's 2xx status
      if (!response || !response.ok) {
        return response;
      }

      // Clone it to allow us to cache it
      var responseToCache = response.clone();

      caches.open(CACHE_NAME)
        .then(function(cache) {
          cache.put(event.request, responseToCache);
        });

      return response;
    })
    .catch(function(err) {

      // NOTE: On a patchy network, it could take a long time for the fetch
      // to fail and for us to get here. TO DO: introduce a timeout.
      console.log('Fetch failed, maybe we are offline. Try cache...', err);

      return caches.match(event.request)
        .then(function(response) {
          if (response) {
            console.log('Cache hit', event.request);
            return response;
          } else {
            console.log('Offline cache miss =(');
          }
        });

    });

  event.respondWith(responsePromise);

});

/**
 * Clear out old caches on activation
 */
self.addEventListener('activate', function(event) {

  var cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // If it is not a current cache, delete it
          if (cacheWhitelist.indexOf(cacheName) == -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
