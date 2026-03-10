import { useState, useEffect } from 'react';
import { currencyApi } from '../services/currencyApi';
import { CurrencySettings, setCurrencySettings, getCurrencySettings } from '../utils/currency';

export const useCurrency = () => {
  const [settings, setSettings] = useState<CurrencySettings>(getCurrencySettings());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await currencyApi.getSettings();
      setSettings(data);
      setCurrencySettings(data);
    } catch (error) {
      console.error('Failed to load currency settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { settings, isLoading, reload: loadSettings };
};
