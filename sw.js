// Módulo Gênito-Urinário · funciona sem internet depois da primeira abertura
const CACHE = "gu-5d95006308";
const FILES = ["./", "index.html", "manifest.json", "icone-180.png", "icone-192.png", "icone-512.png", "dados-fotos.js", "dados-laminas.js", "dados-materias.js", "dados-pdfs.js"];
const FONT_CSS = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@500&display=swap";
self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(FILES.map(u => new Request(u, {cache: "reload"})));
    try { // fontes do Google, para o visual ficar igual sem internet
      const r = await fetch(FONT_CSS, {mode: "cors"});
      if (r.ok) {
        const css = await r.clone().text(); await c.put(FONT_CSS, r);
        const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map(m => m[1]);
        await Promise.all(urls.map(u => fetch(u, {mode: "cors"}).then(x => x.ok && c.put(u, x)).catch(() => {})));
      }
    } catch (err) {}
    self.skipWaiting();
  })());
});
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req, {ignoreSearch: true}) || (req.mode === "navigate" ? await c.match("index.html") : null);
    if (hit) return hit;
    try {
      const r = await fetch(req);
      if (r && (r.ok || r.type === "opaque") && /fonts\.(googleapis|gstatic)\.com/.test(req.url)) c.put(req, r.clone());
      return r;
    } catch (err) {
      return new Response("", {status: 504});
    }
  })());
});
