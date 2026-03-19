#!/bin/bash

###############################################################################
# Production Sync Check Script
# Verifies that production is in sync with main branch
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROD_HOST="147.93.54.101"
PROD_PORT="65002"
PROD_USER="u237094395"
SSH_KEY="RG_SSH/id_rsa"
PROD_PATH="apps/royalgatewayadmin"
BRANCH="main"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Production Sync Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to run commands on production
run_remote() {
    ssh -i "$SSH_KEY" -p "$PROD_PORT" "$PROD_USER@$PROD_HOST" "$1"
}

# Check local branch
echo -e "${YELLOW}Checking local environment...${NC}"
LOCAL_BRANCH=$(git branch --show-current)
LOCAL_COMMIT=$(git rev-parse HEAD)
LOCAL_COMMIT_SHORT=$(git rev-parse --short HEAD)
LOCAL_COMMIT_MSG=$(git log -1 --pretty=%B)

echo "Branch: $LOCAL_BRANCH"
echo "Commit: $LOCAL_COMMIT_SHORT"
echo "Message: $LOCAL_COMMIT_MSG"
echo ""

# Check production
echo -e "${YELLOW}Checking production environment...${NC}"
PROD_BRANCH=$(run_remote "cd $PROD_PATH && git branch --show-current")
PROD_COMMIT=$(run_remote "cd $PROD_PATH && git rev-parse HEAD")
PROD_COMMIT_SHORT=$(run_remote "cd $PROD_PATH && git rev-parse --short HEAD")
PROD_COMMIT_MSG=$(run_remote "cd $PROD_PATH && git log -1 --pretty=%B")

echo "Branch: $PROD_BRANCH"
echo "Commit: $PROD_COMMIT_SHORT"
echo "Message: $PROD_COMMIT_MSG"
echo ""

# Compare
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Sync Status${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check branch
if [ "$PROD_BRANCH" = "$BRANCH" ]; then
    echo -e "${GREEN}✓ Production is on correct branch ($BRANCH)${NC}"
else
    echo -e "${RED}✗ Production is on wrong branch${NC}"
    echo "  Expected: $BRANCH"
    echo "  Actual: $PROD_BRANCH"
    echo ""
    echo -e "${YELLOW}Fix: Run ./scripts/deploy-production.sh${NC}"
fi

# Check commit
if [ "$LOCAL_COMMIT" = "$PROD_COMMIT" ]; then
    echo -e "${GREEN}✓ Production is in sync with local${NC}"
    echo "  Commit: $LOCAL_COMMIT_SHORT"
else
    echo -e "${RED}✗ Production is out of sync${NC}"
    echo "  Local:      $LOCAL_COMMIT_SHORT"
    echo "  Production: $PROD_COMMIT_SHORT"
    echo ""
    
    # Check if production is behind
    if git merge-base --is-ancestor "$PROD_COMMIT" "$LOCAL_COMMIT" 2>/dev/null; then
        COMMITS_BEHIND=$(git rev-list --count "$PROD_COMMIT..$LOCAL_COMMIT")
        echo -e "${YELLOW}  Production is $COMMITS_BEHIND commit(s) behind${NC}"
        echo ""
        echo "  Recent commits not in production:"
        git log --oneline "$PROD_COMMIT..$LOCAL_COMMIT" | head -5 | sed 's/^/    /'
    else
        echo -e "${YELLOW}  Production has diverged from local${NC}"
    fi
    echo ""
    echo -e "${YELLOW}Fix: Run ./scripts/deploy-production.sh${NC}"
fi

# Check for uncommitted changes on production
echo ""
echo -e "${YELLOW}Checking for uncommitted changes on production...${NC}"
PROD_STATUS=$(run_remote "cd $PROD_PATH && git status --porcelain")

if [ -z "$PROD_STATUS" ]; then
    echo -e "${GREEN}✓ No uncommitted changes on production${NC}"
else
    echo -e "${YELLOW}⚠ Production has uncommitted changes:${NC}"
    echo "$PROD_STATUS" | head -10 | sed 's/^/  /'
    if [ $(echo "$PROD_STATUS" | wc -l) -gt 10 ]; then
        echo "  ... and more"
    fi
    echo ""
    echo -e "${YELLOW}Note: These will be stashed during deployment${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
