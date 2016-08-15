'use strict';

console.log('Service worker startup');

const CACHE_NAME = 'cache-v1';

self.addEventListener('install', event => {

  function onInstall () {
    return caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching pre-defined assets on installation');
        cache.addAll(
            [
              '/css/styles.css',
              '/build/bundle.js',
              '/images/iconic/data-transfer-download.svg',
              'https://fonts.googleapis.com/css?family=Open+Sans:400,700,300,400italic,700italic,300italic,600,600italic,800,800italic',
              '/'
            ]);
        }
      );
  }

  event.waitUntil(onInstall(event));
});

self.addEventListener('fetch', event => {

  const url = event.request.url;
  const snapshotIndex = url.indexOf('/snapshot/');

  if (snapshotIndex > -1) {

    console.log('This is a request for the snapshot!');

    const dataUri = url.substr(snapshotIndex + 10, url.length - snapshotIndex - 10);

    console.log('data uri', dataUri);

    event.respondWith(new Response(dataURItoBlob(dataUri), //new Blob([blob], {type: 'image/png'}), 
      {headers: { 'Content-Type': 'image/png' }}));

    return;
  }

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
          console.log('Cached response', responseToCache);
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
                // Offline 404
                console.log('Offline 404');
                return caches.match('offline.html');
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

/**
 * Thanks to: http://stackoverflow.com/a/12300351/396246
 */
function dataURItoBlob(dataURI) {
  
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

  // write the bytes of the string to an ArrayBuffer
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }

  var blob = new Blob([ab], {type: mimeString});
  return blob;
}