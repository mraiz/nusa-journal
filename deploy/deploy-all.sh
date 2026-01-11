#!/bin/bash
set -e

echo "🚀 Deploying both API and Web..."

SCRIPT_DIR="$(dirname "$0")"

# Deploy API first
"$SCRIPT_DIR/deploy-api.sh"

# Then deploy Web
"$SCRIPT_DIR/deploy-web.sh"

echo "✅ Full deployment complete!"
echo ""
echo "🌐 API: https://journal.app.dev.nusa.work/api"
echo "🌐 Web: https://journal.app.dev.nusa.work/"
