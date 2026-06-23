// Minimal service worker — just enough to make the browser consider
// this app "installable" as a PWA. Not doing heavy offline caching
// since this app needs a live network connection to Supabase anyway.

const CACHE_NAME = 'tigf-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
})

// Network-first: always try the network, only used so the browser
// recognizes an active service worker (required for "Add to Home Screen").
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
