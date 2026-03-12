# Sync Employees and Attendance Data to Production
# This script exports data from dev and helps you import it to production

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('export', 'import')]
    [string]$Action = 'export',
    
    [Parameter(Mandatory=$false)]
    [string]$ExportFile = ''
)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Employee & Attendance Data Sync Tool" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Change to backend directory
Set-Location backend

if ($Action -eq 'export') {
    Write-Host "STEP 1: Exporting data from development database..." -ForegroundColor Yellow
    Write-Host ""
    
    php sync-employees-to-production.php
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "==================================================" -ForegroundColor Green
        Write-Host "Export completed successfully!" -ForegroundColor Green
        Write-Host "==================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Locate the export file in backend/storage/app/" -ForegroundColor White
        Write-Host "2. Copy it to your production server" -ForegroundColor White
        Write-Host "3. Run: .\sync-employees-to-production.ps1 -Action import -ExportFile <filename>" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "Export failed!" -ForegroundColor Red
        exit 1
    }
    
} elseif ($Action -eq 'import') {
    if ([string]::IsNullOrEmpty($ExportFile)) {
        Write-Host "Error: Export file name is required for import action" -ForegroundColor Red
        Write-Host "Usage: .\sync-employees-to-production.ps1 -Action import -ExportFile <filename>" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "STEP 2: Importing data to production database..." -ForegroundColor Yellow
    Write-Host ""
    
    php import-employees-from-dev.php $ExportFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "==================================================" -ForegroundColor Green
        Write-Host "Import completed successfully!" -ForegroundColor Green
        Write-Host "==================================================" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "Import failed!" -ForegroundColor Red
        exit 1
    }
}

Set-Location ..
