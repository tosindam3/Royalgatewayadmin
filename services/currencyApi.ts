import api from './apiClient';
import { CurrencySettings, Currency } from '../utils/currency';

export const currencyApi = {
  /**
   * Get current currency settings
   */
  async getSettings(): Promise<CurrencySettings> {
    const response = await api.get('/payroll/currency/settings');
    return response.data;
  },

  /**
   * Get list of available currencies
   */
  async getCurrencyList(): Promise<Currency[]> {
    const response = await api.get('/payroll/currency/list');
    return response.data;
  },

  /**
   * Update currency settings
   */
  async updateSettings(settings: CurrencySettings): Promise<CurrencySettings> {
    const response = await api.post('/payroll/currency/settings', settings);
    return response.data;
  },
};
