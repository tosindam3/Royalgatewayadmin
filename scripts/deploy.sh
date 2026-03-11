#!/usr/bin/env bash
set -euo pipefail

############################################
# CONFIG
############################################

APP_NAME="royalgatewayadmin"
HOSTINGER_USER="u237094395"
BASE_DIR="/home/$HOSTINGER_USER/apps/$APP_NAME"
RELEASES_DIR="$BASE_DIR/releases"
SHARED_DIR="$BASE_DIR/shared"
CURRENT_LINK="$BASE_DIR/current"
SCRIPTS_DIR="$BASE_DIR/scripts"
BACKUP_DIR="$BASE_DIR/backups"
LOG_FILE="$SCRIPTS_DIR/deploy.log"

# Use the token passed from GitHub Actions
REPO_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/tosindam3/Royalgatewayadmin.git"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
# If a specific release ID is passed, use it; otherwise create one.
RELEASE_ID=${1:-$TIMESTAMP}
NEW_RELEASE="$RELEASES_DIR/$RELEASE_ID"

LOCK_FILE="$BASE_DIR/.deploy_lock"

############################################
# LOG FUNCTION
############################################

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') | $1" | tee -a "$LOG_FILE"
}

############################################
# DEPLOYMENT LOCK
############################################

if [ -f "$LOCK_FILE" ]; then
    log "Deployment already running"
    exit 1
fi

touch "$LOCK_FILE"

# Clean up lock file on exit
trap 'rm -f "$LOCK_FILE"' EXIT

############################################
# SHARED RESOURCE GUARD
############################################

if [ ! -f "$SHARED_DIR/.env" ]; then
    log "Error: $SHARED_DIR/.env missing. Aborting."
    exit 1
fi

if [ ! -d "$SHARED_DIR/storage" ]; then
    log "Error: $SHARED_DIR/storage missing. Aborting."
    exit 1
fi

############################################
# VERIFY RELEASE DIRECTORY
############################################

if [ ! -d "$NEW_RELEASE" ]; then
    log "Error: Release directory $NEW_RELEASE does not exist. Did CI upload files?"
    exit 1
fi

cd "$NEW_RELEASE"

############################################
# VALIDATE PRE-BUILT ASSETS
############################################

log "Validating pre-built React assets"

# Vite with manifest:true outputs to dist/.vite/manifest.json in newer versions
# or dist/manifest.json in older ones. We'll check both.
if [ ! -f "dist/manifest.json" ] && [ ! -f "dist/.vite/manifest.json" ]; then
    log "Error: React build manifest missing. Build must happen in CI."
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    log "Error: dist/index.html missing. React build invalid."
    exit 1
fi

log "React build validation successful"

############################################
# LINK SHARED RESOURCES
############################################

log "Linking shared resources"

# Laravel backend is in the 'backend' subdirectory
cd backend
ln -sfn "$SHARED_DIR/.env" .env
ln -sfn "$SHARED_DIR/storage" storage
cd ..

############################################
# INSTALL PHP DEPENDENCIES
############################################

log "Installing composer dependencies"

cd backend
composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --prefer-dist
cd ..

############################################
# ENVIRONMENT VALIDATION
############################################

log "Validating Laravel"

cd backend
php artisan about > /dev/null
cd ..

############################################
# BACKUP DATABASE
############################################

log "Backing up database"
mkdir -p "$BACKUP_DIR"

# These variables should be available in the environment or .env
# We'll try to extract them from .env if not set, removing potential quotes and carriage returns
DB_USERNAME=${DB_USERNAME:-$(grep "^DB_USERNAME=" backend/.env | cut -d '=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" | tr -d '\r')}
DB_PASSWORD=${DB_PASSWORD:-$(grep "^DB_PASSWORD=" backend/.env | cut -d '=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" | tr -d '\r')}
DB_DATABASE=${DB_DATABASE:-$(grep "^DB_DATABASE=" backend/.env | cut -d '=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" | tr -d '\r')}

log "Database: $DB_DATABASE, User: $DB_USERNAME"

mysqldump \
    --no-tablespaces \
    -u "$DB_USERNAME" \
    -p"$DB_PASSWORD" \
    "$DB_DATABASE" \
    > "$BACKUP_DIR/db_$RELEASE_ID.sql"

############################################
# RUN MIGRATIONS
############################################

log "Running migrations"

cd backend
php artisan migrate --force

############################################
# RUN PRODUCTION SEEDER
############################################

log "Running production seeders"
php artisan db:seed --class=ProductionSafeSeeder --force
cd ..

############################################
# OPTIMIZE
############################################

log "Optimizing Laravel"
cd backend
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
cd ..

############################################
# ACTIVATE RELEASE
############################################

log "Activating release"

ln -sfn "$NEW_RELEASE" "$CURRENT_LINK"

# Link the website root to the new release
# Frontend is in 'dist', Backend API is typically accessed via 'backend/public'
# We'll follow the pattern of linking public_html to the app's current directory
# But Hostinger usually wants public_html to be a real folder or a symlink.
# We will symlink the main site and the API.

ln -sfn "$CURRENT_LINK/dist" "/home/$HOSTINGER_USER/public_html"
# For the API, if it's served from a subdirectory or subdomain:
ln -sfn "$CURRENT_LINK/backend/public" "/home/$HOSTINGER_USER/public_html/api"

############################################
# CLEAN OLD RELEASES
############################################

log "Cleaning old releases"
cd "$RELEASES_DIR"
ls -dt */ | tail -n +6 | xargs rm -rf || true

############################################
# COMPLETE
############################################

log "Deployment successful: $TIMESTAMP"
