# Deployment Scripts

This directory contains scripts for deploying and managing the production environment.

## Available Scripts

### 1. deploy-production (.sh / .ps1)
**Purpose:** Deploy code to production server

**Usage:**
```bash
# Linux/Mac
./scripts/deploy-production.sh

# Windows PowerShell
.\scripts\deploy-production.ps1
```

**What it does:**
- Validates local environment
- Pushes code to GitHub
- Connects to production server
- Ensures production is on `main` branch
- Pulls latest code
- Runs migrations
- Clears caches
- Verifies deployment

---

### 2. sync-check.sh
**Purpose:** Check if production is in sync with local

**Usage:**
```bash
./scripts/sync-check.sh
```

**Output:**
- Local branch and commit
- Production branch and commit
- Sync status
- Commits behind (if any)
- Uncommitted changes

---

### 3. rollback.sh
**Purpose:** Rollback to previous deployment

**Usage:**
```bash
./scripts/rollback.sh
```

**What it does:**
- Restores previous code version
- Rolls back database migrations
- Clears caches

---

## First Time Setup

### Linux/Mac
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Test connection
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101 "echo 'Connected'"
```

### Windows
```powershell
# No setup needed - PowerShell scripts work out of the box

# Test connection
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101 "echo 'Connected'"
```

---

## Quick Reference

### Deploy to Production
```bash
# Linux/Mac
./scripts/deploy-production.sh

# Windows
.\scripts\deploy-production.ps1
```

### Check Sync Status
```bash
./scripts/sync-check.sh
```

### Rollback Deployment
```bash
./scripts/rollback.sh
```

### Manual SSH Access
```bash
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101
```

---

## Troubleshooting

### Permission Denied (Linux/Mac)
```bash
chmod +x scripts/deploy-production.sh
chmod +x scripts/sync-check.sh
chmod +x scripts/rollback.sh
```

### SSH Connection Failed
1. Check SSH key exists: `ls -la RG_SSH/id_rsa`
2. Check SSH key permissions: `chmod 600 RG_SSH/id_rsa` (Linux/Mac)
3. Test connection: `ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101 "echo test"`

### Script Not Found
Make sure you're in the project root directory:
```bash
cd /path/to/RoyalgatewayAdmin
./scripts/deploy-production.sh
```

---

## Best Practices

1. **Always check sync status before deploying**
   ```bash
   ./scripts/sync-check.sh
   ```

2. **Test locally before deploying**
   ```bash
   npm run build
   cd backend && php artisan test
   ```

3. **Monitor deployment**
   - Watch GitHub Actions
   - Check production logs
   - Test critical features

4. **Keep production clean**
   - No uncommitted changes on production
   - Always use Git for version control
   - Never edit files directly on production

---

## See Also

- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) - Complete deployment documentation
- [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) - Automated deployment configuration
