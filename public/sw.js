/* CLARA : service worker. Pour publier une mise à jour : modifier index.html, changer VERSION ci-dessous (et APP_VERSION dans index.html), puis remplacer les fichiers sur l'hébergeur. */
const VERSION = "4.3.0";
const CACHE = "clara-" + VERSION;
const CORE = ["./", "index.html", "convertisseur.html", "veo-module.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
});
self.addEventListener("message", e => { if (e.data === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith("clara-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
/* Réseau d'abord (toujours la dernière version en ligne), cache en secours hors connexion.
   Les appels vers le serveur Canal+ (autre origine) ne sont jamais interceptés. */
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => caches.match(r).then(m => m || (r.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
