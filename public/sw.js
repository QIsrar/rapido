// Rapido PWA Service Worker — Offline & High-Performance Caching
const CACHE_NAME = 'rapido-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/projects',
  '/reports',
  '/about',
  '/logo.png',
  '/og-image.jpg',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: pre-cache critical shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-caching assets partial warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Strategy depending on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and Supabase API calls (let offline-store handle offline sync)
  if (request.method !== 'GET' || url.hostname.includes('supabase.co')) {
    return;
  }

  // 1. Static Next.js assets, images, icons -> Cache-First with Network background refresh
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/logo.png' ||
    url.pathname === '/og-image.jpg'
  ) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, networkResponse);
                });
              }
            })
            .catch(() => {});
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. Project Detail and App Navigation / Page requests -> Network-First with Cache Fallback
  if (request.mode === 'navigate' || url.searchParams.has('_rsc') || url.pathname.startsWith('/projects/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              // Store with URL without search params as well for robust matching
              cache.put(request, clone);
              cache.put(url.pathname, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // 1. Try exact or search-ignored match
          const cachedResponse = await caches.match(request, { ignoreSearch: true });
          if (cachedResponse) {
            return cachedResponse;
          }

          // 2. Try matching by pathname
          const pathResponse = await caches.match(url.pathname);
          if (pathResponse) {
            return pathResponse;
          }

          // 3. Fallback to /projects or /
          if (url.pathname.startsWith('/projects')) {
            const projectsFallback = await caches.match('/projects');
            if (projectsFallback) return projectsFallback;
          }

          const homeFallback = await caches.match('/');
          if (homeFallback) return homeFallback;

          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Rapido — Offline Mode</title>
                <style>
                  body { font-family: sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 3rem 1rem; }
                  .card { max-width: 380px; margin: 0 auto; background: #1e293b; padding: 2rem; border-radius: 1.5rem; border: 2px solid #f97316; }
                  h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #f97316; }
                  p { font-size: 0.875rem; color: #94a3b8; line-height: 1.5; }
                  button { margin-top: 1.5rem; background: #f97316; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: bold; cursor: pointer; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h1>⚠️ Offline Mode</h1>
                  <p>You are currently offline. Rapido will restore live job data once you reconnect.</p>
                  <button onclick="window.location.reload()">Retry Connection</button>
                </div>
              </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // 3. Default: try network, fallback to cache
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request, { ignoreSearch: true }))
  );
});
