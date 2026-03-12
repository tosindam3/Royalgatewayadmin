#!/bin/bash

# Production Seeder Script
# This script runs production-safe seeders for performance templates, employees, and payroll

set -e

echo "=================================================="
echo "Production Seeder Script"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the backend directory
if [ ! -f "artisan" ]; then
    echo -e "${RED}Error: artisan file not found. Please run this script from the backend directory.${NC}"
    exit 1
fi

# Check environment
ENV=$(php artisan env)
echo -e "${YELLOW}Current environment: ${ENV}${NC}"
echo ""

# Confirm before proceeding
echo "This will seed the following data:"
echo "  - Performance templates and configurations"
echo "  - Employee data and salary structures"
echo "  - Payroll items, periods, and workflows"
echo ""
read -p "Do you want to continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Seeding cancelled."
    exit 0
fi

echo ""
echo "Starting production seeders..."
echo ""

# Run the production safe seeder
php artisan db:seed --class=ProductionSafeSeeder --force

echo ""
echo -e "${GREEN}=================================================="
echo "Production seeding completed!"
echo -e "==================================================${NC}"
echo ""
echo "Seeded data:"
echo "  ✓ Performance templates"
echo "  ✓ Employee records"
echo "  ✓ Payroll configuration"
echo ""
