// Notification Service - Handles browser notification permissions and display

export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

export const showBrowserNotification = (title: string, body: string, onClick?: () => void) => {
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200],
            tag: 'partnership-request',
            requireInteraction: true
        });

        if (onClick) {
            notification.onclick = () => {
                onClick();
                notification.close();
            };
        }
    }
};

export const isNotificationSupported = (): boolean => {
    return 'Notification' in window;
};

export const getNotificationPermissionStatus = (): NotificationPermission | null => {
    if (!isNotificationSupported()) return null;
    return Notification.permission;
};
