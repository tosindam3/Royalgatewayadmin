# ⚠️ SECURITY WARNING

## SSH Keys Were Exposed in Git History

Your SSH private keys in `RG_SSH/` were previously committed to git history in commits:
- `9fcef69` - Auto-stash before deployment trigger
- `c37732e` - Hostinger deployment system

## IMMEDIATE ACTIONS REQUIRED

### 1. Regenerate SSH Keys (CRITICAL)

The exposed keys should be considered compromised:

```powershell
# On your local machine, generate new keys
ssh-keygen -t rsa -b 4096 -f RG_SSH/id_rsa_new -C "royalgateway-deploy"

# Copy the new public key
Get-Content RG_SSH/id_rsa_new.pub | clip
```

### 2. Update Server authorized_keys

```powershell
# SSH into server
ssh -i RG_SSH/id_rsa -p 65002 u237094395@147.93.54.101

# Add new public key
echo "PASTE_NEW_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys

# Remove old key from authorized_keys
nano ~/.ssh/authorized_keys  # Delete the old key line
```

### 3. Update GitHub Secrets

1. Go to: https://github.com/tosindam3/Royalgatewayadmin/settings/secrets/actions
2. Update `HOSTINGER_SSH_KEY` with content of `RG_SSH/id_rsa_new`
3. Test the new key works

### 4. Delete Old Keys

```powershell
# After confirming new keys work
Remove-Item RG_SSH/id_rsa -Force
Remove-Item RG_SSH/id_rsa.pub -Force
Rename-Item RG_SSH/id_rsa_new RG_SSH/id_rsa
Rename-Item RG_SSH/id_rsa_new.pub RG_SSH/id_rsa.pub
```

### 5. Clean Git History (Optional but Recommended)

**WARNING**: This rewrites git history and requires force push.

```powershell
# Use BFG Repo-Cleaner or git-filter-repo
# This is complex and should be done carefully

# Alternative: Make repository private if not already
```

## What We're Doing Now

1. ✅ Updated `.gitignore` to exclude all sensitive files
2. ✅ Created safe commit script that excludes secrets
3. ⚠️ Old keys still in git history (need regeneration)

## Files That Should NEVER Be Committed

- `RG_SSH/` - SSH private keys
- `.env*` - Environment files with credentials
- `*secret*` - Any files with "secret" in name
- `*.ppk`, `*.pem` - Private key files
- `backend/.env*` - Backend environment files

## Current Safe Commit

The commit we're about to make will:
- ✅ Include new deployment workflow
- ✅ Include documentation
- ✅ Include .gitignore updates
- ❌ Exclude all SSH keys
- ❌ Exclude all .env files
- ❌ Exclude all secret files

## Next Steps

1. Run `./safe-commit.ps1` to commit only safe files
2. Regenerate SSH keys as described above
3. Update GitHub secrets with new keys
4. Test deployment with new keys
5. Consider making repository private

---

**Priority**: HIGH
**Impact**: SSH keys exposed in git history
**Action**: Regenerate keys immediately after deployment works
