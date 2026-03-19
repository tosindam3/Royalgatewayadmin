#!/bin/bash

# Clear Production Route Cache
# This script clears Laravel's route cache in production

set -e

echo "🔧 Clearing Production Cache..."

# SSH connection details
SSH_USER="u912212078"
SSH_HOST="srv1142.hstgr.io"
SSH_KEY="prod_key"
REMOTE_PATH="/home/u912212078/domains/hris.reygroup.com.ph/backend"

# Clear all Laravel caches
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" << 'ENDSSH'
cd /home/u912212078/domains/hris.reygroup.com.ph/backend

echo "📦 Clearing route cache..."
php artisan route:clear

echo "📦 Clearing config cache..."
php artisan config:clear

echo "📦 Clearing view cache..."
php artisan view:clear

echo "📦 Clearing application cache..."
php artisan cache:clear

echo "📦 Optimizing for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "✅ Cache cleared and optimized!"
ENDSSH

echo "✅ Production cache cleared successfully!"
