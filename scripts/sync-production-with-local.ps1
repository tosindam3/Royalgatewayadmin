#!/usr/bin/env pwsh

# Production Sync Verification Script
# Ensures production has all content from local repo

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

$SSH_HOST = "147.93.54.101"
$SSH_USER = "u237094395"
$SSH_PORT = "65002"
$SSH_KEY = "RG_SSH/id_rsa"
$REMOTE_PATH = "apps/royalgatewayadmin/backend"

Write-Host "🔄 Production Sync Verification Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Function to run SSH commands
function Invoke-SSHCommand {
    param([string]$Command)
    
    $sshCmd = "ssh -i $SSH_KEY -o StrictHostKeyChecking=no -p $SSH_PORT ${SSH_USER}@${SSH_HOST}"
    $fullCmd = "$sshCmd `"cd $REMOTE_PATH && $Command`""
    
    if ($DryRun) {
        Write-Host "DRY RUN: $fullCmd" -ForegroundColor Yellow
        return "DRY_RUN_MODE"
    }
    
    return Invoke-Expression $fullCmd
}

# 1. Check Git Status
Write-Host "`n📋 Step 1: Checking Git Status" -ForegroundColor Green
$gitStatus = Invoke-SSHCommand "git status --porcelain"
if ($gitStatus -and $gitStatus -ne "DRY_RUN_MODE") {
    Write-Host "⚠️  Production has uncommitted changes:" -ForegroundColor Yellow
    Write-Host $gitStatus
}

# 2. Pull Latest Changes
Write-Host "`n🔄 Step 2: Pulling Latest Changes" -ForegroundColor Green
if (!$DryRun) {
    Invoke-SSHCommand "git pull origin main"
}

# 3. Check Migration Status
Write-Host "`n🗃️  Step 3: Checking Migration Status" -ForegroundColor Green
$migrationStatus = Invoke-SSHCommand "php artisan migrate:status"
Write-Host $migrationStatus

# 4. Run Missing Migrations
Write-Host "`n⬆️  Step 4: Running Migrations" -ForegroundColor Green
if (!$DryRun) {
    Invoke-SSHCommand "php artisan migrate --force"
}

# 5. Check and Run All Seeders
Write-Host "`n🌱 Step 5: Running All Seeders" -ForegroundColor Green

$seeders = @(
    "UserSeeder",
    "RolePermissionSeeder", 
    "BranchSeeder",
    "EmployeeSeeder",
    "AttendanceSystemSeeder",
    "AttendanceRolesSeeder",
    "AttendanceSettingsSeeder",
    "LeaveSystemSeeder",
    "PayrollItemsSeeder",
    "PayrollPeriodsSeeder",
    "PayrollWorkflowSeeder",
    "PayrollVerificationSeeder",
    "EmployeeSalarySeeder",
    "GenerateEmployeeCodesSeeder",
    "BrandSettingsSeeder",
    "ChatSeeder",
    "MemoSystemSeeder",
    "PerformanceConfigSeeder",
    "PerformanceSubmissionSeeder"
)

foreach ($seeder in $seeders) {
    Write-Host "  Running $seeder..." -ForegroundColor Cyan
    if (!$DryRun) {
        $result = Invoke-SSHCommand "php artisan db:seed --force --class=$seeder"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ $seeder completed" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $seeder failed" -ForegroundColor Red
        }
    }
}

# 6. Verify Data Counts
Write-Host "`n📊 Step 6: Verifying Data Counts" -ForegroundColor Green
$verificationScript = @"
echo 'Data Verification:';
echo 'Users: ' . App\\Models\\User::count();
echo 'Employees: ' . App\\Models\\Employee::count();
echo 'Branches: ' . App\\Models\\Branch::count();
echo 'Departments: ' . App\\Models\\Department::count();
echo 'Roles: ' . Spatie\\Permission\\Models\\Role::count();
echo 'Permissions: ' . Spatie\\Permission\\Models\\Permission::count();
echo 'PayrollItems: ' . App\\Models\\PayrollItem::count();
echo 'ChatChannels: ' . App\\Models\\ChatChannel::count();
"@

if (!$DryRun) {
    $dataCount = Invoke-SSHCommand "php artisan tinker --execute='$verificationScript'"
    Write-Host $dataCount
}

# 7. Clear and Warm Cache
Write-Host "`n🔥 Step 7: Cache Management" -ForegroundColor Green
if (!$DryRun) {
    Invoke-SSHCommand "php artisan cache:clear"
    Invoke-SSHCommand "php artisan config:clear"
    Invoke-SSHCommand "php artisan route:clear"
    Invoke-SSHCommand "php artisan view:clear"
    Invoke-SSHCommand "php artisan config:cache"
    Invoke-SSHCommand "php artisan route:cache"
}

# 8. Check Admin User Setup
Write-Host "`n👤 Step 8: Verifying Admin User" -ForegroundColor Green
$adminCheck = @"
\$user = App\\Models\\User::where('email', 'admin@hr360.com')->first();
if (\$user) {
    echo 'Admin user exists: ' . \$user->name;
    \$employee = App\\Models\\Employee::where('email', 'admin@hr360.com')->first();
    echo \$employee ? ' - Has employee profile' : ' - Missing employee profile';
    echo \$user->hasRole('super_admin') ? ' - Has super_admin role' : ' - Missing super_admin role';
} else {
    echo 'Admin user not found!';
}
"@

if (!$DryRun) {
    $adminStatus = Invoke-SSHCommand "php artisan tinker --execute='$adminCheck'"
    Write-Host $adminStatus
}

Write-Host "`n✅ Production Sync Verification Complete!" -ForegroundColor Green

if ($DryRun) {
    Write-Host "`n💡 This was a dry run. Use -DryRun:`$false to execute changes." -ForegroundColor Yellow
}