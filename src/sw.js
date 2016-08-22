import filesToCache from '\0cache-manifest';

const CACHE_NAME = 'cache-v1';

self.addEventListener('install', event => {

  function onInstall () {

    console.log('Service worker installation');

    return caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching pre-defined assets on installation', filesToCache);
        return cache.addAll( filesToCache )
          .then(() => {
            console.log('Cached files, now cache external resources...');
            return cache.add('https://fonts.googleapis.com/css?family=Open+Sans:400,700,300,400italic,700italic,300italic,600,600italic,800,800italic');
          });
      });
  }

  event.waitUntil(onInstall(event));
});

self.addEventListener('fetch', event => {

  // Clone so we can consume it more than once
  let fetchRequest = event.request.clone();

  // If we can fetch latest version, then do so
  return fetch(fetchRequest)
    .then(response => {

      if (!response || response.status >= 300 || response.type !== 'basic') {
        // Don't cache response if it's not within our domain or not 2xx status
        return response;
      }

      let responseToCache = response.clone();

      caches.open(CACHE_NAME)
        .then(cache => {
          cache.put(event.request, responseToCache);
          console.log('Put response in cache', responseToCache);
        });

      return response;
    })
    .catch(err => {

      // Fetch failed. Maybe we're offline. Try the cache.
      console.log('Fetch failed, try cache', err);

      event.respondWith(
        caches.match(event.request)
          .then(response => {
              if (response) {
                console.log('Cache hit', event.request);
                return response;
              } else {
                console.log('Offline cache miss =(');
              }
            }
          )
      );

    });

});

// Clear out old versions
self.addEventListener('activate', function(event) {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) == -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
