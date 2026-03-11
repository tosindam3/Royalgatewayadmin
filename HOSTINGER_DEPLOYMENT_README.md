# Hostinger Deployment System (React + Laravel)

This repository uses a deterministic, release-based deployment system for Hostinger shared hosting.

## CI/CD Strategy (No-Node)

Due to limitations with Node.js/npm on Hostinger shared hosting, the **React frontend is built in GitHub Actions**. The pre-built `dist` directory is then uploaded to the server during deployment. 

**The server never runs npm or node.**

## Directory Structure on Server

```
/home/u237094395/apps/royalgatewayadmin/
├── releases/             # Immutable release directories
│   ├── 20260311_100001/
│   └── ...
├── shared/               # Persistent resources
│   ├── .env              # Laravel environment file
│   └── storage/          # Laravel storage directory
├── scripts/              # Deployment scripts
│   ├── deploy.sh
│   ├── rollback.sh
│   └── healthcheck.sh
├── backups/              # Database backups
└── current -> releases/X # Symlink to the active release
```

## GitHub Actions Integration

The deployment is triggered automatically on every push to the `main` branch.

### Required GitHub Secrets

To make the deployment work, you MUST set the following secrets in your GitHub repository (`Settings > Secrets and variables > Actions`):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `HOSTINGER_HOST` | Hostinger SSH Host | `147.93.54.101` |
| `HOSTINGER_PORT` | SSH Port | `65002` (check your Hostinger dashboard) |
| `HOSTINGER_USER` | SSH Username | `u237094395` |
| `SSH_PRIVATE_KEY` | SSH Private Key | Content of your private key (paired with the public key on Hostinger) |
| `GITHUB_TOKEN` | GitHub Personal Access Token | Required for cloning the private repository on the server |

## Initial Setup on Hostinger

Before the first deployment:

1. **SSH Access**: Ensure you can SSH into your Hostinger account using the private key.
2. **Directory Structure**: Create the initial `apps/royalgatewayadmin/shared` directory.
3. **Persistent Resources**:
   - Upload your production `.env` to `apps/royalgatewayadmin/shared/.env`.
   - Create `apps/royalgatewayadmin/shared/storage` and ensure it has correct permissions.
4. **Scripts**: The GitHub Action will look for the script at the path defined in `deploy.yml`. Make sure the folder exists.

## Manual Commands

You can run these via SSH if needed:

- **Manual Deploy**: `bash ~/apps/royalgatewayadmin/scripts/deploy.sh`
- **Manual Rollback**: `bash ~/apps/royalgatewayadmin/scripts/rollback.sh`
- **Health Check**: `bash ~/apps/royalgatewayadmin/scripts/healthcheck.sh`

## Safety Rules

- **Zero Downtime**: The `current` symlink is only updated after a successful build and migration.
- **Backups**: A database backup is created automatically in `backups/` before every migration.
- **Rollback**: Rollback is near-instant by switching the `current` symlink back to the previous release folder.
