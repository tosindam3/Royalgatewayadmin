#!/bin/bash

###############################################################################
# Production Deployment Script
# Ensures production server is on main branch and properly synced
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROD_HOST="147.93.54.101"
PROD_PORT="65002"
PROD_USER="u237094395"
SSH_KEY="RG_SSH/id_rsa"
PROD_PATH="apps/royalgatewayadmin"
BRANCH="main"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Production Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to run commands on production
run_remote() {
    ssh -i "$SSH_KEY" -p "$PROD_PORT" "$PROD_USER@$PROD_HOST" "$1"
}

# Step 1: Check local branch
echo -e "${YELLOW}[1/10] Checking local branch...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo -e "${RED}Error: You must be on $BRANCH branch to deploy${NC}"
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
fi
echo -e "${GREEN}✓ On $BRANCH branch${NC}"
echo ""

# Step 2: Check for uncommitted changes
echo -e "${YELLOW}[2/10] Checking for uncommitted changes...${NC}"
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}Error: You have uncommitted changes${NC}"
    echo "Please commit or stash your changes before deploying"
    exit 1
fi
echo -e "${GREEN}✓ No uncommitted changes${NC}"
echo ""

# Step 3: Pull latest changes locally
echo -e "${YELLOW}[3/10] Pulling latest changes locally...${NC}"
git pull origin "$BRANCH"
echo -e "${GREEN}✓ Local repository updated${NC}"
echo ""

# Step 4: Push to remote
echo -e "${YELLOW}[4/10] Pushing to remote repository...${NC}"
git push origin "$BRANCH"
echo -e "${GREEN}✓ Changes pushed to remote${NC}"
echo ""

# Step 5: Check production server connection
echo -e "${YELLOW}[5/10] Testing production server connection...${NC}"
if ! run_remote "echo 'Connection successful'"; then
    echo -e "${RED}Error: Cannot connect to production server${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Connected to production server${NC}"
echo ""

# Step 6: Backup production database
echo -e "${YELLOW}[6/10] Creating database backup...${NC}"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
run_remote "cd $PROD_PATH/backend && php artisan db:backup --filename=pre_deploy_${BACKUP_DATE}.sql 2>/dev/null || echo 'Backup command not available, skipping...'"
echo -e "${GREEN}✓ Database backup created (if available)${NC}"
echo ""

# Step 7: Stash any local changes on production
echo -e "${YELLOW}[7/10] Stashing production changes...${NC}"
run_remote "cd $PROD_PATH && git stash save 'Auto-stash before deployment ${BACKUP_DATE}'"
echo -e "${GREEN}✓ Production changes stashed${NC}"
echo ""

# Step 8: Switch to main branch and pull
echo -e "${YELLOW}[8/10] Updating production code...${NC}"
run_remote "cd $PROD_PATH && git fetch origin && git checkout $BRANCH && git pull origin $BRANCH"
echo -e "${GREEN}✓ Production code updated${NC}"
echo ""

# Step 9: Run migrations and clear caches
echo -e "${YELLOW}[9/10] Running migrations and clearing caches...${NC}"
run_remote "cd $PROD_PATH/backend && php artisan migrate --force"
run_remote "cd $PROD_PATH/backend && php artisan config:clear"
run_remote "cd $PROD_PATH/backend && php artisan route:clear"
run_remote "cd $PROD_PATH/backend && php artisan cache:clear"
run_remote "cd $PROD_PATH/backend && php artisan view:clear"
echo -e "${GREEN}✓ Migrations run and caches cleared${NC}"
echo ""

# Step 10: Verify deployment
echo -e "${YELLOW}[10/10] Verifying deployment...${NC}"
PROD_COMMIT=$(run_remote "cd $PROD_PATH && git rev-parse HEAD")
LOCAL_COMMIT=$(git rev-parse HEAD)

if [ "$PROD_COMMIT" = "$LOCAL_COMMIT" ]; then
    echo -e "${GREEN}✓ Production is in sync with local${NC}"
    echo -e "${GREEN}Commit: $PROD_COMMIT${NC}"
else
    echo -e "${RED}Warning: Production commit differs from local${NC}"
    echo "Local:      $LOCAL_COMMIT"
    echo "Production: $PROD_COMMIT"
fi
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Production is now on branch: $BRANCH"
echo "Latest commit: $PROD_COMMIT"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test the application at your production URL"
echo "2. Monitor logs for any errors"
echo "3. If issues occur, run: ./scripts/rollback.sh"
echo ""
