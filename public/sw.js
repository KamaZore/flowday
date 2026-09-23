/* Flowday service worker — offline-first app shell caching */
// Bump this version whenever app assets change so clients pick up the new
// build instead of serving a stale cache (classic "preview looks broken" bug).
const VERSION = "flowday-v6-landing-fix";
const BASE = new URL(self.registration.scope).pathname; // supports subpath hosting
const APP_SHELL = [
  "",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-192.png",
  "icon-maskable-512.png",
  "offline.html",
].map((p) => new URL(p, self.registration.scope).href);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) =>
        Promise.allSettled(APP_SHELL.map((url) => cache.add(url))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // let the Neon endpoint pass through

  // Navigations: network-first, fall back to cache, then offline page
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches
            .match(req)
            .then((hit) => hit || caches.match(BASE + "offline.html")),
        ),
    );
    return;
  }

  // Same-origin static assets: cache-first
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok && (url.pathname.includes("/assets/") || url.pathname.includes("/icon"))) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      });
    }),
  );
});
