const CACHE_NAME = 'fynlo-v2'

// Static assets are safe to cache — they use content-hashed URLs so the
// same URL always returns the same bytes. HTML pages are NOT cached because
// they must be fetched fresh each time so that:
//  1. Set-Cookie headers from the auth middleware reach the browser
//  2. The HTML always references the latest JS bundle hashes after a deploy
const STATIC_ASSET_PREFIXES = [
  '/_next/static/',
  '/icons/',
]

self.addEventListener('install', event => {
  // No pre-caching of HTML — just take over immediately
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Skip: API calls and Supabase (auth, database, realtime)
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) return

  // Navigation requests (HTML pages): always go to the network.
  // This ensures middleware Set-Cookie headers reach the browser and the
  // browser always gets the latest JS bundle hash references.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request))
    return
  }

  // Content-hashed static assets: cache-first (URL changes on every deploy,
  // so the cached version is always correct for that URL)
  const isStatic = STATIC_ASSET_PREFIXES.some(p => url.pathname.startsWith(p))
  if (isStatic) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached
        return fetch(event.request).then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()))
          }
          return response
        })
      })
    )
  }
  // Everything else (images, fonts not under /_next/static/, etc.): network-only
})

self.addEventListener('push', event => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      data: data.url,
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  if (event.notification.data) {
    event.waitUntil(clients.openWindow(event.notification.data))
  }
})
