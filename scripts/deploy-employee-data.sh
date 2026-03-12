#!/bin/bash

# Deploy Employee Data to Production
# This script uploads the export file and runs the import on production

set -e

EXPORT_FILE="employee_attendance_export_2026-03-12_164445.json"
PRODUCTION_HOST="u237094395@156.67.218.107"
PRODUCTION_PATH="/home/u237094395/domains/royalgatewayadmin.com/public_html/backend"

echo "==================================================="
echo "Deploy Employee Data to Production"
echo "==================================================="
echo ""

# Check if export file exists
if [ ! -f "backend/storage/app/$EXPORT_FILE" ]; then
    echo "❌ Error: Export file not found!"
    echo "Expected: backend/storage/app/$EXPORT_FILE"
    exit 1
fi

echo "✓ Export file found"
echo ""

# Confirm before proceeding
read -p "This will upload and import employee data to PRODUCTION. Continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo "Step 1: Uploading export file to production..."
scp "backend/storage/app/$EXPORT_FILE" "$PRODUCTION_HOST:$PRODUCTION_PATH/storage/app/"

if [ $? -eq 0 ]; then
    echo "✓ File uploaded successfully"
else
    echo "❌ Upload failed"
    exit 1
fi

echo ""
echo "Step 2: Running import on production server..."
ssh "$PRODUCTION_HOST" "cd $PRODUCTION_PATH && php import-employees-from-dev.php $EXPORT_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "==================================================="
    echo "✓ Deployment completed successfully!"
    echo "==================================================="
    echo ""
    echo "Oluwatosin Fanimo and all employee data has been imported to production."
else
    echo "❌ Import failed"
    exit 1
fi
