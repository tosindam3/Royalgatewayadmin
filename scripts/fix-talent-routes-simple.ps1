# Simple script to fix talent routes on production
# Run this after connecting to SSH manually

Write-Host "🔧 Copy and paste these commands into your SSH session:" -ForegroundColor Cyan
Write-Host ""
Write-Host "cd www.royalgatewayadmin.com/backend" -ForegroundColor Yellow
Write-Host "php artisan cache:clear" -ForegroundColor Yellow
Write-Host "php artisan config:clear" -ForegroundColor Yellow
Write-Host "php artisan route:clear" -ForegroundColor Yellow
Write-Host "php artisan view:clear" -ForegroundColor Yellow
Write-Host "php artisan config:cache" -ForegroundColor Yellow
Write-Host "php artisan route:cache" -ForegroundColor Yellow
Write-Host "php artisan view:cache" -ForegroundColor Yellow
Write-Host "php artisan route:list | grep talent" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ After running these commands, the talent routes will work!" -ForegroundColor Green
