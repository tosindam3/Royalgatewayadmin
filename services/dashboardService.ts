import apiClient from './apiClient';

// Simple in-memory cache for dashboard data to ensure "speed" on tab switching/navigation
let dashboardCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

export const dashboardService = {
    /**
     * Fetch unified dashboard intelligence
     * Includes caching layer for maximum performance
     */
    getIntelligence: async (forceRefresh = false) => {
        const now = Date.now();

        if (!forceRefresh && dashboardCache && (now - dashboardCache.timestamp < CACHE_TTL)) {
            console.log('Serving dashboard data from cache');
            return dashboardCache.data;
        }

        try {
            const data = await apiClient.get('/dashboard');
            dashboardCache = { data, timestamp: now };
            return data;
        } catch (error) {
            // If error and we have stale cache, return it as fallback for "resilience"
            if (dashboardCache) return dashboardCache.data;
            throw error;
        }
    },

    /**
     * Clear cache manually if needed
     */
    clearCache: () => {
        dashboardCache = null;
    }
};
