# Production Deployment Guide

## Overview

This guide ensures production stays on the `main` branch and syncs properly with development.

---

## Branch Strategy

### Branch Structure
- **`main`** - Production branch (always deployable)
- **`staging`** - Pre-production testing (optional)
- **`feat/*`** - Feature branches

### Rules
1. Production server MUST always be on `main` branch
2. All changes MUST be committed and pushed to `main` before deployment
3. Never commit directly to production server
4. Always use Git for version control

---

## Deployment Methods

### Method 1: Automated Deployment (Recommended)

**Trigger:** Push to `main` branch

```bash
# On your local machine
git add .
git commit -m "feat: your feature description"
git push origin main
```

GitHub Actions will automatically:
1. Validate code (tests, type checking)
2. Build React frontend
3. Ensure production is on `main` branch
4. Deploy frontend and backend
5. Run migrations
6. Clear caches
7. Run health checks

**Monitor:** Check GitHub Actions tab for deployment status

---

### Method 2: Manual Deployment Script

Use this when you need more control or GitHub Actions is unavailable.

```bash
# Make script executable (first time only)
chmod +x scripts/deploy-production.sh

# Run deployment
./scripts/deploy-production.sh
```

**What it does:**
1. ✅ Checks you're on `main` branch locally
2. ✅ Checks for uncommitted changes
3. ✅ Pulls latest changes locally
4. ✅ Pushes to remote repository
5. ✅ Connects to production server
6. ✅ Creates database backup
7. ✅ Stashes production changes
8. ✅ Switches production to `main` branch
9. ✅ Pulls latest code on production
10. ✅ Runs migrations and clears caches
11. ✅ Verifies deployment

---

### Method 3: Manual SSH Deployment

For emergency situations or when scripts fail.

```bash
# Connect to production
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101

# Navigate to app directory
cd apps/royalgatewayadmin

# Stash any local changes
git stash save "Manual stash $(date +%Y%m%d_%H%M%S)"

# Fetch and switch to main
git fetch origin
git checkout main
git pull origin main

# Update backend
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear

# Exit
exit
```

---

## Sync Verification

### Check Sync Status

```bash
# Make script executable (first time only)
chmod +x scripts/sync-check.sh

# Run sync check
./scripts/sync-check.sh
```

**Output shows:**
- Local branch and commit
- Production branch and commit
- Sync status (✓ or ✗)
- Commits behind (if any)
- Uncommitted changes on production

---

## Common Scenarios

### Scenario 1: Production is on wrong branch

**Problem:** Production is on `master` instead of `main`

**Solution:**
```bash
./scripts/deploy-production.sh
```
OR manually:
```bash
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101 \
  "cd apps/royalgatewayadmin && git checkout main && git pull origin main"
```

---

### Scenario 2: Production is behind local

**Problem:** You pushed changes but production hasn't updated

**Solution:**
```bash
# Option 1: Trigger GitHub Actions
git commit --allow-empty -m "trigger: force deployment"
git push origin main

# Option 2: Manual deployment
./scripts/deploy-production.sh

# Option 3: SSH and pull
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101 \
  "cd apps/royalgatewayadmin && git pull origin main && cd backend && php artisan migrate --force && php artisan optimize:clear"
```

---

### Scenario 3: Production has uncommitted changes

**Problem:** Someone made changes directly on production

**Solution:**
```bash
# Stash changes and update
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101 \
  "cd apps/royalgatewayadmin && git stash && git pull origin main"

# Review stashed changes later
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101 \
  "cd apps/royalgatewayadmin && git stash list && git stash show"
```

---

### Scenario 4: Deployment failed

**Problem:** Deployment script or GitHub Actions failed

**Solution:**
1. Check error logs
2. Fix the issue locally
3. Commit and push fix
4. Retry deployment

**Rollback if needed:**
```bash
./scripts/rollback.sh
```

---

## Pre-Deployment Checklist

Before deploying to production:

- [ ] All changes committed locally
- [ ] On `main` branch locally
- [ ] Pulled latest changes: `git pull origin main`
- [ ] Pushed to remote: `git push origin main`
- [ ] Tests passing (if applicable)
- [ ] Build successful: `npm run build`
- [ ] Database migrations tested locally
- [ ] Breaking changes documented
- [ ] Team notified (if major changes)

---

## Post-Deployment Checklist

After deployment:

- [ ] Check GitHub Actions status (if automated)
- [ ] Verify sync: `./scripts/sync-check.sh`
- [ ] Test production URL: https://www.royalgatewayadmin.com
- [ ] Check API health: https://www.royalgatewayadmin.com/api/health
- [ ] Test critical features
- [ ] Monitor error logs
- [ ] Verify database migrations ran
- [ ] Check for console errors

---

## Monitoring Production

### Check Production Status

```bash
# Quick status check
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101 \
  "cd apps/royalgatewayadmin && git status && git log -1 --oneline"

# Check Laravel logs
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101 \
  "tail -50 apps/royalgatewayadmin/backend/storage/logs/laravel.log"

# Check which branch production is on
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101 \
  "cd apps/royalgatewayadmin && git branch --show-current"
```

---

## Troubleshooting

### Issue: "Permission denied" when running scripts

**Solution:**
```bash
chmod +x scripts/deploy-production.sh
chmod +x scripts/sync-check.sh
chmod +x scripts/rollback.sh
```

---

### Issue: "fatal: not a git repository"

**Solution:**
Ensure you're in the project root directory:
```bash
cd /path/to/RoyalgatewayAdmin
./scripts/deploy-production.sh
```

---

### Issue: SSH connection fails

**Solution:**
1. Check SSH key exists: `ls -la RG_SSH/id_rsa`
2. Check SSH key permissions: `chmod 600 RG_SSH/id_rsa`
3. Test connection:
```bash
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101 "echo 'Connection successful'"
```

---

### Issue: Merge conflicts on production

**Solution:**
```bash
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101

cd apps/royalgatewayadmin

# Option 1: Discard local changes and use remote
git fetch origin
git reset --hard origin/main

# Option 2: Stash and pull
git stash
git pull origin main

exit
```

---

## Best Practices

### DO ✅
- Always work on `main` branch for production-ready code
- Commit frequently with clear messages
- Test locally before pushing
- Use deployment scripts
- Monitor deployments
- Keep production clean (no uncommitted changes)
- Document breaking changes

### DON'T ❌
- Never commit directly on production server
- Don't use `master` branch (use `main`)
- Don't skip migrations
- Don't deploy untested code
- Don't ignore deployment errors
- Don't make manual changes on production
- Don't forget to clear caches after deployment

---

## Emergency Procedures

### Emergency Rollback

```bash
./scripts/rollback.sh
```

### Emergency Hotfix

```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-bug main

# 2. Fix the bug
# ... make changes ...

# 3. Commit and push
git add .
git commit -m "hotfix: critical bug description"
git push origin hotfix/critical-bug

# 4. Merge to main
git checkout main
git merge hotfix/critical-bug
git push origin main

# 5. Deploy (automatic via GitHub Actions)
```

### Production Down

```bash
# 1. Check server status
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101 "uptime"

# 2. Check Laravel logs
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101 \
  "tail -100 apps/royalgatewayadmin/backend/storage/logs/laravel.log"

# 3. Restart services (if needed)
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101 \
  "cd apps/royalgatewayadmin/backend && php artisan optimize:clear"

# 4. If all else fails, rollback
./scripts/rollback.sh
```

---

## Maintenance Mode

### Enable Maintenance Mode

```bash
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101 \
  "cd apps/royalgatewayadmin/backend && php artisan down --secret='maintenance-bypass-token'"
```

Access during maintenance: `https://www.royalgatewayadmin.com/maintenance-bypass-token`

### Disable Maintenance Mode

```bash
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101 \
  "cd apps/royalgatewayadmin/backend && php artisan up"
```

---

## Support

For deployment issues:
1. Check this guide first
2. Review GitHub Actions logs
3. Check production logs
4. Run sync check: `./scripts/sync-check.sh`
5. Contact team lead if unresolved

---

## Quick Reference

```bash
# Check sync status
./scripts/sync-check.sh

# Deploy to production
./scripts/deploy-production.sh

# Rollback deployment
./scripts/rollback.sh

# SSH to production
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101

# Check production branch
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101 \
  "cd apps/royalgatewayadmin && git branch --show-current"

# Pull latest on production
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101 \
  "cd apps/royalgatewayadmin && git pull origin main"

# Clear caches
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101 \
  "cd apps/royalgatewayadmin/backend && php artisan optimize:clear"
```

---

**Last Updated:** March 19, 2026  
**Version:** 1.0.0
