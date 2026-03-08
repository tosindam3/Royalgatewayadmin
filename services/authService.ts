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
        return response.user;
    },

    logout: async () => {
        try {
            await apiClient.post('/logout');
        } catch (e) {
            console.error("Logout error", e);
        } finally {
            localStorage.removeItem('royalgateway_auth_token');
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
