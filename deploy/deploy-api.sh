#!/bin/bash
set -e

# Configuration
SERVER="lab-meet"
REMOTE_PATH="/var/www/nusa-journal/api"
LOCAL_PATH="$(dirname "$0")/../api"

echo "🚀 Deploying Nusa Journal API to $SERVER..."

# Build locally
echo "📦 Building API..."
cd "$LOCAL_PATH"
npm run build

# Sync files
echo "📤 Syncing files to server..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.env' \
  --exclude '.git' \
  --exclude 'dist' \
  ./ "$SERVER:$REMOTE_PATH/"

# Sync dist folder
rsync -avz --delete \
  ./dist/ "$SERVER:$REMOTE_PATH/dist/"

# Install dependencies and restart
echo "📦 Installing dependencies on server..."
ssh "$SERVER" "cd $REMOTE_PATH && npm install --production"

# Run migrations
echo "🗄️ Running database migrations..."
ssh "$SERVER" "cd $REMOTE_PATH && npx prisma migrate deploy && npx prisma migrate deploy --schema=prisma/registry/schema.prisma"

# Restart PM2
echo "🔄 Restarting PM2..."
ssh "$SERVER" "cd /var/www/nusa-journal && pm2 reload ecosystem.config.js --only nusa-journal-api || pm2 start ecosystem.config.js --only nusa-journal-api"

echo "✅ API deployed successfully!"
