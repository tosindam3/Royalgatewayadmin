
import apiClient from './apiClient';

class PushService {
    private static instance: PushService;
    private publicVapidKey = 'BLd2pJyBGzkJjalPUpqbKhmTpWshoKeNh3onhOaH_TSWGzR7dXwqAcKW7wFJhgpwM18xaL75ukGwUl4--SRl49E';

    public static getInstance() {
        if (!PushService.instance) {
            PushService.instance = new PushService();
        }
        return PushService.instance;
    }

    async register() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications are not supported in this browser');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
            
            // Trigger subscription check
            await this.subscribeUser(registration);
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }

    async subscribeUser(registration: ServiceWorkerRegistration) {
        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.publicVapidKey)
            });

            console.log('User is subscribed:', subscription);
            await this.sendSubscriptionToBackend(subscription);
        } catch (error: any) {
            if (Notification.permission === 'denied') {
                console.warn('Permission for notifications was denied');
            } else {
                console.error('Failed to subscribe the user: ', error);
            }
        }
    }

    private async sendSubscriptionToBackend(subscription: PushSubscription) {
        try {
            // apiClient already unwraps the response and returns the data payload
            const data = await apiClient.post('/chat/push-subscriptions', subscription.toJSON());
            console.log('Subscription sent to backend:', data);
        } catch (error) {
            console.error('Failed to send subscription to backend:', error);
        }
    }

    private urlBase64ToUint8Array(base64String: string) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

export default PushService.getInstance();
