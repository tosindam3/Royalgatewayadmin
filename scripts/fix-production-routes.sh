#!/bin/bash

###############################################################################
# Fix Production Routes - Cache routes to resolve 404 errors
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
PROD_HOST="147.93.54.101"
PROD_PORT="65002"
PROD_USER="u237094395"
SSH_KEY="RG_SSH/id_rsa"
PROD_PATH="apps/royalgatewayadmin"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Fixing Production Routes${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to run commands on production
run_remote() {
    ssh -i "$SSH_KEY" -p "$PROD_PORT" "$PROD_USER@$PROD_HOST" "$1"
}

echo -e "${YELLOW}[1/4] Clearing all caches...${NC}"
run_remote "cd $PROD_PATH/backend && php artisan cache:clear"
run_remote "cd $PROD_PATH/backend && php artisan config:clear"
run_remote "cd $PROD_PATH/backend && php artisan route:clear"
run_remote "cd $PROD_PATH/backend && php artisan view:clear"
echo -e "${GREEN}✓ Caches cleared${NC}"
echo ""

echo -e "${YELLOW}[2/4] Caching configuration...${NC}"
run_remote "cd $PROD_PATH/backend && php artisan config:cache"
echo -e "${GREEN}✓ Configuration cached${NC}"
echo ""

echo -e "${YELLOW}[3/4] Caching routes...${NC}"
run_remote "cd $PROD_PATH/backend && php artisan route:cache"
echo -e "${GREEN}✓ Routes cached${NC}"
echo ""

echo -e "${YELLOW}[4/4] Optimizing application...${NC}"
run_remote "cd $PROD_PATH/backend && php artisan optimize"
echo -e "${GREEN}✓ Application optimized${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Routes Fixed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "The talent management routes should now be accessible."
echo "Test at: https://www.royalgatewayadmin.com/api/v1/talent/jobs"
echo ""
