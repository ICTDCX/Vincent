/**
 * Service Worker for Vincent E Neu PWA
 * Handles caching, offline support, and background sync
 */

const CACHE_NAME = 'vincent-e-neu-v2.1';
const STATIC_CACHE = 'vincent-e-neu-static-v2.1';
const DYNAMIC_CACHE = 'vincent-e-neu-dynamic-v2.1';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.html',
    '/admin.html',
    '/login.html',
    '/gemini-api.js',
    '/file-processor.js',
    '/search-system.js',
    '/analytics-system.js',
    '/payment-system.js',
    '/realtime-chat.js',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Google+Sans:wght@300;400;500;600;700&display=swap'
];

// API endpoints to cache
const API_CACHE = [
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Caching static files...');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Error caching static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle different types of requests
    if (isStaticFile(request)) {
        event.respondWith(serveStaticFile(request));
    } else if (isApiRequest(request)) {
        event.respondWith(serveApiRequest(request));
    } else {
        event.respondWith(serveDynamicContent(request));
    }
});

// Check if request is for static file
function isStaticFile(request) {
    const url = new URL(request.url);
    return STATIC_FILES.includes(url.pathname) || 
           STATIC_FILES.includes(url.href) ||
           url.pathname.endsWith('.js') ||
           url.pathname.endsWith('.css') ||
           url.pathname.endsWith('.html');
}

// Check if request is for API
function isApiRequest(request) {
    const url = new URL(request.url);
    return API_CACHE.some(apiUrl => url.href.includes(apiUrl)) ||
           url.pathname.includes('/api/');
}

// Serve static files from cache
async function serveStaticFile(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback to network
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Error serving static file:', error);
        
        // Return offline page for HTML requests
        if (request.destination === 'document') {
            return caches.match('/offline.html');
        }
        
        throw error;
    }
}

// Serve API requests with network-first strategy
async function serveApiRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('API request failed, trying cache:', error);
        
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline response
        return new Response(
            JSON.stringify({ error: 'Offline mode - API not available' }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Serve dynamic content
async function serveDynamicContent(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Dynamic content request failed:', error);
        
        // Try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(performBackgroundSync());
    }
});

// Perform background sync
async function performBackgroundSync() {
    try {
        // Get pending actions from IndexedDB
        const pendingActions = await getPendingActions();
        
        for (const action of pendingActions) {
            try {
                await processPendingAction(action);
                await removePendingAction(action.id);
            } catch (error) {
                console.error('Failed to process pending action:', error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Get pending actions from IndexedDB
async function getPendingActions() {
    // This would typically use IndexedDB
    // For now, return empty array
    return [];
}

// Process pending action
async function processPendingAction(action) {
    switch (action.type) {
        case 'file_upload':
            return processFileUpload(action.data);
        case 'ai_interaction':
            return processAiInteraction(action.data);
        case 'search_query':
            return processSearchQuery(action.data);
        default:
            console.warn('Unknown action type:', action.type);
    }
}

// Process file upload
async function processFileUpload(data) {
    // Simulate file upload processing
    console.log('Processing file upload:', data);
    return Promise.resolve();
}

// Process AI interaction
async function processAiInteraction(data) {
    // Simulate AI interaction processing
    console.log('Processing AI interaction:', data);
    return Promise.resolve();
}

// Process search query
async function processSearchQuery(data) {
    // Simulate search query processing
    console.log('Processing search query:', data);
    return Promise.resolve();
}

// Remove pending action
async function removePendingAction(actionId) {
    // This would typically remove from IndexedDB
    console.log('Removing pending action:', actionId);
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('Push notification received:', event);
    
    const options = {
        body: event.data ? event.data.text() : 'Bạn có thông báo mới từ Vincent E Neu',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Xem chi tiết',
                icon: '/icons/checkmark.png'
            },
            {
                action: 'close',
                title: 'Đóng',
                icon: '/icons/xmark.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Vincent E Neu', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);
    
    switch (event.data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'CACHE_FILES':
            cacheFiles(event.data.files);
            break;
        case 'CLEAR_CACHE':
            clearCache();
            break;
        case 'GET_CACHE_INFO':
            getCacheInfo().then(info => {
                event.ports[0].postMessage(info);
            });
            break;
        default:
            console.warn('Unknown message type:', event.data.type);
    }
});

// Cache additional files
async function cacheFiles(files) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        await Promise.all(files.map(file => cache.add(file)));
        console.log('Files cached successfully:', files);
    } catch (error) {
        console.error('Error caching files:', error);
    }
}

// Clear all caches
async function clearCache() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('All caches cleared');
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
}

// Get cache information
async function getCacheInfo() {
    try {
        const cacheNames = await caches.keys();
        const cacheInfo = {};
        
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            cacheInfo[cacheName] = keys.length;
        }
        
        return cacheInfo;
    } catch (error) {
        console.error('Error getting cache info:', error);
        return {};
    }
}

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
    self.addEventListener('periodicsync', (event) => {
        console.log('Periodic sync triggered:', event.tag);
        
        if (event.tag === 'content-sync') {
            event.waitUntil(syncContent());
        }
    });
}

// Sync content periodically
async function syncContent() {
    try {
        // Sync latest content
        console.log('Syncing content...');
        
        // This would typically sync with server
        // For now, just log the action
        return Promise.resolve();
    } catch (error) {
        console.error('Content sync failed:', error);
    }
}

console.log('Service Worker loaded successfully');

