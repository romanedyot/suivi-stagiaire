var CACHE_PREFIX = 'suivi-stagiaire-';
var CACHE = CACHE_PREFIX + 'v9';
var SHELL = ['./', 'index.html', 'config.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'logo.png'];
var OTHER_APPS = self.registration.scope + 'organismes/';
var CDN = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(SHELL.map(function(u){ return c.add(u).catch(function(){}); }));
  }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k.indexOf(CACHE_PREFIX) === 0 && k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);

  if(req.url.indexOf(OTHER_APPS) === 0) return;

  if(url.origin === location.origin){
    var isPage = req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/');
    if(isPage){
      e.respondWith(fetch(req.url, {cache:'no-store'}).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put('index.html', copy); });
        return res;
      }).catch(function(){
        return caches.match('index.html').then(function(r){ return r || caches.match('./'); });
      }));
      return;
    }
    e.respondWith(caches.match(req).then(function(hit){
      var net = fetch(req).then(function(res){
        if(res && res.ok){ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); }); }
        return res;
      }).catch(function(){ return hit; });
      return hit || net;
    }));
    return;
  }

  if(CDN.indexOf(url.hostname) !== -1){
    e.respondWith(caches.match(req).then(function(hit){
      var net = fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
        return res;
      }).catch(function(){ return hit; });
      return hit || net;
    }));
  }
});
