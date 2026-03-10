import React, { useState, useEffect } from 'react';
import { currencyApi } from '../services/currencyApi';
import { CurrencySettings as CurrencySettingsType, Currency, setCurrencySettings, formatCurrency } from '../utils/currency';
import { toast } from 'sonner';
import { DollarSign, Loader2, Check } from 'lucide-react';
import GlassCard from './GlassCard';

const CurrencySettings: React.FC = () => {
  const [settings, setSettings] = useState<CurrencySettingsType>({
    currency_code: 'USD',
    currency_symbol: '$',
    currency_position: 'before',
    decimal_separator: '.',
    thousand_separator: ',',
    decimal_places: 2,
  });
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsData, currenciesData] = await Promise.all([
        currencyApi.getSettings(),
        currencyApi.getCurrencyList(),
      ]);
      setSettings(settingsData);
      setCurrencies(currenciesData);
      setCurrencySettings(settingsData);
    } catch (error: any) {
      toast.error('Failed to load currency settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrencyChange = (code: string) => {
    const currency = currencies.find(c => c.code === code);
    if (currency) {
      setSettings({
        ...settings,
        currency_code: currency.code,
        currency_symbol: currency.symbol,
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await currencyApi.updateSettings(settings);
      setCurrencySettings(updated);
      toast.success('Currency settings updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update currency settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <GlassCard title="Currency Settings">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      </GlassCard>
    );
  }

  const previewAmount = 1234567.89;

  return (
    <GlassCard title="Currency Settings" icon={DollarSign}>
      <div className="space-y-6">
        {/* Currency Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Currency
          </label>
          <select
            value={settings.currency_code}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name} ({currency.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Currency Symbol */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Currency Symbol
          </label>
          <input
            type="text"
            value={settings.currency_symbol}
            onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            maxLength={10}
          />
        </div>

        {/* Currency Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Symbol Position
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="before"
                checked={settings.currency_position === 'before'}
                onChange={(e) => setSettings({ ...settings, currency_position: e.target.value as 'before' | 'after' })}
                className="text-purple-500 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Before amount ({settings.currency_symbol}100)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="after"
                checked={settings.currency_position === 'after'}
                onChange={(e) => setSettings({ ...settings, currency_position: e.target.value as 'before' | 'after' })}
                className="text-purple-500 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">After amount (100 {settings.currency_symbol})</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Decimal Separator */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Decimal Separator
            </label>
            <input
              type="text"
              value={settings.decimal_separator}
              onChange={(e) => setSettings({ ...settings, decimal_separator: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={1}
            />
          </div>

          {/* Thousand Separator */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Thousand Separator
            </label>
            <input
              type="text"
              value={settings.thousand_separator}
              onChange={(e) => setSettings({ ...settings, thousand_separator: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={1}
            />
          </div>

          {/* Decimal Places */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Decimal Places
            </label>
            <input
              type="number"
              value={settings.decimal_places}
              onChange={(e) => setSettings({ ...settings, decimal_places: parseInt(e.target.value) || 0 })}
              min={0}
              max={4}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <p className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">Preview</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {formatCurrency(previewAmount, true, settings)}
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Currency Settings
              </>
            )}
          </button>
        </div>
      </div>
    </GlassCard>
  );
};

export default CurrencySettings;
