#!/bin/bash

# Fix Talent Management 404 Routes on Production
# This script clears route cache and optimizes routes

set -e

echo "🔧 Fixing Talent Management Routes..."

# SSH connection details
SSH_KEY="RG_SSH/id_rsa"
SSH_HOST="147.93.54.101"
SSH_USER="u237094395"
SSH_PORT="65002"
SITE_DIR="www.royalgatewayadmin.com"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Connecting to production server...${NC}"

# Execute commands on production server
ssh -i $SSH_KEY -p $SSH_PORT $SSH_USER@$SSH_HOST << 'ENDSSH'
    cd www.royalgatewayadmin.com/backend
    
    echo "📋 Current route cache status:"
    ls -lah bootstrap/cache/routes-*.php 2>/dev/null || echo "No route cache found"
    
    echo ""
    echo "🧹 Clearing all caches..."
    php artisan cache:clear
    php artisan config:clear
    php artisan route:clear
    php artisan view:clear
    
    echo ""
    echo "🔄 Optimizing for production..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    
    echo ""
    echo "✅ Verifying talent routes are registered..."
    php artisan route:list | grep -i talent | head -20
    
    echo ""
    echo "📊 Route statistics:"
    php artisan route:list | grep -c "talent" || echo "0 talent routes found"
    
ENDSSH

echo ""
echo -e "${GREEN}✅ Route cache cleared and rebuilt!${NC}"
echo ""
echo "🧪 Testing endpoints..."
echo "Run these commands to verify:"
echo "  curl -H 'Authorization: Bearer YOUR_TOKEN' https://www.royalgatewayadmin.com/api/v1/talent/jobs"
echo "  curl -H 'Authorization: Bearer YOUR_TOKEN' https://www.royalgatewayadmin.com/api/v1/talent/jobs/statistics"
echo "  curl -H 'Authorization: Bearer YOUR_TOKEN' https://www.royalgatewayadmin.com/api/v1/talent/applications/me"
