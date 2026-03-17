#!/bin/bash
# Sync Check Script - Verify production readiness

set -e

echo "🔍 Checking Production Sync Status..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check 1: Git status
echo "📋 Checking Git Status..."
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}✗ Uncommitted changes detected${NC}"
    git status -s
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ Working directory clean${NC}"
fi
echo ""

# Check 2: Branch check
echo "🌿 Checking Branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    echo -e "${YELLOW}⚠ Not on main branch (current: $CURRENT_BRANCH)${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ On main branch${NC}"
fi
echo ""

# Check 3: Environment files
echo "🔐 Checking Environment Files..."
if [[ ! -f ".env.production" ]]; then
    echo -e "${RED}✗ .env.production missing${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ .env.production exists${NC}"
fi

if [[ ! -f "backend/.env.production" ]]; then
    echo -e "${RED}✗ backend/.env.production missing${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ backend/.env.production exists${NC}"
fi
echo ""

# Check 4: Dependencies
echo "📦 Checking Dependencies..."
if [[ -f "package-lock.json" ]]; then
    if ! npm ci --dry-run > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠ npm dependencies may need update${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓ Frontend dependencies OK${NC}"
    fi
fi

if [[ -f "backend/composer.lock" ]]; then
    cd backend
    if ! composer validate --no-check-all --no-check-publish > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠ Composer dependencies may need update${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓ Backend dependencies OK${NC}"
    fi
    cd ..
fi
echo ""

# Check 5: Pending migrations
echo "🗄️  Checking Migrations..."
cd backend
PENDING_MIGRATIONS=$(php artisan migrate:status --pending 2>/dev/null | grep -c "Pending" || echo "0")
if [[ "$PENDING_MIGRATIONS" -gt 0 ]]; then
    echo -e "${YELLOW}⚠ $PENDING_MIGRATIONS pending migration(s)${NC}"
    php artisan migrate:status --pending
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ No pending migrations${NC}"
fi
cd ..
echo ""

# Check 6: Build test
echo "🏗️  Testing Build..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ $ERRORS -eq 0 ]] && [[ $WARNINGS -eq 0 ]]; then
    echo -e "${GREEN}✓ All checks passed! Ready for production.${NC}"
    exit 0
elif [[ $ERRORS -eq 0 ]]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found. Review before deploying.${NC}"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) and $WARNINGS warning(s) found.${NC}"
    echo -e "${RED}Fix errors before deploying to production.${NC}"
    exit 1
fi
