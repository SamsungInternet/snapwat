var filesToCache = ["/build/bundle.js","/css/styles.css","/images","/images/emojione","/images/emojione/1f354.png","/images/emojione/1f354.svg","/images/emojione/1f369.png","/images/emojione/1f369.svg","/images/emojione/1f3a4.png","/images/emojione/1f3a4.svg","/images/emojione/1f3a9.png","/images/emojione/1f3a9.svg","/images/emojione/1f3b8.png","/images/emojione/1f3b8.svg","/images/emojione/1f3c6.png","/images/emojione/1f3c6.svg","/images/emojione/1f415.png","/images/emojione/1f415.svg","/images/emojione/1f420.png","/images/emojione/1f420.svg","/images/emojione/1f43c.png","/images/emojione/1f43c.svg","/images/emojione/1f444.png","/images/emojione/1f444.svg","/images/emojione/1f445.png","/images/emojione/1f445.svg","/images/emojione/1f448.png","/images/emojione/1f448.svg","/images/emojione/1f449.png","/images/emojione/1f449.svg","/images/emojione/1f44d.png","/images/emojione/1f44d.svg","/images/emojione/1f44f.png","/images/emojione/1f44f.svg","/images/emojione/1f484.png","/images/emojione/1f484.svg","/images/emojione/1f48b.png","/images/emojione/1f48b.svg","/images/emojione/1f4a1.png","/images/emojione/1f4a1.svg","/images/emojione/1f4af.png","/images/emojione/1f4af.svg","/images/emojione/1f4b0.png","/images/emojione/1f4b0.svg","/images/emojione/1f4ef.png","/images/emojione/1f4ef.svg","/images/emojione/1f525.png","/images/emojione/1f525.svg","/images/emojione/1f58c.png","/images/emojione/1f58c.svg","/images/emojione/1f600.png","/images/emojione/1f600.svg","/images/emojione/1f602.png","/images/emojione/1f602.svg","/images/emojione/1f606.png","/images/emojione/1f606.svg","/images/emojione/1f609.png","/images/emojione/1f609.svg","/images/emojione/1f60d.png","/images/emojione/1f60d.svg","/images/emojione/1f60e.png","/images/emojione/1f60e.svg","/images/emojione/1f612.png","/images/emojione/1f612.svg","/images/emojione/1f61d.png","/images/emojione/1f61d.svg","/images/emojione/1f621.png","/images/emojione/1f621.svg","/images/emojione/1f622.png","/images/emojione/1f622.svg","/images/emojione/1f628.png","/images/emojione/1f628.svg","/images/emojione/1f62d.png","/images/emojione/1f62d.svg","/images/emojione/1f62e.png","/images/emojione/1f62e.svg","/images/emojione/1f631.png","/images/emojione/1f631.svg","/images/emojione/1f644.png","/images/emojione/1f644.svg","/images/emojione/1f911.png","/images/emojione/1f911.svg","/images/emojione/1f918.png","/images/emojione/1f918.svg","/images/emojione/1f922.png","/images/emojione/1f922.svg","/images/emojione/1f926.png","/images/emojione/1f926.svg","/images/emojione/1f947.png","/images/emojione/1f947.svg","/images/emojione/1f98d.png","/images/emojione/1f98d.svg","/images/emojione/2600.png","/images/emojione/2600.svg","/images/emojione/261d.png","/images/emojione/261d.svg","/images/emojione/2620.png","/images/emojione/2620.svg","/images/emojione/2622.png","/images/emojione/2622.svg","/images/emojione/262e.png","/images/emojione/262e.svg","/images/emojione/270c.png","/images/emojione/270c.svg","/images/emojione/2757.png","/images/emojione/2757.svg","/images/emojione/2764.png","/images/emojione/2764.svg","/images/emojione/LICENCE","/images/homescreen","/images/homescreen/144.png","/images/homescreen/168.png","/images/homescreen/192.png","/images/homescreen/48.png","/images/homescreen/72.png","/images/homescreen/96.png","/images/iconic","/images/iconic/arrow-left.svg","/images/iconic/camera-slr.svg","/images/iconic/data-transfer-download.svg","/images/iconic/LICENCE","/images/iconic/trash.svg","/images/logo-transparent.png","/images/twitter-logo.svg","/sounds","/sounds/camera.wav","/"]

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