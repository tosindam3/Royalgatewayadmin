<?php

echo "=== Laravel Backend Server Restart Script ===\n";
echo "This script will help you restart the Laravel development server.\n\n";

echo "1. Stop the current server (if running) by pressing Ctrl+C in the terminal where it's running\n";
echo "2. Navigate to the backend directory: cd backend\n";
echo "3. Clear the configuration cache: php artisan config:clear\n";
echo "4. Clear the route cache: php artisan route:clear\n";
echo "5. Start the server: php artisan serve --host=0.0.0.0 --port=8000\n\n";

echo "Or run this one-liner:\n";
echo "cd backend && php artisan config:clear && php artisan route:clear && php artisan serve --host=0.0.0.0 --port=8000\n\n";

echo "The server should be accessible at: http://localhost:8000\n";
echo "Test CORS with: http://localhost:8000/test-cors.php\n";