// ARC — service worker. Réseau d'abord, cache en secours (hors ligne).
// Une nouvelle version d'ARC est donc visible dès le rechargement, sans vider le cache à la main.
var CACHE = 'arc-v6';
var SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).catch(function(){}));
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;                       // jamais les envois (sync, Claude)
  var url = new URL(req.url);
  if(url.hostname.indexOf('supabase.co') !== -1) return; // données et Claude : toujours en direct
  e.respondWith(
    fetch(req).then(function(resp){
      if(resp && (resp.ok || resp.type === 'opaque')){
        var copy = resp.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
      }
      return resp;
    }).catch(function(){
      return caches.match(req).then(function(hit){
        return hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error());
      });
    })
  );
});
