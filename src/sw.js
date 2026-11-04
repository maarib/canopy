// Canopy's service worker. The build (the serviceWorker plugin in vite.config.ts) emits it as
// sw.js with three constants put in front of this file:
//   BASE      the site's base path ("/canopy/" on GitHub Pages)
//   VERSION   a hash of this build's file names, so a new deploy installs a new worker
//   PRECACHE  this build's hashed files under assets/ (JS, CSS, fonts)
//
// What it does, by kind of request:
// - assets/*        cache first: the names change with every build, so a cached copy is never stale.
// - pages           network first, falling back to the cached app shell (index.html) when offline
//                   or when the network takes too long, so a new deploy shows on the next visit.
// - data/*.json     stale while revalidate: the cached copy answers now, a fresh one is fetched
//                   for next time (the files are refreshed daily by GitHub Actions).
// - icons, covers   stale while revalidate, as for data.
// - anything else   not touched. That includes every other site: Mapbox tiles, styles and glyphs
//                   (their terms forbid caching them), iNaturalist and the weather service.
//
// Matches ignore the Vary header: a file saved at install carries no Origin header, the page's
// own requests do, and a server that varies on Origin would otherwise never match.
//
// To switch it off for everyone, build with SERVICE_WORKER=off: the emitted sw.js then removes
// itself and its caches. On one device, open the site with ?sw=off (see src/lib/serviceWorker.ts).

/* global BASE, VERSION, PRECACHE */

const ASSETS = `canopy-assets-${VERSION}`
const PAGES = 'canopy-pages'
const DATA = 'canopy-data'
const KEEP = [ASSETS, PAGES, DATA]
const SHELL = BASE // index.html, as GitHub Pages serves it at the base path
// How long a page request waits on the network before the cached app shell answers instead.
const NAV_TIMEOUT_MS = 4000

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const assets = await caches.open(ASSETS)
      // Files the first visit already downloaded come from the HTTP cache, not the network.
      await assets.addAll(PRECACHE.map((f) => BASE + f))
      const pages = await caches.open(PAGES)
      await pages.add(new Request(SHELL, { cache: 'reload' }))
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) if (name.startsWith('canopy-') && !KEEP.includes(name)) await caches.delete(name)
      // Page requests go out while the worker starts up, instead of after.
      await self.registration.navigationPreload?.enable()
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return
  const path = url.pathname.slice(BASE.length)

  if (req.mode === 'navigate') event.respondWith(page(event))
  else if (path.startsWith('assets/')) event.respondWith(cacheFirst(req))
  else if (path.startsWith('data/') || path.startsWith('icons/') || path.startsWith('covers/')) event.respondWith(staleWhileRevalidate(event))
})

async function cacheFirst(req) {
  const hit = await caches.match(req, { cacheName: ASSETS, ignoreVary: true })
  if (hit) return hit
  const res = await fetch(req)
  if (res.ok) {
    const copy = res.clone()
    caches.open(ASSETS).then((c) => c.put(req, copy))
  }
  return res
}

async function page(event) {
  const network = Promise.resolve(event.preloadResponse).then((pre) => pre ?? fetch(event.request)).then((res) => {
    // Only the app shell itself is kept; deep links get GitHub Pages' 404.html copy of it.
    if (res.ok && new URL(event.request.url).pathname === SHELL) {
      const copy = res.clone()
      event.waitUntil(caches.open(PAGES).then((c) => c.put(SHELL, copy)))
    }
    return res
  })
  event.waitUntil(network.catch(() => {}))
  const timeout = new Promise((resolve) => setTimeout(resolve, NAV_TIMEOUT_MS))
  try {
    const res = await Promise.race([network, timeout])
    if (res) return res
  } catch {
    // Offline: fall through to the cached shell.
  }
  const shell = await caches.match(SHELL, { cacheName: PAGES, ignoreVary: true })
  return shell ?? network
}

async function staleWhileRevalidate(event) {
  const req = event.request
  const cache = await caches.open(DATA)
  const hit = await cache.match(req, { ignoreVary: true })
  const network = fetch(req).then((res) => {
    if (res.ok) {
      const copy = res.clone()
      return cache.put(req, copy).then(() => res)
    }
    return res
  })
  if (hit) {
    event.waitUntil(network.catch(() => {}))
    return hit
  }
  return network
}
