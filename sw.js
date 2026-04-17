// Service Worker for PWA Functionality

const CACHE_NAME = 'college-notes-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/login.html',
    '/signup.html',
    '/admin-panel.html',
    '/dashboard.html',
    '/css/style.css',
    '/css/responsive.css',
    '/js/config.js',
    '/js/auth.js',
    '/js/db.js',
    '/js/ui.js',
    '/js/app.js',
    '/js/admin.js',
    '/js/dashboard.js',
    '/manifest.json'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch(err => console.log('Cache addAll error:', err))
    );
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip Supabase API calls
    if (event.request.url.includes('supabase')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Clone the response
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }

                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                return response;
            })
            .catch(() => {
                // Return cached version if network fails
                return caches.match(event.request)
                    .then(response => {
                        return response || new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Background sync for offline uploads
self.addEventListener('sync', event => {
    if (event.tag === 'sync-uploads') {
        event.waitUntil(syncUploads());
    }
});

async function syncUploads() {
    try {
        const db = await openIndexedDB();
        const uploads = await getOfflineUploads(db);
        
        for (const upload of uploads) {
            // Attempt to sync each offline upload
            const success = await syncUpload(upload);
            if (success) {
                await removeOfflineUpload(db, upload.id);
            }
        }
    } catch (error) {
        console.error('Sync error:', error);
    }
}

// IndexedDB helpers
function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CollegeNotes', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('uploads')) {
                db.createObjectStore('uploads', { keyPath: 'id' });
            }
        };
    });
}

function getOfflineUploads(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('uploads', 'readonly');
        const store = transaction.objectStore('uploads');
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function removeOfflineUpload(db, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('uploads', 'readwrite');
        const store = transaction.objectStore('uploads');
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}
