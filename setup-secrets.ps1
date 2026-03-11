# GitHub Secrets Setup Script
Write-Host "Setting up GitHub Secrets for RoyalGatewayAdmin" -ForegroundColor Green

# Open GitHub secrets page
$repoUrl = "https://github.com/tosindam3/Royalgatewayadmin/settings/secrets/actions"
Write-Host "Opening GitHub repository secrets page..." -ForegroundColor Yellow
Start-Process $repoUrl

Write-Host ""
Write-Host "Copy these values into GitHub secrets:" -ForegroundColor Cyan
Write-Host ""

Write-Host "Secret Name: HOSTINGER_SSH_HOST" -ForegroundColor White
Write-Host "Value: 147.93.54.101" -ForegroundColor Gray
Write-Host ""

Write-Host "Secret Name: HOSTINGER_SSH_USERNAME" -ForegroundColor White  
Write-Host "Value: u237094395" -ForegroundColor Gray
Write-Host ""

Write-Host "Secret Name: HOSTINGER_SSH_PORT" -ForegroundColor White
Write-Host "Value: 65002" -ForegroundColor Gray
Write-Host ""

Write-Host "Secret Name: GITHUB_TOKEN_DEPLOY" -ForegroundColor White
Write-Host "Value: [YOUR_GITHUB_TOKEN]" -ForegroundColor Gray
Write-Host ""

Write-Host "Secret Name: HOSTINGER_SSH_KEY" -ForegroundColor White
Write-Host "Value: SSH Private Key - see below" -ForegroundColor Gray
Write-Host ""

Write-Host "SSH Private Key Content:" -ForegroundColor Yellow
Write-Host "Copy the ENTIRE content below:" -ForegroundColor Red
Write-Host ""
Get-Content "hostinger_key" | Write-Host -ForegroundColor Gray

Write-Host ""
Write-Host "After adding all secrets, press Enter to test deployment..." -ForegroundColor Green
Read-Host

# Open GitHub Actions page
$actionsUrl = "https://github.com/tosindam3/Royalgatewayadmin/actions"
Write-Host "Opening GitHub Actions page..." -ForegroundColor Yellow
Start-Process $actionsUrl

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1. Click Update Production Site workflow" -ForegroundColor White
Write-Host "2. Click Run workflow" -ForegroundColor White
Write-Host "3. Select code-only for first test" -ForegroundColor White
Write-Host "4. Click Run workflow button" -ForegroundColor White
Write-Host "5. Monitor the deployment progress" -ForegroundColor White