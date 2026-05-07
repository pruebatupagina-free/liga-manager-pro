import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
  ({ url }) =>
    url.origin === 'https://liga-manager-pro-production.up.railway.app' &&
    url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
  })
)

self.addEventListener('push', event => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'LigaManager Pro', {
      body: data.body || '',
      icon: '/liga-manager-pro/pwa-192x192.png',
      badge: '/liga-manager-pro/pwa-64x64.png',
      data: { url: data.url || '/liga-manager-pro/' },
      vibrate: [200, 100, 200],
      tag: data.tag || 'lmp',
      renotify: true,
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/liga-manager-pro/'
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        const existing = list.find(c => c.url.includes('/liga-manager-pro/'))
        if (existing) {
          existing.navigate(url)
          return existing.focus()
        }
        return clients.openWindow(url)
      })
  )
})
