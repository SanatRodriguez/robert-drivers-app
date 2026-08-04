// Service worker minimo — solo habilita que el navegador ofrezca "Instalar app".
// No cachea nada todavia (se puede sumar estrategia offline mas adelante).
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {});
