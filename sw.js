// マイペース Service Worker: オフラインでも開けるようにキャッシュする
const CACHE = "my-pace-v3";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-180.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// キャッシュ優先＋裏で更新（stale-while-revalidate）。
// 起動は常にキャッシュから即表示され、圏外・不安定な回線でも白画面にならない。
// トレードオフとして、コードの更新は「次回の起動時」に反映される。
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      const fetched = fetch(e.request)
        .then(function (res) {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
          }
          return res;
        })
        .catch(function () { return cached || Response.error(); });
      return cached || fetched;
    })
  );
});
