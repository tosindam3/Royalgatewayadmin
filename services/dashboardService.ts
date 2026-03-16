import apiClient from './apiClient';

// Simple in-memory cache for dashboard data to ensure "speed" on tab switching/navigation
let dashboardCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

export const dashboardService = {
    /**
     * Get the dashboard manifest (layout and authorized widgets)
     */
    getManifest: async () => {
        return await apiClient.get('/dashboard');
    },

    /**
     * Fetch a specific metric from a given endpoint
     */
    getMetric: async (endpoint: string) => {
        return await apiClient.get(endpoint);
    },

    /**
     * Fetch unified dashboard intelligence (Legacy support)
     */
    getIntelligence: async (forceRefresh = false) => {
        // ... (existing logic or refactor to use manifest)
        return await apiClient.get('/dashboard'); // Fallback for transition
    },

    /**
     * Clear cache manually if needed
     */
    clearCache: () => {
        dashboardCache = null;
    }
};
