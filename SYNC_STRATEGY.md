# Production-Development Sync Strategy

## Overview
This document outlines the strategy to keep production and development environments in sync without conflicts.

## 1. Git Workflow (Single Source of Truth)

### Branch Strategy
```
main (production-ready)
  ↑
develop (active development)
  ↑
feature/* (individual features)
hotfix/* (urgent production fixes)
```

### Rules
- **main branch** = production-ready code only
- **develop branch** = integration branch for features
- **feature branches** = isolated development
- **hotfix branches** = urgent production fixes that merge to both main and develop

### Workflow
```bash
# Feature development
git checkout develop
git pull origin develop
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "feat: add new feature"
git push origin feature/new-feature
# Create PR to develop → review → merge

# Release to production
git checkout main
git merge develop
git push origin main
# GitHub Actions auto-deploys

# Hotfix
git checkout main
git checkout -b hotfix/critical-fix
# ... fix issue ...
git commit -m "fix: critical production issue"
git push origin hotfix/critical-fix
# Create PR to main → merge
git checkout develop
git merge hotfix/critical-fix
git push origin develop
```

## 2. Environment Configuration

### Environment Files (Never Committed)
```
.env.local          → Local development
.env.development    → Development server
.env.production     → Production server (on server only)
```

### Configuration Management
- Store sensitive configs in GitHub Secrets
- Use environment-specific values
- Never commit .env files
- Document required env variables in .env.example

## 3. Database Sync Strategy

### Schema Sync (Migrations)
```bash
# Development: Create migration
php artisan make:migration add_new_column_to_users

# Commit migration file to git
git add database/migrations/*
git commit -m "migration: add new column to users"

# Production: Auto-run via CI/CD
# (Already in deploy.yml: php artisan migrate --force)
```

### Data Sync (Seeders)
```php
// Use production-safe seeders only
// backend/database/seeders/ProductionSafeSeeder.php

// Mark test seeders in .gitignore
// TestUserSeeder.php
// ComprehensiveMemoSeeder.php
```

### Database Backup Strategy
```bash
# Before each deployment (automated in CI/CD)
mysqldump -u user -p database > backup_$(date +%F_%H-%M-%S).sql

# Keep last 7 days of backups
find backups/ -name "*.sql" -mtime +7 -delete
```

## 4. Dependency Management

### Frontend (npm)
```json
// package.json - committed to git
{
  "dependencies": {
    "react": "^18.2.0"
  }
}

// package-lock.json - committed to git (ensures exact versions)
```

```bash
# Development
npm install

# Production (via CI/CD)
npm ci  # Uses package-lock.json for exact versions
```

### Backend (Composer)
```json
// composer.json - committed to git
{
  "require": {
    "laravel/framework": "^11.0"
  }
}

// composer.lock - committed to git (ensures exact versions)
```

```bash
# Development
composer install

# Production (via CI/CD)
composer install --no-dev --optimize-autoloader
```

## 5. Conflict Prevention

### File Exclusions
Files that should NEVER be in git:
- `.env*` files (secrets)
- `node_modules/` (installed via npm)
- `vendor/` (installed via composer)
- `dist/` or `build/` (generated)
- Log files, cache files
- SSH keys, credentials

### Code Review Process
1. All changes go through Pull Requests
2. Require at least 1 approval
3. Run automated tests before merge
4. Use branch protection on main

### Automated Checks
```yaml
# Add to .github/workflows/test.yml
name: Tests
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Dependencies
        run: npm ci && cd backend && composer install
      - name: Run Tests
        run: npm test && cd backend && php artisan test
      - name: Check Migrations
        run: cd backend && php artisan migrate:status
```

## 6. Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database migrations tested locally
- [ ] Environment variables documented
- [ ] Breaking changes documented

### During Deployment
- [ ] Automatic backup created
- [ ] Dependencies installed
- [ ] Migrations run
- [ ] Cache cleared
- [ ] Permissions set

### Post-Deployment
- [ ] Health check passes
- [ ] Critical features tested
- [ ] Monitor error logs
- [ ] Rollback plan ready

## 7. Rollback Strategy

### Quick Rollback
```bash
# Via GitHub
# Revert the commit and push to main
git revert HEAD
git push origin main

# Via SSH (if needed)
ssh user@server
cd /path/to/backup
tar -xzf backend_YYYY-MM-DD_HH-MM-SS.tar.gz -C /path/to/backend
```

### Database Rollback
```bash
# Restore from backup
mysql -u user -p database < backup_YYYY-MM-DD_HH-MM-SS.sql

# Or rollback specific migration
php artisan migrate:rollback --step=1
```

## 8. Monitoring & Alerts

### Health Checks
```php
// backend/routes/health.php
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'database' => DB::connection()->getPdo() ? 'connected' : 'disconnected',
        'cache' => Cache::has('health_check'),
        'timestamp' => now()
    ]);
});
```

### Error Tracking
- Set up Laravel logging to file/service
- Monitor 500 errors
- Track failed jobs
- Alert on critical issues

## 9. Best Practices

### DO
✅ Commit migrations immediately after creating them
✅ Use semantic commit messages (feat:, fix:, chore:)
✅ Test locally before pushing
✅ Keep .env.example updated
✅ Document breaking changes
✅ Use feature flags for gradual rollouts
✅ Run migrations in transactions when possible

### DON'T
❌ Commit .env files
❌ Commit node_modules or vendor
❌ Push directly to main
❌ Skip code reviews
❌ Deploy on Fridays (unless necessary)
❌ Make database changes without migrations
❌ Delete old migrations that have run in production

## 10. Emergency Procedures

### Production is Down
1. Check health endpoint
2. Check server logs
3. Check database connection
4. Rollback last deployment if needed
5. Notify team

### Database Corruption
1. Stop application
2. Restore from latest backup
3. Replay recent transactions if possible
4. Test thoroughly
5. Resume application

### Merge Conflicts
```bash
# Update your branch with latest main
git checkout feature/your-feature
git fetch origin
git rebase origin/main

# Resolve conflicts
# ... edit files ...
git add .
git rebase --continue

# Force push (only on feature branches)
git push origin feature/your-feature --force-with-lease
```

## 11. Automation Improvements

### Add Pre-commit Hooks
```bash
# .husky/pre-commit
#!/bin/sh
npm run lint
npm run type-check
```

### Add Pre-push Hooks
```bash
# .husky/pre-push
#!/bin/sh
npm test
```

### Scheduled Tasks
```yaml
# .github/workflows/backup.yml
name: Daily Backup
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup Database
        # ... backup logic ...
```

## Summary

The key to conflict-free sync:
1. **Git is the single source of truth**
2. **Migrations handle all schema changes**
3. **CI/CD automates deployment**
4. **Backups before every deployment**
5. **Clear rollback procedures**
6. **Monitoring and alerts**
