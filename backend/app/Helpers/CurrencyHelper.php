<?php

namespace App\Helpers;

use App\Models\OrganizationSetting;

class CurrencyHelper
{
    /**
     * Format amount according to organization currency settings
     */
    public static function format($amount, bool $includeSymbol = true): string
    {
        if ($amount === null) {
            return '-';
        }

        $currencyCode = OrganizationSetting::get('payroll.currency_code', 'USD');
        $currencySymbol = OrganizationSetting::get('payroll.currency_symbol', '$');
        $currencyPosition = OrganizationSetting::get('payroll.currency_position', 'before');
        $decimalSeparator = OrganizationSetting::get('payroll.decimal_separator', '.');
        $thousandSeparator = OrganizationSetting::get('payroll.thousand_separator', ',');
        $decimalPlaces = OrganizationSetting::get('payroll.decimal_places', 2);

        // Format the number
        $formatted = number_format(
            (float) $amount,
            (int) $decimalPlaces,
            $decimalSeparator,
            $thousandSeparator
        );

        // Add currency symbol if requested
        if ($includeSymbol) {
            if ($currencyPosition === 'before') {
                return $currencySymbol . $formatted;
            } else {
                return $formatted . ' ' . $currencySymbol;
            }
        }

        return $formatted;
    }

    /**
     * Get currency settings as array
     */
    public static function getSettings(): array
    {
        return [
            'currency_code' => OrganizationSetting::get('payroll.currency_code', 'USD'),
            'currency_symbol' => OrganizationSetting::get('payroll.currency_symbol', '$'),
            'currency_position' => OrganizationSetting::get('payroll.currency_position', 'before'),
            'decimal_separator' => OrganizationSetting::get('payroll.decimal_separator', '.'),
            'thousand_separator' => OrganizationSetting::get('payroll.thousand_separator', ','),
            'decimal_places' => OrganizationSetting::get('payroll.decimal_places', 2),
        ];
    }

    /**
     * Get list of common currencies
     */
    public static function getCurrencyList(): array
    {
        return [
            ['code' => 'USD', 'symbol' => '$', 'name' => 'US Dollar'],
            ['code' => 'EUR', 'symbol' => '€', 'name' => 'Euro'],
            ['code' => 'GBP', 'symbol' => '£', 'name' => 'British Pound'],
            ['code' => 'JPY', 'symbol' => '¥', 'name' => 'Japanese Yen'],
            ['code' => 'CNY', 'symbol' => '¥', 'name' => 'Chinese Yuan'],
            ['code' => 'INR', 'symbol' => '₹', 'name' => 'Indian Rupee'],
            ['code' => 'AUD', 'symbol' => 'A$', 'name' => 'Australian Dollar'],
            ['code' => 'CAD', 'symbol' => 'C$', 'name' => 'Canadian Dollar'],
            ['code' => 'CHF', 'symbol' => 'CHF', 'name' => 'Swiss Franc'],
            ['code' => 'SEK', 'symbol' => 'kr', 'name' => 'Swedish Krona'],
            ['code' => 'NZD', 'symbol' => 'NZ$', 'name' => 'New Zealand Dollar'],
            ['code' => 'SGD', 'symbol' => 'S$', 'name' => 'Singapore Dollar'],
            ['code' => 'HKD', 'symbol' => 'HK$', 'name' => 'Hong Kong Dollar'],
            ['code' => 'NOK', 'symbol' => 'kr', 'name' => 'Norwegian Krone'],
            ['code' => 'KRW', 'symbol' => '₩', 'name' => 'South Korean Won'],
            ['code' => 'TRY', 'symbol' => '₺', 'name' => 'Turkish Lira'],
            ['code' => 'RUB', 'symbol' => '₽', 'name' => 'Russian Ruble'],
            ['code' => 'BRL', 'symbol' => 'R$', 'name' => 'Brazilian Real'],
            ['code' => 'ZAR', 'symbol' => 'R', 'name' => 'South African Rand'],
            ['code' => 'MXN', 'symbol' => 'Mex$', 'name' => 'Mexican Peso'],
            ['code' => 'AED', 'symbol' => 'د.إ', 'name' => 'UAE Dirham'],
            ['code' => 'SAR', 'symbol' => '﷼', 'name' => 'Saudi Riyal'],
            ['code' => 'EGP', 'symbol' => 'E£', 'name' => 'Egyptian Pound'],
            ['code' => 'NGN', 'symbol' => '₦', 'name' => 'Nigerian Naira'],
            ['code' => 'KES', 'symbol' => 'KSh', 'name' => 'Kenyan Shilling'],
            ['code' => 'GHS', 'symbol' => 'GH₵', 'name' => 'Ghanaian Cedi'],
            ['code' => 'PHP', 'symbol' => '₱', 'name' => 'Philippine Peso'],
            ['code' => 'IDR', 'symbol' => 'Rp', 'name' => 'Indonesian Rupiah'],
            ['code' => 'MYR', 'symbol' => 'RM', 'name' => 'Malaysian Ringgit'],
            ['code' => 'THB', 'symbol' => '฿', 'name' => 'Thai Baht'],
            ['code' => 'VND', 'symbol' => '₫', 'name' => 'Vietnamese Dong'],
            ['code' => 'PKR', 'symbol' => '₨', 'name' => 'Pakistani Rupee'],
            ['code' => 'BDT', 'symbol' => '৳', 'name' => 'Bangladeshi Taka'],
        ];
    }
}
