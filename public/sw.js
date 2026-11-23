self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {
        title: 'VIXAI · Aaj Ka Shubh Vichar ☀️',
        body: 'Aapki himmat aur neeyat hi aapki sabse badi daulat hai. Aaj ka din aapka hai!'
    };
    const options = {
        body: data.body,
        icon: '/icon.png',
        badge: '/icon.png',
        vibrate: [100, 50, 100],
        data: { url: 'https://vixaii.sarahics.in' }
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(clients.openWindow('https://vixaii.sarahics.in'));
});
