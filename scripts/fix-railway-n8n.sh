#!/bin/bash
# Fix n8n worker configuration in Railway

echo "🚀 Fixing n8n Configuration in Railway"
echo "======================================"
echo ""

# Link to the project (you may need to login first)
echo "1️⃣ Linking to Railway project..."
railway link

# Set the environment variables to disable worker mode
echo ""
echo "2️⃣ Setting environment variables to disable worker mode..."
railway variables set EXECUTIONS_MODE=regular
railway variables set OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS=false
railway variables set N8N_RUNNERS_ENABLED=false

echo ""
echo "3️⃣ Removing problematic queue-related variables if they exist..."
railway variables delete QUEUE_BULL_REDIS_HOST --yes 2>/dev/null || true
railway variables delete EXECUTIONS_MODE --yes 2>/dev/null || true

echo ""
echo "4️⃣ Setting the correct environment variables for n8n..."
railway variables set EXECUTIONS_MODE=regular
railway variables set N8N_DEFAULT_BINARY_DATA_MODE=default
railway variables set GENERIC_TIMEZONE=America/New_York

echo ""
echo "5️⃣ Adding the Google Sheets configuration..."
railway variables set GOOGLE_SHEET_ID=1TwEzCOn-2FygrJ3jSTixzXgdknMmn-I_AiuHaCPjJKY
railway variables set FO_API_BASE_URL=http://192.168.1.192:3000/api

echo ""
echo "6️⃣ Redeploying n8n service..."
railway up --detach

echo ""
echo "✅ Configuration updated! n8n is redeploying..."
echo ""
echo "Wait 1-2 minutes for the redeploy to complete."
echo "Then test your workflow - it should execute without hanging!"
