var CACHE_NAME = 'cache-v1.2';

// The advice is to not cache too much on install.
// This is the minimal amount needed to display the initial page.
var PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/build/bundle.js',
  '/images/emojione/1f600.svg',
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

/*
function dataURIToBlob(uri) {
  var data = uri.split(',')[1];
  var bytes = typeof atob === 'undefined' ? window.atob(data) : atob(data);
  var buf = new ArrayBuffer(bytes.length);
  var arr = new Uint8Array(buf);
  for (var i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }

  if (!hasArrayBufferView) arr = buf;
  var blob = new Blob([arr], { type: mime(uri) });
  blob.slice = blob.slice || blob.webkitSlice;
  return blob;
}
*/

/**
 * Cache other resources, e.g. the rest of the emojis, on fetch.
 */
self.addEventListener('fetch', function(event) {

  console.log(event.request.url);

  // TEMP attempting to force 'download'
  if (event.request.url.endsWith('/download-image')) {

    return event.respondWith(
      // TEMP for now, cloning a response from another image
      fetch('/images/favicon.png').then(function(response){
        var init = {
          status:     response.status,
          statusText: response.statusText,
          headers:    {'Content-Disposition': 'attachment; filename=test.png'}
        };

        response.headers.forEach(function(v,k){
          init.headers[k] = v;
        });

        return response.blob().then(function(body){
          return new Response(body, init);
        });
      })
    );
  }

  // If we can fetch latest version, then do so
  var responsePromise = fetch(event.request)
    .then(function(response) {

      if (!response || !response.ok || response.type !== 'basic') {
        // Don't cache response if it's not within our domain or not 2xx status
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
