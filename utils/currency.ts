export interface CurrencySettings {
  currency_code: string;
  currency_symbol: string;
  currency_position: 'before' | 'after';
  decimal_separator: string;
  thousand_separator: string;
  decimal_places: number;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

// Default settings
const defaultSettings: CurrencySettings = {
  currency_code: 'USD',
  currency_symbol: '$',
  currency_position: 'before',
  decimal_separator: '.',
  thousand_separator: ',',
  decimal_places: 2,
};

// Store currency settings in memory
let cachedSettings: CurrencySettings | null = null;

export const setCurrencySettings = (settings: CurrencySettings) => {
  cachedSettings = settings;
};

export const getCurrencySettings = (): CurrencySettings => {
  return cachedSettings || defaultSettings;
};

/**
 * Format amount according to currency settings
 */
export const formatCurrency = (
  amount: number | string | null | undefined,
  includeSymbol: boolean = true,
  settings?: CurrencySettings
): string => {
  if (amount === null || amount === undefined || amount === '') {
    return '-';
  }

  const currencySettings = settings || getCurrencySettings();
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return '-';
  }

  // Format the number
  const parts = numAmount.toFixed(currencySettings.decimal_places).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currencySettings.thousand_separator);
  const decimalPart = parts[1];
  
  let formatted = integerPart;
  if (currencySettings.decimal_places > 0) {
    formatted += currencySettings.decimal_separator + decimalPart;
  }

  // Add currency symbol if requested
  if (includeSymbol) {
    if (currencySettings.currency_position === 'before') {
      return currencySettings.currency_symbol + formatted;
    } else {
      return formatted + ' ' + currencySettings.currency_symbol;
    }
  }

  return formatted;
};

/**
 * Parse formatted currency string to number
 */
export const parseCurrency = (
  value: string,
  settings?: CurrencySettings
): number => {
  const currencySettings = settings || getCurrencySettings();
  
  // Remove currency symbol
  let cleaned = value.replace(currencySettings.currency_symbol, '').trim();
  
  // Remove thousand separators
  cleaned = cleaned.replace(new RegExp('\\' + currencySettings.thousand_separator, 'g'), '');
  
  // Replace decimal separator with dot
  if (currencySettings.decimal_separator !== '.') {
    cleaned = cleaned.replace(currencySettings.decimal_separator, '.');
  }
  
  return parseFloat(cleaned) || 0;
};
