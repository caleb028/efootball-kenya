// eFootball ARENA Kenya — Progressive Web App Service Worker
const CACHE_NAME = "efootball-arena-pwa-v2";
const STATIC_ASSETS = ["/", "/manifest.json", "/icon.svg", "/brand/logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache authentication, financial, admin, or dynamic API routes (Security)
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/organiser") ||
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/register")
  ) {
    return;
  }

  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then((cached) => cached || caches.match("/"))
    )
  );
});
