/**
 * Custom Service Worker for Enhanced Offline Functionality
 * This extends the default next-pwa service worker with additional offline features
 */

const CACHE_NAME = "unimaz-offline-v1";
const OFFLINE_PAGE = "/offline";

// Listen for service worker installation
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  self.skipWaiting();
});

// Listen for service worker activation
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Service Worker: Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Listen for fetch events
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return;
  }

  event.respondWith(handleRequest(event.request));
});

// Handle different types of requests
async function handleRequest(request) {
  const url = new URL(request.url);

  try {
    // Try network first for API requests
    if (url.pathname.startsWith("/api/")) {
      return await networkFirst(request);
    }

    // Try cache first for static assets
    if (isStaticAsset(request.url)) {
      return await cacheFirst(request);
    }

    // For pages, try network first with offline fallback
    return await networkFirstWithOfflineFallback(request);
  } catch (error) {
    console.log("Service Worker: Request failed:", error);

    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      return (
        (await caches.match(OFFLINE_PAGE)) ||
        new Response("Offline", { status: 503 })
      );
    }

    // Return cached version if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// Network first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Return cached version if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Cache first strategy for static assets
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// Network first with offline fallback for pages
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Try to return cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // For navigation requests, return offline page
    if (request.mode === "navigate") {
      return (
        (await caches.match(OFFLINE_PAGE)) ||
        new Response("Offline", { status: 503 })
      );
    }

    throw error;
  }
}

// Check if request is for static assets
function isStaticAsset(url) {
  const staticExtensions = [
    ".js",
    ".css",
    ".png",
    ".jpg",
    ".jpeg",
    ".svg",
    ".gif",
    ".webp",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
  ];
  return staticExtensions.some((ext) => url.includes(ext));
}

// Listen for messages from the main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "ONLINE") {
    console.log("Service Worker: App is online, syncing data...");
    // Trigger background sync if available
    if ("sync" in self.registration) {
      self.registration.sync.register("background-sync");
    }
  }

  if (event.data && event.data.type === "OFFLINE") {
    console.log("Service Worker: App is offline");
  }

  if (event.data && event.data.type === "PRELOAD_DATA") {
    console.log("Service Worker: Preloading data...");
    preloadEssentialData();
  }
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(handleBackgroundSync());
  }
});

// Handle background sync
async function handleBackgroundSync() {
  try {
    console.log("Service Worker: Background sync started");

    // Notify clients that sync is complete
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: "CACHE_UPDATED" });
    });

    console.log("Service Worker: Background sync completed");
  } catch (error) {
    console.error("Service Worker: Background sync failed:", error);
  }
}

// Preload essential data for offline use
async function preloadEssentialData() {
  try {
    const cache = await caches.open(CACHE_NAME);

    // Preload critical pages
    const criticalPages = ["/", "/offline", "/schedule-wizard"];

    for (const page of criticalPages) {
      try {
        const response = await fetch(page);
        if (response.ok) {
          await cache.put(page, response);
        }
      } catch (error) {
        console.log(`Service Worker: Failed to preload ${page}:`, error);
      }
    }

    console.log("Service Worker: Essential data preloaded");
  } catch (error) {
    console.error("Service Worker: Failed to preload data:", error);
  }
}

// Handle push notifications (for future use)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
      tag: "unimaz-notification",
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow("/");
      }
    })
  );
});
