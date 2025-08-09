const CACHE_NAME = 'task-manager-v2';
const BASE_URL = 'https://taskmanager1011.netlify.app';
const urlsToCache = [
    `${BASE_URL}/`,
    `${BASE_URL}/index.html`,
    `${BASE_URL}/style.css`,
    `${BASE_URL}/mobile.css`,
    `${BASE_URL}/script.js`,
    `${BASE_URL}/mobile.js`,
    `${BASE_URL}/share.js`,
    `${BASE_URL}/manifest.json`,
    `${BASE_URL}/icons/icon-192.png`,
    `${BASE_URL}/icons/icon-512.png`,
    `${BASE_URL}/offline.html`,
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/qrcode@1.4.4/build/qrcode.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then(response => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response as it can only be used once
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // If fetch fails, return the offline page for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match(`${BASE_URL}/offline.html`);
                        }
                        return null;
                    });
            })
    );
});
