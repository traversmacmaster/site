const CACHE = "streamarch-shell-v2";
const SHELL = ["./", "./manifest.webmanifest"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL))));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE && /^(reelvault|streamarch)-shell-/.test(key)).map((key) => caches.delete(key))))));
self.addEventListener("fetch", (event) => {
  // Archive requests and downloaded films are managed by the app. Never
  // substitute the HTML shell for failed API, video, or script requests.
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => undefined));
    }
    return response;
  }).catch(async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    if (event.request.mode === "navigate") return (await cache.match("./")) || Response.error();
    return Response.error();
  }));
});
