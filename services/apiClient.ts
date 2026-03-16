import axios from 'axios';
import { toast } from 'sonner';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Request Interceptor
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('royalgateway_auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
    (response) => {
        // If response has the standard API wrapper format {status, message, data}
        // unwrap it to just return the data
        if (response.data && response.data.status === 'success') {
            // Paginated response: has both data (items) and meta (pagination)
            if (response.data.meta && Array.isArray(response.data.data)) {
                return { data: response.data.data, meta: response.data.meta };
            }
            return response.data.data !== undefined ? response.data.data : {};
        }
        // For direct responses (like paginated data), return as-is
        return response.data || {};
    },
    (error) => {
        const message = error.response?.data?.message || 'A transmission error occurred in the intelligence hub.';
        const status = error.response?.status;

        if (status === 401) {
            // Public endpoints that may receive a 401 when an expired token is
            // passively sent — these should NOT trigger a full session logout.
            const SKIP_LOGOUT_URLS = ['/brand-settings'];
            const requestUrl = error.config?.url || '';
            const isPublicEndpoint = SKIP_LOGOUT_URLS.some(u => requestUrl.includes(u));

            const isLoginRequest = error.config?.url?.includes('/login');

            if (isLoginRequest) {
                toast.error('Authorization Failed', {
                    description: 'Invalid credentials detected. Please try again or reset password.'
                });
            } else if (!isPublicEndpoint) {
                // Only nuke the session for genuinely protected-endpoint 401s
                localStorage.removeItem('royalgateway_auth_token');
                localStorage.removeItem('royalgateway_user');
                toast.error('Session Decoupled', {
                    description: 'Authentication token expired. Please re-authorize access.',
                });
                if (window.location.hash !== '#/login') {
                    window.location.hash = '#/login';
                }
            }
            // For public-endpoint 401s: silently swallow — callers have their own fallbacks

        } else if (status === 403) {
            toast.error('Access Restricted', {
                description: message || 'Your identity role does not possess the required clearance.',
            });
        } else if (status === 422) {
            // Validation error
            toast.error('Validation Conflict', {
                description: Object.values(error.response.data.errors).flat().join(', '),
            });
        } else if (status >= 500) {
            toast.error('Core Synchronization Failure', {
                description: 'The backend intelligence layer is currently unresponsive.',
            });
        } else {
            toast.error('Unknown Error', { description: message });
        }

        return Promise.reject(error);
    }
);

export default apiClient;
