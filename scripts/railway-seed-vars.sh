#!/bin/bash
# Railway Environment Variable Seeder
# Idempotent: only sets variables if they don't exist

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "FlipOps Railway Environment Seeder"
echo "========================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}Error: Railway CLI not found${NC}"
    echo "Install with: npm install -g @railway/cli"
    exit 1
fi

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo -e "${RED}Error: Not logged in to Railway${NC}"
    echo "Run: railway login"
    exit 1
fi

# Function to check if variable exists
check_var() {
    local var_name=$1
    railway variables get "$var_name" &> /dev/null
}

# Function to set variable if not exists
set_var_if_absent() {
    local var_name=$1
    local var_value=$2

    if check_var "$var_name"; then
        echo -e "${YELLOW}✓ $var_name already set${NC}"
    else
        railway variables set "$var_name=$var_value" &> /dev/null
        echo -e "${GREEN}✓ $var_name set${NC}"
    fi
}

# Generate webhook secret if needed
generate_webhook_secret() {
    openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
}

echo ""
echo "Setting Railway environment variables..."
echo ""

# Core URLs
if ! check_var "RAILWAY_PUBLIC_DOMAIN"; then
    echo -e "${YELLOW}Note: RAILWAY_PUBLIC_DOMAIN will be auto-set by Railway on deployment${NC}"
fi

set_var_if_absent "WEBHOOK_URL" "https://\${{RAILWAY_PUBLIC_DOMAIN}}/api/webhooks/n8n"
set_var_if_absent "FO_API_BASE_URL" "https://\${{RAILWAY_PUBLIC_DOMAIN}}/api"
set_var_if_absent "FO_PANEL_BASE_URL" "https://\${{RAILWAY_PUBLIC_DOMAIN}}"

# n8n Configuration
set_var_if_absent "N8N_BASE_URL" "https://primary-production-8b46.up.railway.app"
set_var_if_absent "N8N_API_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5ODI3NTA1LCJleHAiOjE3NjI0MDUyMDB9.hlcaGCrFW8ItKSdCvo2giGx4WIzSofPRc7xo7cSmyAo"
set_var_if_absent "N8N_PROXY_HOPS" "1"

# Security
if ! check_var "FO_WEBHOOK_SECRET"; then
    secret=$(generate_webhook_secret)
    set_var_if_absent "FO_WEBHOOK_SECRET" "$secret"
    echo -e "${GREEN}✓ Generated new FO_WEBHOOK_SECRET${NC}"
else
    echo -e "${YELLOW}✓ FO_WEBHOOK_SECRET already set${NC}"
fi

set_var_if_absent "FO_API_KEY" "fo_live_10177805c8d743e1a6e1860515dc2b3f"

# Slack Configuration
set_var_if_absent "SLACK_BOT_TOKEN" "xoxb-8447243922864-8413444956214-qJQMjnSRYZ3H6P1KLGB0OaBh"
set_var_if_absent "SLACK_ALERTS_CHANNEL_ID" "C09JDCY5SKH"
set_var_if_absent "SLACK_ERROR_CHANNEL" "#automation-errors"

# Gmail Configuration
set_var_if_absent "SMTP_HOST" "smtp.gmail.com"
set_var_if_absent "SMTP_PORT" "587"
set_var_if_absent "SMTP_USER" "tannercarlson@vvsvault.com"
set_var_if_absent "SMTP_PASS" "ocbp jqem xbkl jrst"
set_var_if_absent "SMTP_FROM" "tannercarlson@vvsvault.com"

# Database Configuration
set_var_if_absent "DATABASE_URL" "postgresql://postgres:password@localhost:5432/flipops"

# Investor DM Map
if [ -f "investor_dm_map.json" ]; then
    dm_map=$(cat investor_dm_map.json | tr -d '\n' | tr -s ' ')
    set_var_if_absent "INVESTOR_DM_MAP" "$dm_map"
    echo -e "${GREEN}✓ INVESTOR_DM_MAP loaded from file${NC}"
else
    # Default minimal map
    default_map='{"default":"C09JDCY5SKH","high_value":"C09JDCY5SKH"}'
    set_var_if_absent "INVESTOR_DM_MAP" "$default_map"
    echo -e "${YELLOW}✓ INVESTOR_DM_MAP set to default (no file found)${NC}"
fi

# Node Environment
set_var_if_absent "NODE_ENV" "production"

echo ""
echo "========================================="
echo "Verification:"
echo "========================================="

# Print current variables
echo ""
echo "Current environment variables:"
railway variables --json | node -e "
const vars = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
const relevant = [
    'WEBHOOK_URL',
    'FO_API_BASE_URL',
    'N8N_BASE_URL',
    'SLACK_ALERTS_CHANNEL_ID',
    'SMTP_HOST',
    'DATABASE_URL',
    'NODE_ENV'
];
relevant.forEach(key => {
    if (vars[key]) {
        const value = vars[key];
        const display = key.includes('SECRET') || key.includes('TOKEN') || key.includes('PASS')
            ? value.substring(0, 10) + '...'
            : value;
        console.log(\`  \${key}: \${display}\`);
    }
});
"

echo ""
echo -e "${GREEN}✅ Railway environment setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Deploy with: railway up"
echo "2. Run database migration: railway run npm run migrate"
echo "3. Deploy workflows: npm run deploy:workflows"
echo ""

exit 0