// Service worker: la app siempre busca la versión nueva en internet y guarda una copia
// para cuando no hay conexión. Así las actualizaciones llegan solas y sigue andando offline.
const CACHE = 'foco-v28';
const FILES = ['./', 'index.html', 'styles.css', 'app.js', 'catalog.js', 'fb.js', 'rooms.js', 'account.js', 'firebase-config.js', 'manifest.webmanifest', 'icon.svg'];

self.addEventListener('install', (e) => {
  // cache: 'reload' evita guardar copias viejas del caché HTTP del navegador
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Páginas del login con Google: siempre directo de internet
  if (url.origin === location.origin && url.pathname.startsWith('/__/')) return;

  // Archivos fijos de otros sitios (fuentes y librería de Firebase): primero la copia guardada.
  // Todo lo demás de afuera (base de datos, login, cobro) va directo, sin guardar.
  if (url.origin !== location.origin) {
    if (!['fonts.googleapis.com', 'fonts.gstatic.com', 'www.gstatic.com'].includes(url.hostname)) return;
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }))
    );
    return;
  }

  // Archivos propios: primero internet (revalidando), si no hay conexión la copia guardada
  e.respondWith(
    fetch(url.href, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined))
        .then((hit) => hit || Response.error()))
  );
});
