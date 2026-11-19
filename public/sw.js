// TIGF service worker: push reminders, plus a friendly offline page for
// navigations. Everything else goes straight to the network untouched
// (the app needs a live connection to Supabase anyway).

const CACHE_NAME = 'tigf-v2'
const OFFLINE_URL = '/offline.html'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
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

// Only page navigations are intercepted, and only to show the offline page
// when the network is unreachable.
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return
  event.respondWith(
    fetch(event.request).catch(async () => (await caches.match(OFFLINE_URL)) || Response.error())
  )
})
