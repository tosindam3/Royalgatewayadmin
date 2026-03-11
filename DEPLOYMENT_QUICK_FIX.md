# Quick Fix for SSH Timeout Error

## The Problem
```
ssh: connect to host *** port ***: Connection timed out
rsync error: code 255
```

## The Fix (3 Steps)

### 1. Replace Deployment Workflow

```bash
# Delete old workflow
rm .github/workflows/deploy.yml

# Rename new workflow
mv .github/workflows/deploy-fixed.yml .github/workflows/deploy.yml

# Commit
git add .github/workflows/deploy.yml
git commit -m "fix: switch to pull-based deployment to resolve SSH timeout"
git push origin main
```

### 2. Verify Git on Server

```bash
# SSH into server
ssh -p 65002 u237094395@147.93.54.101

# Check git
cd ~/apps/royalgatewayadmin
git status

# If not initialized
git init
git remote add origin https://github.com/tosindam3/Royalgatewayadmin.git
git fetch origin main
git branch -M main
git branch --set-upstream-to=origin/main main
git pull origin main
```

### 3. Test Deployment

1. Go to GitHub → Actions
2. Select "Deploy to Hostinger (Pull-Based)"
3. Click "Run workflow"
4. Watch for "Test SSH Connection" step

## What Changed?

**Before (Push-Based)**:
- GitHub → rsync → Hostinger ❌ (Firewall blocks)

**After (Pull-Based)**:
- GitHub → SSH trigger → Hostinger pulls code ✅ (Works!)

## If It Still Fails

### Check 1: SSH Key
```bash
# In GitHub → Settings → Secrets
# HOSTINGER_SSH_KEY should start with:
-----BEGIN RSA PRIVATE KEY-----
```

### Check 2: Server Access
```bash
# Test from your machine
ssh -p 65002 u237094395@147.93.54.101 "echo 'Works'"
```

### Check 3: Firewall
Contact Hostinger support:
```
Subject: Whitelist GitHub Actions IPs

Please whitelist GitHub Actions IP ranges for SSH access:
- Account: u237094395
- Port: 65002
- IP ranges: https://api.github.com/meta
```

## Success Indicators

✅ "SSH connection successful" in logs
✅ "Deployment complete!" message
✅ Health check passes
✅ Site accessible: https://www.royalgatewayadmin.com

## Emergency Rollback

```bash
ssh -p 65002 u237094395@147.93.54.101
cd ~/apps/royalgatewayadmin
git reset --hard HEAD~1
composer install --no-dev --optimize-autoloader
php artisan optimize
php artisan up
```

---

**Read full details**: `docs/DEPLOYMENT_FIX_SUMMARY.md`
**Diagnosis**: `docs/SSH_CONNECTION_DIAGNOSIS.md`
