const CACHE = "agenda-semanal-v2";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE).then(function(cache){ return cache.addAll(ASSETS); }).catch(function(){})
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// La página (index.html) y el manifiesto se piden siempre a la red primero,
// para que las actualizaciones lleguen al momento; si no hay conexión, se usa
// la última copia guardada. Los iconos, al no cambiar casi nunca, van directos
// de la copia guardada para que la app cargue rápido.
function isFreshFirst(request){
  return request.mode === "navigate" ||
    request.url.indexOf("index.html") !== -1 ||
    request.url.indexOf("manifest.json") !== -1;
}

self.addEventListener("fetch", function(event){
  var request = event.request;

  if(isFreshFirst(request)){
    event.respondWith(
      fetch(request).then(function(response){
        var copy = response.clone();
        caches.open(CACHE).then(function(cache){ cache.put(request, copy); });
        return response;
      }).catch(function(){
        return caches.match(request).then(function(cached){ return cached || caches.match("./index.html"); });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function(cached){
      return cached || fetch(request).catch(function(){ return caches.match("./index.html"); });
    })
  );
});
