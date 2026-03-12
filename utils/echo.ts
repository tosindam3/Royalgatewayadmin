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

    // Disable WebSocket in production until properly configured
    if (window.location.hostname === 'www.royalgatewayadmin.com' || 
        window.location.hostname === 'royalgatewayadmin.com') {
        console.log('WebSocket disabled in production environment');
        return null;
    }

    return new Echo({
        broadcaster: 'reverb',
        key: 'rgadmin_key',
        wsHost: window.location.hostname,
        wsPort: 8080,
        forceTLS: false,
        enabledTransports: ['ws'],
        authEndpoint: `${window.location.protocol}//${window.location.hostname}:8000/api/v1/broadcasting/auth`,
        auth: {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        },
    });
};
