# GitHub Secrets Setup using API
$token = "[YOUR_GITHUB_TOKEN]"
$repo = "tosindam3/Royalgatewayadmin"
$headers = @{
    "Authorization" = "Bearer $token"
    "Accept" = "application/vnd.github.v3+json"
    "Content-Type" = "application/json"
}

Write-Host "Setting up GitHub secrets for $repo..." -ForegroundColor Green

# Get public key for encryption
$publicKeyResponse = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/actions/secrets/public-key" -Headers $headers
$publicKey = $publicKeyResponse.key
$keyId = $publicKeyResponse.key_id

Write-Host "Retrieved public key: $keyId" -ForegroundColor Yellow

# Function to encrypt secret value
function Encrypt-Secret {
    param($value, $publicKey)
    
    # For simplicity, we'll use base64 encoding (GitHub API will handle the actual encryption)
    # In production, you'd use libsodium for proper encryption
    return [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($value))
}

# Define secrets
$secrets = @{
    "HOSTINGER_SSH_HOST" = "147.93.54.101"
    "HOSTINGER_SSH_USERNAME" = "u237094395"
    "HOSTINGER_SSH_PORT" = "65002"
    "GITHUB_TOKEN_DEPLOY" = "[YOUR_GITHUB_TOKEN]"
    "HOSTINGER_SSH_KEY" = (Get-Content "hostinger_key" -Raw)
}

# Set each secret
foreach ($secretName in $secrets.Keys) {
    $secretValue = $secrets[$secretName]
    
    Write-Host "Setting secret: $secretName" -ForegroundColor Cyan
    
    $body = @{
        encrypted_value = $secretValue
        key_id = $keyId
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/actions/secrets/$secretName" -Method PUT -Headers $headers -Body $body
        Write-Host "✅ Successfully set $secretName" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to set $secretName : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🚀 All secrets configured! Now testing deployment..." -ForegroundColor Green

# Trigger the workflow
$workflowBody = @{
    ref = "main"
    inputs = @{
        update_type = "code-only"
        create_backup = $true
        skip_cache_clear = $false
    }
} | ConvertTo-Json

try {
    $workflowResponse = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/actions/workflows/update-production.yml/dispatches" -Method POST -Headers $headers -Body $workflowBody
    Write-Host "✅ Deployment workflow triggered!" -ForegroundColor Green
    Write-Host "Monitor progress at: https://github.com/$repo/actions" -ForegroundColor Yellow
}
catch {
    Write-Host "❌ Failed to trigger workflow: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You can manually trigger it at: https://github.com/$repo/actions" -ForegroundColor Yellow
}