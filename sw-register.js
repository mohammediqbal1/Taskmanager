// Service Worker
const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('ServiceWorker registration successful');
        } catch (err) {
            console.log('ServiceWorker registration failed: ', err);
        }
    }
};

registerServiceWorker();
