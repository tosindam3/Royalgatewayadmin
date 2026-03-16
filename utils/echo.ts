import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo<any>;
    }
}

window.Pusher = Pusher;

export const initEcho = (token: string | null) => {
    if (!token) return null;

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
    const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER;

    if (!apiBaseUrl || !pusherKey || !pusherCluster) {
        console.error('Missing Echo configuration environment variables');
        return null;
    }

    return new Echo({
        broadcaster: 'pusher',
        key: pusherKey,
        cluster: pusherCluster,
        forceTLS: true,
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${apiBaseUrl}/broadcasting/auth`,
        auth: {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        },
        // Connection error handling
        enableStats: false,
        enableLogging: import.meta.env.DEV,
    });
};
