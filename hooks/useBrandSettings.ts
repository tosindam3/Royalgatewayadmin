import { useState, useEffect, useCallback } from 'react';
import { brandService, BrandSettings } from '../services/brandService';

interface UseBrandSettingsReturn {
  brandSettings: BrandSettings | null;
  isLoading: boolean;
  error: string | null;
  updateBrandSettings: (settings: Partial<BrandSettings>) => Promise<void>;
  refreshBrandSettings: () => Promise<void>;
}

export const useBrandSettings = (): UseBrandSettingsReturn => {
  const [brandSettings, setBrandSettings] = useState<BrandSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrandSettings = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const settings = await brandService.getBrandSettings(forceRefresh);
      setBrandSettings(settings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch brand settings';
      setError(errorMessage);
      console.error('Error fetching brand settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateBrandSettings = useCallback(async (settings: Partial<BrandSettings>) => {
    try {
      setError(null);
      
      const updatedSettings = await brandService.updateBrandSettings(settings);
      setBrandSettings(updatedSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update brand settings';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const refreshBrandSettings = useCallback(async () => {
    await fetchBrandSettings(true);
  }, [fetchBrandSettings]);

  // Initialize brand settings on mount
  useEffect(() => {
    fetchBrandSettings();
  }, [fetchBrandSettings]);

  // Initialize brand colors on app startup
  useEffect(() => {
    brandService.initializeBrandColors();
  }, []);

  return {
    brandSettings,
    isLoading,
    error,
    updateBrandSettings,
    refreshBrandSettings
  };
};

export default useBrandSettings;