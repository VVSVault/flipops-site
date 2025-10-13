# FlipOps Credentials Reference
⚠️ **SECURITY WARNING**: This file contains references to production credentials. Keep secure!

## n8n Webhook Configuration

### Primary Railway Instance
- **URL**: `https://primary-production-8b46.up.railway.app`
- **Webhook Base**: `https://primary-production-8b46.up.railway.app/webhook`
- **API Token**: JWT token configured in `.env.production.local`

### FlipOps API
- **API Key**: `fo_live_10177805c8d743e1a6e1860515dc2b3f`
- **Webhook Secret**: `7d82e2b8945c43959699bc3a3c1467bdd66954d25d6f41eb`

## Notification Channels

### Slack Integration
- **Channel ID**: `C09JDCY5SKH` (#guardrail-alerts)
- **Bot Token**: Configured in `.env.production.local`
- **Channel**: Automated alerts and high-score property notifications

### Gmail Configuration
- **Email**: `tannercarlson@vvsvault.com`
- **App Password**: Configured in `.env.production.local`
- **Usage**: Email notifications for property imports and errors

## Testing the Integration

### Local Testing
```bash
# Start dev server
npm run dev

# Test webhook endpoint
curl -X POST http://localhost:3000/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -H "x-api-key: fo_live_10177805c8d743e1a6e1860515dc2b3f" \
  -d '{
    "type": "property",
    "action": "create",
    "workflowName": "Test Workflow",
    "data": {
      "address": "123 Test St",
      "city": "Miami",
      "state": "FL",
      "zip": "33101",
      "ownerName": "Test Owner",
      "assessedValue": 250000,
      "taxDelinquent": true,
      "dataSource": "Test Source"
    }
  }'
```

### Production Testing
```bash
# Replace localhost with your production domain
curl -X POST https://your-production-domain.com/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -H "x-api-key: fo_live_10177805c8d743e1a6e1860515dc2b3f" \
  -d '{...}'
```

## n8n Workflow Configuration

In your n8n workflow, configure the HTTP Request node:

1. **Method**: POST
2. **URL**:
   - Local: `http://localhost:3000/api/webhooks/n8n`
   - Production: `https://your-domain.com/api/webhooks/n8n`
3. **Headers**:
   - `Content-Type`: `application/json`
   - `x-api-key`: `fo_live_10177805c8d743e1a6e1860515dc2b3f`
4. **Body**: JSON with property data

## Security Checklist

- [ ] Never commit `.env.local` or `.env.production.local` to git
- [ ] Rotate API keys every 90 days
- [ ] Use environment-specific credentials (dev/staging/prod)
- [ ] Enable webhook signature verification in production
- [ ] Monitor failed authentication attempts
- [ ] Set up rate limiting for webhook endpoint

## Environment Files

- `.env.local` - Local development credentials
- `.env.production.local` - Production credentials (DO NOT COMMIT)
- `.env.example` - Template with placeholder values

## Support

For issues with:
- n8n integration: Check Railway logs
- Slack notifications: Verify bot token and channel ID
- Gmail notifications: Check app password and 2FA settings