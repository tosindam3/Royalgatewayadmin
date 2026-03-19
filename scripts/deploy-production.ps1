# Production Deployment Script (PowerShell)
# Ensures production server is on main branch and properly synced

$ErrorActionPreference = "Stop"

# Configuration
$PROD_HOST = "147.93.54.101"
$PROD_PORT = "65002"
$PROD_USER = "u237094395"
$SSH_KEY = "RG_SSH/id_rsa"
$PROD_PATH = "apps/royalgatewayadmin"
$BRANCH = "main"

Write-Host "========================================" -ForegroundColor Green
Write-Host "Production Deployment Script" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Function to run SSH commands
function Invoke-SSHCommand {
    param([string]$Command)
    ssh -i $SSH_KEY -p $PROD_PORT "$PROD_USER@$PROD_HOST" $Command
}

# Step 1: Check local branch
Write-Host "[1/10] Checking local branch..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
if ($currentBranch -ne $BRANCH) {
    Write-Host "Error: You must be on $BRANCH branch to deploy" -ForegroundColor Red
    Write-Host "Current branch: $currentBranch"
    exit 1
}
Write-Host "✓ On $BRANCH branch" -ForegroundColor Green
Write-Host ""

# Step 2: Check for uncommitted changes
Write-Host "[2/10] Checking for uncommitted changes..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "Error: You have uncommitted changes" -ForegroundColor Red
    Write-Host "Please commit or stash your changes before deploying"
    exit 1
}
Write-Host "✓ No uncommitted changes" -ForegroundColor Green
Write-Host ""

# Step 3: Pull latest changes locally
Write-Host "[3/10] Pulling latest changes locally..." -ForegroundColor Yellow
git pull origin $BRANCH
Write-Host "✓ Local repository updated" -ForegroundColor Green
Write-Host ""

# Step 4: Push to remote
Write-Host "[4/10] Pushing to remote repository..." -ForegroundColor Yellow
git push origin $BRANCH
Write-Host "✓ Changes pushed to remote" -ForegroundColor Green
Write-Host ""

# Step 5: Check production server connection
Write-Host "[5/10] Testing production server connection..." -ForegroundColor Yellow
try {
    Invoke-SSHCommand "echo 'Connection successful'"
    Write-Host "✓ Connected to production server" -ForegroundColor Green
} catch {
    Write-Host "Error: Cannot connect to production server" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 6: Backup production database
Write-Host "[6/10] Creating database backup..." -ForegroundColor Yellow
$backupDate = Get-Date -Format "yyyyMMdd_HHmmss"
Invoke-SSHCommand "cd $PROD_PATH/backend && php artisan db:backup --filename=pre_deploy_${backupDate}.sql 2>/dev/null || echo 'Backup command not available, skipping...'"
Write-Host "✓ Database backup created (if available)" -ForegroundColor Green
Write-Host ""

# Step 7: Stash any local changes on production
Write-Host "[7/10] Stashing production changes..." -ForegroundColor Yellow
Invoke-SSHCommand "cd $PROD_PATH && git stash save 'Auto-stash before deployment ${backupDate}'"
Write-Host "✓ Production changes stashed" -ForegroundColor Green
Write-Host ""

# Step 8: Switch to main branch and pull
Write-Host "[8/10] Updating production code..." -ForegroundColor Yellow
Invoke-SSHCommand "cd $PROD_PATH && git fetch origin && git checkout $BRANCH && git pull origin $BRANCH"
Write-Host "✓ Production code updated" -ForegroundColor Green
Write-Host ""

# Step 9: Run migrations and clear caches
Write-Host "[9/10] Running migrations and clearing caches..." -ForegroundColor Yellow
Invoke-SSHCommand "cd $PROD_PATH/backend && php artisan migrate --force"
Invoke-SSHCommand "cd $PROD_PATH/backend && php artisan config:clear"
Invoke-SSHCommand "cd $PROD_PATH/backend && php artisan route:clear"
Invoke-SSHCommand "cd $PROD_PATH/backend && php artisan cache:clear"
Invoke-SSHCommand "cd $PROD_PATH/backend && php artisan view:clear"
Write-Host "✓ Migrations run and caches cleared" -ForegroundColor Green
Write-Host ""

# Step 10: Verify deployment
Write-Host "[10/10] Verifying deployment..." -ForegroundColor Yellow
$prodCommit = Invoke-SSHCommand "cd $PROD_PATH && git rev-parse HEAD"
$localCommit = git rev-parse HEAD

if ($prodCommit -eq $localCommit) {
    Write-Host "✓ Production is in sync with local" -ForegroundColor Green
    Write-Host "Commit: $prodCommit" -ForegroundColor Green
} else {
    Write-Host "Warning: Production commit differs from local" -ForegroundColor Red
    Write-Host "Local:      $localCommit"
    Write-Host "Production: $prodCommit"
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Production is now on branch: $BRANCH"
Write-Host "Latest commit: $prodCommit"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the application at your production URL"
Write-Host "2. Monitor logs for any errors"
Write-Host "3. If issues occur, run: .\scripts\rollback.ps1"
Write-Host ""
