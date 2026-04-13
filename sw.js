/* ARC Service Worker v2 */
var CACHE = 'arc-v3';

self.addEventListener('install', function(e){
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  var url = new URL(e.request.url);
  
  // Supabase + fonts — réseau d'abord
  if(url.hostname.includes('supabase.co') || url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com') || url.hostname.includes('jsdelivr.net')){
    e.respondWith(
      fetch(e.request).then(function(resp){
        if(resp.ok && url.hostname.includes('gstatic.com')){
          var clone = resp.clone();
          caches.open(CACHE).then(function(cache){ cache.put(e.request, clone); });
        }
        return resp;
      }).catch(function(){
        return caches.match(e.request);
      })
    );
    return;
  }
  
  // App shell — cache first, update en background
  e.respondWith(
    caches.open(CACHE).then(function(cache){
      return cache.match(e.request).then(function(cached){
        var networkReq = fetch(e.request).then(function(resp){
          if(resp.ok) cache.put(e.request, resp.clone());
          return resp;
        }).catch(function(){ return cached; });
        return cached || networkReq;
      });
    })
  );
});
