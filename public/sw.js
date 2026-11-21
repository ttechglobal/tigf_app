// TIGF service worker: push reminders, plus a friendly offline page for
// navigations. Everything else goes straight to the network untouched
// (the app needs a live connection to Supabase anyway).

const CACHE_NAME = 'tigf-v3'
const ASSET_CACHE = 'tigf-assets-v1'
const OFFLINE_URL = '/offline.html'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== ASSET_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { /* malformed payload */ }
  event.waitUntil(self.registration.showNotification(data.title || 'A moment of gratitude', {
    body: data.body || 'What are you grateful for today?',
    icon: '/icon-192.png', tag: 'tigf-daily-reminder',
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil((async () => {
    const url = new URL('/dashboard', self.location.origin).href
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin) {
        await client.navigate(url)
        return client.focus()
      }
    }
    return self.clients.openWindow(url)
  })())
})

// Navigations: network first, offline page as the fallback.
// Static assets (Next build files, fonts, images): stale-while-revalidate, so
// repeat visits paint instantly and refresh quietly in the background.
// Everything else (Supabase API calls, server actions) is never touched.
const isStaticAsset = (url) =>
  url.origin === self.location.origin &&
  (url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image') ||
    url.pathname.startsWith('/shop/') ||
    /\.(?:png|jpg|jpeg|webp|svg|ico|woff2?)$/.test(url.pathname))

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method === 'GET' && request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match(OFFLINE_URL)) || Response.error())
    )
    return
  }
  if (request.method !== 'GET' || !isStaticAsset(new URL(request.url))) return
  event.respondWith((async () => {
    const cache = await caches.open(ASSET_CACHE)
    const cached = await cache.match(request)
    const refresh = fetch(request).then((res) => {
      if (res.ok) cache.put(request, res.clone())
      return res
    })
    if (cached) { refresh.catch(() => {}); return cached }
    return refresh
  })())
})
