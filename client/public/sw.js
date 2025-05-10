self.addEventListener('install', (event) => {
  console.log('Service worker installed');
  self.skipWaiting(); // Optional: activate immediately
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
});

self.addEventListener('fetch', (event) => {
  // For now, just let all requests pass through.
  // Later you can add caching here.
});