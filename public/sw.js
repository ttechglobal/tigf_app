// Minimal service worker — just enough to make the browser consider
// this app "installable" as a PWA. Not doing heavy offline caching
// since this app needs a live network connection to Supabase anyway.

const CACHE_NAME = 'tigf-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
})

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
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

// Network-first: always try the network, only used so the browser
// recognizes an active service worker (required for "Add to Home Screen").
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
