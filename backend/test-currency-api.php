<?php

require __DIR__ . '/vendor/autoload.php';

use App\Helpers\CurrencyHelper;

echo "=== Currency Settings Test ===\n\n";

// Test 1: Format with default settings
echo "1. Format with default USD settings:\n";
echo "   Amount: 1234567.89\n";
echo "   Formatted: " . CurrencyHelper::format(1234567.89) . "\n\n";

// Test 2: Get current settings
echo "2. Current currency settings:\n";
$settings = CurrencyHelper::getSettings();
foreach ($settings as $key => $value) {
    echo "   $key: $value\n";
}
echo "\n";

// Test 3: Get currency list
echo "3. Available currencies (first 10):\n";
$currencies = CurrencyHelper::getCurrencyList();
foreach (array_slice($currencies, 0, 10) as $currency) {
    echo "   {$currency['code']} - {$currency['name']} ({$currency['symbol']})\n";
}
echo "   ... and " . (count($currencies) - 10) . " more\n\n";

// Test 4: Format different amounts
echo "4. Format various amounts:\n";
$amounts = [0, 100, 1000, 10000.50, 1234567.89, -500.25];
foreach ($amounts as $amount) {
    echo "   " . str_pad($amount, 12) . " => " . CurrencyHelper::format($amount) . "\n";
}

echo "\n=== Test Complete ===\n";
