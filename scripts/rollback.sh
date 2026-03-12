#!/usr/bin/env bash
set -euo pipefail

APP_NAME="royalgatewayadmin"
HOSTINGER_USER="u237094395"
BASE_DIR="/home/$HOSTINGER_USER/apps/$APP_NAME"
RELEASES_DIR="$BASE_DIR/releases"
CURRENT_LINK="$BASE_DIR/current"

# Get the second most recent release
PREVIOUS=$(ls -dt $RELEASES_DIR/* | sed -n 2p)

if [ -z "$PREVIOUS" ]; then
    echo "No previous release found for rollback."
    exit 1
fi

echo "Rolling back to $PREVIOUS"

ln -sfn "$PREVIOUS" "$CURRENT_LINK"

# Update public symlinks
ln -sfn "$CURRENT_LINK/dist" "/home/$HOSTINGER_USER/public_html"
ln -sfn "$CURRENT_LINK/backend/public" "/home/$HOSTINGER_USER/public_html/api"

# Clear Laravel cache in the rolled-back release
cd "$CURRENT_LINK/backend"
php artisan optimize:clear

echo "Rollback completed"
