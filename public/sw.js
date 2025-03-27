// Service Worker for Bicep Blaster
const CACHE_VERSION = '2025-03-27-v1';
const CACHE_NAME = `bicep-blaster-${CACHE_VERSION}`;

// Assets to cache immediately on install
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/sound.mp3',
  '/exercises.json',
  '/favicon.ico',
  '/logo.png',
  '/manifest.json'
];

// Assets that should be cached as they're used
const CACHE_EXTENSIONS = [
  '/assets/'
];

// Install event - Cache essential files
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing new version:', CACHE_VERSION);
  
  // Activate the new service worker immediately, don't wait for reload
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating new version:', CACHE_VERSION);
  
  // Take control of all clients immediately
  event.waitUntil(clients.claim());
  
  // Remove old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('bicep-blaster-')) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - Serve from cache, fallback to network, and update cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Handle API requests differently (network-first)
  if (event.request.url.includes('/api/')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }
  
  // For everything else, use cache-first strategy
  event.respondWith(cacheFirstStrategy(event.request));
});

// Cache-first strategy: Try cache first, then network, then update cache
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try to get from cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    // Return cached response immediately
    
    // For HTML files, always fetch a fresh copy in the background
    if (request.headers.get('accept')?.includes('text/html')) {
      refreshCache(request, cache);
    }
    
    return cachedResponse;
  }
  
  // If not in cache, try network
  return fetchAndCache(request, cache);
}

// Network-first strategy: Try network first, fallback to cache
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache the response if successful
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If nothing in cache either, return a fallback or error
    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Helper function to fetch and cache
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    
    // Only cache valid responses
    if (response.ok) {
      // Check if this is a resource we should cache
      const url = new URL(request.url);
      const shouldCache = CACHE_EXTENSIONS.some(ext => url.pathname.includes(ext)) || 
                          CORE_ASSETS.includes(url.pathname);
      
      if (shouldCache) {
        cache.put(request, response.clone());
      }
    }
    
    return response;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    
    // For navigation requests, return the offline page
    if (request.mode === 'navigate') {
      return caches.match('/');
    }
    
    // Otherwise just propagate the error
    throw error;
  }
}

// Helper function to refresh cache in the background
async function refreshCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response);
    }
  } catch (error) {
    console.error('[Service Worker] Background refresh failed:', error);
  }
}
