# Mock Data Setup for FlipOps Discovery Workflow

## Quick Start

### 1. Start the Mock Data Server
```bash
cd flipops-site/mock-data
npm start
```

The server will run on `http://localhost:3333`

### 2. Configure n8n Environment Variables

Go to your n8n instance: https://primary-production-8b46.up.railway.app
Navigate to: Settings → Variables

Add these variables:

```
TAX_CSV_URL = http://localhost:3333/tax-delinquent.csv
CODE_VIOLATIONS_URL = http://localhost:3333/code-violations.json
EVICTIONS_URL = http://localhost:3333/evictions.html
PROBATE_URL = http://localhost:3333/probate.json
PROVIDER_API_URL = http://localhost:3333/provider-api
PROVIDER_API_KEY = mock-api-key-123
```

**⚠️ IMPORTANT:** Replace `localhost:3333` with your actual IP if n8n is not running locally!

### For Railway/Cloud n8n:
If your n8n is hosted on Railway, you'll need to use ngrok or a public URL:

#### Option 1: Use ngrok (Recommended for Testing)
```bash
# Install ngrok if you haven't
# Start the mock server first
cd flipops-site/mock-data
npm start

# In another terminal, expose it with ngrok
ngrok http 3333
```

Then use the ngrok URL in n8n variables:
```
TAX_CSV_URL = https://your-ngrok-url.ngrok.io/tax-delinquent.csv
CODE_VIOLATIONS_URL = https://your-ngrok-url.ngrok.io/code-violations.json
EVICTIONS_URL = https://your-ngrok-url.ngrok.io/evictions.html
PROBATE_URL = https://your-ngrok-url.ngrok.io/probate.json
PROVIDER_API_URL = https://your-ngrok-url.ngrok.io/provider-api
```

## Mock Data Contents

### 1. Tax Delinquent (10 properties)
- CSV format with Miami properties
- All marked as tax delinquent
- Includes: Address, Owner, APN, Amount Owed

### 2. Code Violations (5 properties)
- JSON format
- Mix of vacant and occupied properties
- Violation types: Overgrown vegetation, broken windows, etc.

### 3. Evictions (5 properties)
- HTML table format
- Recent eviction filings
- Status: Pending or Active

### 4. Probate (5 properties)
- JSON format
- Estate properties
- All marked as absentee owner

### 5. Provider API (5 properties)
- JSON with comprehensive flags
- Mix of foreclosure, tax delinquent, vacant
- Requires Bearer token authentication

## Total Mock Properties: 30

### Expected High-Score Properties (80+):
- **1212 Wynwood Ave** - Score: 100 (foreclosure + tax delinquent + vacant + absentee)
- **1414 Edgewater Dr** - Score: 90 (foreclosure + tax delinquent + absentee)
- **1616 Downtown Miami** - Score: 88 (pre-foreclosure + tax delinquent + bankruptcy)

## Testing Your Workflow

1. **Start mock server**
2. **Configure n8n variables**
3. **Run your workflow manually**
4. **Check results:**
   - Should process ~30 total properties
   - 3-5 should trigger high-score alerts
   - All tax CSV properties get +15 for tax delinquent
   - Provider API properties have mixed scoring

## Troubleshooting

### "Connection refused" or timeout errors:
- Make sure mock server is running (`npm start`)
- Check if you need to use ngrok for cloud n8n
- Verify URLs in environment variables

### No data returned:
- Check Google Sheets has "Properties" tab with data
- Verify credentials are set in n8n nodes

### Provider API returns 401:
- Make sure `PROVIDER_API_KEY` is set to `mock-api-key-123`

## Stop the Server
Press `Ctrl+C` in the terminal running the server

## Mock Data Location
All mock data files are in: `flipops-site/mock-data/`
- tax-delinquent.csv
- code-violations.json
- evictions.html
- probate.json
- provider-api.json