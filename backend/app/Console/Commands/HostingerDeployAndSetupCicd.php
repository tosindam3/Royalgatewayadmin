<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class HostingerDeployAndSetupCicd extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hostinger:deploy-and-setup-cicd';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Setup GitHub Actions CI/CD and Server Scripts for Hostinger Deployment';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Starting RoyalGateway Hostinger CI/CD Setup...');

        // 1. Create .github/workflows directory
        $workflowDir = base_path('../.github/workflows');
        if (!File::exists($workflowDir)) {
            File::makeDirectory($workflowDir, 0755, true);
            $this->comment('✅ Created .github/workflows directory.');
        }

        // 2. Define Workflow Content (Rsync based)
        $workflowContent = <<<'YML'
name: 🚀 Deploy to Production (Hostinger)

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      skip_frontend:
        description: 'Skip frontend build/deploy (backend only)'
        required: false
        default: 'false'
      skip_backend:
        description: 'Skip backend deploy (frontend only)'
        required: false
        default: 'false'

env:
  BACKEND_PATH: /home/u237094395/apps/royalgatewayadmin
  FRONTEND_PATH: /home/u237094395/domains/royalgatewayadmin.com/public_html
  BACKEND_APP_PATH: /home/u237094395/apps/royalgatewayadmin/backend

jobs:
  deploy:
    name: Build & Deploy
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: ⚙️ Setup Node.js
        if: ${{ github.event.inputs.skip_frontend != 'true' }}
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: 📦 Install npm dependencies
        if: ${{ github.event.inputs.skip_frontend != 'true' }}
        run: npm ci

      - name: 🏗️ Build React frontend
        if: ${{ github.event.inputs.skip_frontend != 'true' }}
        run: npm run build
        env:
          VITE_API_BASE_URL: https://www.royalgatewayadmin.com
          NODE_ENV: production

      - name: 🔑 Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.HOSTINGER_SSH_KEY }}" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan -p ${{ secrets.HOSTINGER_SSH_PORT }} \
            ${{ secrets.HOSTINGER_SSH_HOST }} >> ~/.ssh/known_hosts 2>/dev/null || true
          echo "StrictHostKeyChecking no" >> ~/.ssh/config

      - name: 🔌 Test SSH connection
        run: |
          timeout 30 ssh \
            -i ~/.ssh/id_rsa \
            -p ${{ secrets.HOSTINGER_SSH_PORT }} \
            -o ConnectTimeout=15 \
            -o StrictHostKeyChecking=no \
            ${{ secrets.HOSTINGER_SSH_USERNAME }}@${{ secrets.HOSTINGER_SSH_HOST }} \
            "echo '✅ SSH OK'"

      - name: 🔧 Enable maintenance mode
        if: ${{ github.event.inputs.skip_backend != 'true' }}
        run: |
          ssh -i ~/.ssh/id_rsa \
            -p ${{ secrets.HOSTINGER_SSH_PORT }} \
            -o StrictHostKeyChecking=no \
            ${{ secrets.HOSTINGER_SSH_USERNAME }}@${{ secrets.HOSTINGER_SSH_HOST }} \
            "cd ${{ env.BACKEND_APP_PATH }} && php artisan down || true"

      - name: 📤 Deploy frontend (rsync)
        if: ${{ github.event.inputs.skip_frontend != 'true' }}
        run: |
          rsync -avz --checksum --delete \
            --exclude='.htaccess' \
            --exclude='index.php' \
            -e "ssh -i ~/.ssh/id_rsa -p ${{ secrets.HOSTINGER_SSH_PORT }}" \
            dist/ \
            ${{ secrets.HOSTINGER_SSH_USERNAME }}@${{ secrets.HOSTINGER_SSH_HOST }}:${{ env.FRONTEND_PATH }}/

      - name: 🔄 Deploy backend (git pull + composer)
        if: ${{ github.event.inputs.skip_backend != 'true' }}
        run: |
          ssh -i ~/.ssh/id_rsa \
            -p ${{ secrets.HOSTINGER_SSH_PORT }} \
            -o StrictHostKeyChecking=no \
            ${{ secrets.HOSTINGER_SSH_USERNAME }}@${{ secrets.HOSTINGER_SSH_HOST }} bash << 'ENDSSH'
          set -e
          cd /home/u237094395/apps/royalgatewayadmin
          git remote set-url origin "https://tosindam3:${{ secrets.DEPLOY_TOKEN_PAT }}@github.com/tosindam3/Royalgatewayadmin.git"
          git fetch origin main
          git reset --hard origin/main
          git remote set-url origin "https://github.com/tosindam3/Royalgatewayadmin.git"
          cd backend
          composer install --no-dev --optimize-autoloader --no-interaction
          php artisan migrate --force
          php artisan optimize:clear
          php artisan config:cache
          php artisan route:cache
          php artisan view:cache
          chmod -R 775 storage bootstrap/cache
          ENDSSH

      - name: ✅ Disable maintenance mode
        if: ${{ always() && github.event.inputs.skip_backend != 'true' }}
        run: |
          ssh -i ~/.ssh/id_rsa \
            -p ${{ secrets.HOSTINGER_SSH_PORT }} \
            -o StrictHostKeyChecking=no \
            ${{ secrets.HOSTINGER_SSH_USERNAME }}@${{ secrets.HOSTINGER_SSH_HOST }} \
            "cd ${{ env.BACKEND_APP_PATH }} && php artisan up"

      - name: 🩺 Health check
        run: |
          sleep 5
          curl -f https://www.royalgatewayadmin.com/api/health || echo "Health check failed, manual verification needed."
YML;

        File::put($workflowDir . '/deploy.yml', $workflowContent);
        $this->info('✅ GitHub Deployment Workflow created.');

        // 3. Create Server Setup Script
        $deployDir = base_path('../deploy');
        if (!File::exists($deployDir)) {
            File::makeDirectory($deployDir, 0755, true);
        }

        $serverScriptContent = <<<'SH'
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
SH;

        File::put($deployDir . '/server-setup.sh', $serverScriptContent);
        $this->info('✅ Server setup script created at deploy/server-setup.sh');

        // 4. Instructions
        $this->newLine();
        $this->warn('🚀 FINAL STEPS REQUIRED:');
        $this->line('1. Go to GitHub Repository Settings > Secrets > Actions');
        $this->line('2. Add these repository secrets:');
        $this->line('   - HOSTINGER_SSH_HOST: 147.93.54.101');
        $this->line('   - HOSTINGER_SSH_USERNAME: u237094395');
        $this->line('   - HOSTINGER_SSH_PORT: 65002');
        $this->line('   - HOSTINGER_SSH_KEY: [Content of your private key]');
        $this->line('   - DEPLOY_TOKEN_PAT: [Your GitHub PAT Token]');
        $this->newLine();
        $this->info('Deployment is ready. Push to "main" branch to trigger.');
    }
}
