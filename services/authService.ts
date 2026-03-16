import apiClient from './apiClient';

export const authService = {
    login: async (credentials: any) => {
        // Token-based auth doesn't need CSRF cookie
        const response: any = await apiClient.post('/login', credentials);
        if (response.token) {
            localStorage.setItem('royalgateway_auth_token', response.token);
        }
        if (response.user) {
            localStorage.setItem('royalgateway_user', JSON.stringify(response.user));
        }
        return response; // return full response so permissions are available
    },

    logout: async () => {
        // Clear locally first and synchronously to prevent race conditions on refresh
        localStorage.removeItem('royalgateway_auth_token');
        localStorage.removeItem('royalgateway_user');
        
        try {
            await apiClient.post('/logout');
        } catch (e: any) {
            // 401 means token already expired — not a real error
            if (e?.response?.status !== 401) {
                console.error("Logout error", e);
            }
        }
    },

    getUser: async () => {
        try {
            const response: any = await apiClient.get('/user');
            if (response && response.user) {
                localStorage.setItem('royalgateway_user', JSON.stringify(response.user));
            }
            return response;
        } catch (error) {
            return null;
        }
    }
};
