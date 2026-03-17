#!/bin/bash
# Sync Check Script - Verify production and development are in sync

set -e

echo "🔍 Checking Production-Development Sync Status..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if git is clean
echo "1️⃣  Checking Git Status..."
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes${NC}"
    git status -s
else
    echo -e "${GREEN}✅ Git working directory is clean${NC}"
fi
echo ""

# Check current branch
echo "2️⃣  Checking Current Branch..."
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"
if [[ "$CURRENT_BRANCH" == "main" ]]; then
    echo -e "${GREEN}✅ On production branch${NC}"
elif [[ "$CURRENT_BRANCH" == "develop" ]]; then
    echo -e "${YELLOW}⚠️  On development branch${NC}"
else
    echo -e "${YELLOW}⚠️  On feature branch${NC}"
fi
echo ""

# Check if local is behind remote
echo "3️⃣  Checking Remote Sync..."
git fetch origin
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})
BASE=$(git merge-base @ @{u})

if [ $LOCAL = $REMOTE ]; then
    echo -e "${GREEN}✅ Up-to-date with remote${NC}"
elif [ $LOCAL = $BASE ]; then
    echo -e "${RED}❌ Need to pull from remote${NC}"
    echo "Run: git pull origin $CURRENT_BRANCH"
elif [ $REMOTE = $BASE ]; then
    echo -e "${YELLOW}⚠️  Local commits not pushed${NC}"
    echo "Run: git push origin $CURRENT_BRANCH"
else
    echo -e "${RED}❌ Branches have diverged${NC}"
    echo "Run: git pull --rebase origin $CURRENT_BRANCH"
fi
echo ""

# Check for .env files in git
echo "4️⃣  Checking for Sensitive Files..."
if git ls-files | grep -q "\.env$\|\.env\."; then
    echo -e "${RED}❌ ERROR: .env files found in git!${NC}"
    git ls-files | grep "\.env"
else
    echo -e "${GREEN}✅ No .env files in git${NC}"
fi
echo ""

# Check if .env.example exists
echo "5️⃣  Checking Environment Templates..."
if [[ -f ".env.example" ]] && [[ -f "backend/.env.example" ]]; then
    echo -e "${GREEN}✅ Environment templates exist${NC}"
else
    echo -e "${YELLOW}⚠️  Missing .env.example files${NC}"
fi
echo ""

# Check for pending migrations
echo "6️⃣  Checking Database Migrations..."
cd backend
if php artisan migrate:status > /dev/null 2>&1; then
    PENDING=$(php artisan migrate:status | grep -c "Pending" || true)
    if [ "$PENDING" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $PENDING pending migrations${NC}"
        echo "Run: cd backend && php artisan migrate"
    else
        echo -e "${GREEN}✅ All migrations up to date${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Cannot check migrations (database not configured)${NC}"
fi
cd ..
echo ""

# Check dependencies
echo "7️⃣  Checking Dependencies..."
if [[ -f "package-lock.json" ]]; then
    if [[ -d "node_modules" ]]; then
        echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
    else
        echo -e "${YELLOW}⚠️  Run: npm install${NC}"
    fi
else
    echo -e "${RED}❌ package-lock.json missing${NC}"
fi

if [[ -f "backend/composer.lock" ]]; then
    if [[ -d "backend/vendor" ]]; then
        echo -e "${GREEN}✅ Backend dependencies installed${NC}"
    else
        echo -e "${YELLOW}⚠️  Run: cd backend && composer install${NC}"
    fi
else
    echo -e "${RED}❌ composer.lock missing${NC}"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Sync Check Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
