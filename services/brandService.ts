import axios from 'axios';
import apiClient from './apiClient';
import { updateBrandColor, initBrandColors } from '../utils/brandColors';

export interface BrandSettings {
  id?: number;
  organization_id?: number;
  primary_color: string;
  secondary_color?: string;
  logo_url?: string;
  company_name?: string;
  created_at?: string;
  updated_at?: string;
}

class BrandService {
  private cache: BrandSettings | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 300000; // 5 minutes

  /**
   * Get brand settings from API or cache
   */
  async getBrandSettings(forceRefresh = false): Promise<BrandSettings> {
    const now = Date.now();
    
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && this.cache && (now - this.cacheTimestamp < this.CACHE_TTL)) {
      return this.cache;
    }

    try {
      // Use raw axios (no Authorization header) so an expired token
      // never causes a 401 → logout cascade on this public endpoint.
      const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const raw = await axios.get(`${baseURL}/brand-settings`, {
        headers: { Accept: 'application/json' },
      });
      // Unwrap the standard {status, data} envelope if present
      const response = (raw.data?.status === 'success' ? raw.data.data : raw.data) as any;
      
      // Transform the response to match our interface
      const transformedResponse: BrandSettings = {
        primary_color: response.primaryColor || response.primary_color || '#8252e9',
        secondary_color: response.secondaryColor || response.secondary_color,
        logo_url: response.logoUrl || response.logo_url,
        company_name: response.companyName || response.company_name || 'HR360'
      };
      
      this.cache = transformedResponse;
      this.cacheTimestamp = now;
      
      // Apply brand colors to the UI
      if (transformedResponse.primary_color) {
        updateBrandColor(transformedResponse.primary_color);
      }
      
      return transformedResponse;
    } catch (error) {
      console.error('Failed to fetch brand settings:', error);
      
      // Return default brand settings if API fails
      const defaultSettings: BrandSettings = {
        primary_color: '#8252e9',
        secondary_color: '#6366f1',
        company_name: 'HR360'
      };
      
      // Apply default colors
      updateBrandColor(defaultSettings.primary_color);
      
      return defaultSettings;
    }
  }

  /**
   * Update brand settings
   */
  async updateBrandSettings(settings: Partial<BrandSettings>): Promise<BrandSettings> {
    try {
      // Transform our interface to match the API expected format
      const apiPayload = {
        companyName: settings.company_name,
        logoUrl: settings.logo_url,
        primaryColor: settings.primary_color,
        secondaryColor: settings.secondary_color
      };

      const response = await apiClient.put('/brand-settings', apiPayload) as any;
      
      // Transform the response back to our interface
      const transformedResponse: BrandSettings = {
        primary_color: response.primaryColor || response.primary_color || '#8252e9',
        secondary_color: response.secondaryColor || response.secondary_color,
        logo_url: response.logoUrl || response.logo_url,
        company_name: response.companyName || response.company_name || 'HR360'
      };
      
      // Update cache
      this.cache = transformedResponse;
      this.cacheTimestamp = Date.now();
      
      // Apply new brand colors to the UI
      if (transformedResponse.primary_color) {
        updateBrandColor(transformedResponse.primary_color);
      }
      
      return transformedResponse;
    } catch (error) {
      console.error('Failed to update brand settings:', error);
      throw error;
    }
  }

  /**
   * Initialize brand colors on app startup
   */
  async initializeBrandColors(): Promise<void> {
    try {
      const settings = await this.getBrandSettings();
      if (settings.primary_color) {
        updateBrandColor(settings.primary_color);
      } else {
        // Initialize with default color
        initBrandColors('#8252e9');
      }
    } catch (error) {
      console.error('Failed to initialize brand colors:', error);
      // Fallback to default
      initBrandColors('#8252e9');
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Get current cached brand settings (synchronous)
   */
  getCachedBrandSettings(): BrandSettings | null {
    return this.cache;
  }
}

export const brandService = new BrandService();
export default brandService;