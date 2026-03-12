#!/bin/bash
set -e
BACKEND_DIR="/home/u237094395/apps/royalgatewayadmin"
BACKEND_APP_DIR="$BACKEND_DIR/backend"

echo "🔧 Starting Server Setup..."
if [ ! -d "$BACKEND_DIR/.git" ]; then
    git clone https://github.com/tosindam3/Royalgatewayadmin.git "$BACKEND_DIR"
fi

cd "$BACKEND_APP_DIR"
if [ ! -f .env ]; then
    cp .env.production .env
    echo "⚠️  Created .env from template. Update your DB credentials!"
fi

composer install --no-dev --optimize-autoloader --no-interaction
php artisan key:generate --force
php artisan migrate --force
php artisan optimize:clear
chmod -R 775 storage bootstrap/cache
echo "✅ Server setup complete!"