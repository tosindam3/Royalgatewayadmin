#!/usr/bin/env pwsh

# Run All Seeders Script
# Ensures all seeders from local repo are executed on production

$SSH_HOST = "147.93.54.101"
$SSH_USER = "u237094395" 
$SSH_PORT = "65002"
$SSH_KEY = "RG_SSH/id_rsa"
$REMOTE_PATH = "apps/royalgatewayadmin/backend"

Write-Host "🌱 Running All Seeders on Production" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Get list of all seeders from local repo
$localSeeders = Get-ChildItem "backend/database/seeders/*.php" | Where-Object { $_.Name -ne "DatabaseSeeder.php" } | ForEach-Object { $_.BaseName }

Write-Host "Found $($localSeeders.Count) seeders in local repo:" -ForegroundColor Green
$localSeeders | ForEach-Object { Write-Host "  - $_" -ForegroundColor Cyan }

Write-Host "`nRunning seeders on production..." -ForegroundColor Green

foreach ($seeder in $localSeeders) {
    Write-Host "`n🔄 Running $seeder..." -ForegroundColor Yellow
    
    $sshCmd = "ssh -i $SSH_KEY -o StrictHostKeyChecking=no -p $SSH_PORT ${SSH_USER}@${SSH_HOST}"
    $artisanCmd = "cd $REMOTE_PATH && php artisan db:seed --force --class=$seeder"
    
    try {
        $result = Invoke-Expression "$sshCmd `"$artisanCmd`""
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $seeder completed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ $seeder failed with exit code $LASTEXITCODE" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ $seeder failed with error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🎉 All seeders execution completed!" -ForegroundColor Green