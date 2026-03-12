# Production Seeder Script (PowerShell)
# This script runs production-safe seeders for performance templates, employees, and payroll

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Production Seeder Script" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the backend directory
if (-not (Test-Path "artisan")) {
    Write-Host "Error: artisan file not found. Please run this script from the backend directory." -ForegroundColor Red
    exit 1
}

# Check environment
$env = php artisan env
Write-Host "Current environment: $env" -ForegroundColor Yellow
Write-Host ""

# Confirm before proceeding
Write-Host "This will seed the following data:"
Write-Host "  - Performance templates and configurations"
Write-Host "  - Employee data and salary structures"
Write-Host "  - Payroll items, periods, and workflows"
Write-Host ""

$confirmation = Read-Host "Do you want to continue? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "Seeding cancelled."
    exit 0
}

Write-Host ""
Write-Host "Starting production seeders..." -ForegroundColor Cyan
Write-Host ""

# Run the production safe seeder
php artisan db:seed --class=ProductionSafeSeeder --force

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "Production seeding completed!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Seeded data:"
Write-Host "  ✓ Performance templates"
Write-Host "  ✓ Employee records"
Write-Host "  ✓ Payroll configuration"
Write-Host ""
