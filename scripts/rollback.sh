#!/bin/bash
# Production Rollback Script

set -e

echo "🔄 Production Rollback Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Configuration
BACKEND_PATH="/home/u237094395/apps/royalgatewayadmin/backend"
FRONTEND_PATH="/home/u237094395/domains/royalgatewayadmin.com/public_html"
BACKUP_DIR="/home/u237094395/apps/royalgatewayadmin/backups"

# Check if running on production server
if [[ ! -d "$BACKEND_PATH" ]]; then
    echo "❌ Not running on production server"
    exit 1
fi

# List available backups
echo "📦 Available Backups:"
ls -lht $BACKUP_DIR/*.tar.gz | head -10
echo ""

# Prompt for backup selection
read -p "Enter backup filename (or 'latest' for most recent): " BACKUP_FILE

if [[ "$BACKUP_FILE" == "latest" ]]; then
    BACKUP_FILE=$(ls -t $BACKUP_DIR/*.tar.gz | head -1)
    echo "Using latest backup: $BACKUP_FILE"
fi

if [[ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]] && [[ ! -f "$BACKUP_FILE" ]]; then
    echo "❌ Backup file not found"
    exit 1
fi

# Confirmation
echo ""
echo "⚠️  WARNING: This will restore the application to a previous state."
read -p "Are you sure you want to rollback? (yes/no): " CONFIRM

if [[ "$CONFIRM" != "yes" ]]; then
    echo "Rollback cancelled"
    exit 0
fi

echo ""
echo "🔄 Starting rollback..."

# Enable maintenance mode
cd $BACKEND_PATH
php artisan down --message="System rollback in progress" --retry=60

# Backup current state before rollback
echo "📦 Creating safety backup of current state..."
SAFETY_BACKUP="$BACKUP_DIR/pre_rollback_$(date +%F_%H-%M-%S).tar.gz"
tar -czf $SAFETY_BACKUP -C $BACKEND_PATH .

# Restore backend
echo "🔄 Restoring backend..."
cd $BACKEND_PATH
tar -xzf $BACKUP_DIR/$BACKUP_FILE

# Restore dependencies
echo "📦 Restoring dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

# Rollback migrations if needed
read -p "Rollback database migrations? (yes/no): " ROLLBACK_DB
if [[ "$ROLLBACK_DB" == "yes" ]]; then
    read -p "How many steps to rollback? " STEPS
    php artisan migrate:rollback --step=$STEPS --force
fi

# Clear caches
echo "🧹 Clearing caches..."
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Disable maintenance mode
php artisan up

echo ""
echo "✅ Rollback completed!"
echo "Safety backup saved to: $SAFETY_BACKUP"
echo ""
echo "🔍 Please verify the application is working correctly."
echo "If issues persist, contact the development team."
