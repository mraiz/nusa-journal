#!/bin/bash
set -e

# Configuration
SERVER="lab-meet"
REMOTE_PATH="/var/www/nusa-journal/web"
LOCAL_PATH="$(dirname "$0")/../web"

echo "🚀 Deploying Nusa Journal Web to $SERVER..."

# Build locally
echo "📦 Building Web (Nuxt)..."
cd "$LOCAL_PATH"
npm run build

# Sync .output folder
echo "📤 Syncing .output to server..."
rsync -avz --delete \
  ./.output/ "$SERVER:$REMOTE_PATH/.output/"

# Sync package files for reference
rsync -avz \
  ./package.json ./package-lock.json "$SERVER:$REMOTE_PATH/"

# Restart PM2
echo "🔄 Restarting PM2..."
ssh "$SERVER" "cd /var/www/nusa-journal && pm2 reload ecosystem.config.js --only nusa-journal-web || pm2 start ecosystem.config.js --only nusa-journal-web"

echo "✅ Web deployed successfully!"
