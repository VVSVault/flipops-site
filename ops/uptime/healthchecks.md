# FlipOps Health Check URLs

## Production Endpoints to Monitor

### Core API Health
- **URL:** `https://your-domain.com/api/health`
- **Method:** GET
- **Expected Response:** 200 OK
- **Response Body:**
  ```json
  {
    "api": "ok",
    "db": "ok",
    "time": "2025-01-07T12:00:00.000Z"
  }
  ```
- **Check Interval:** 1 minute
- **Alert After:** 2 consecutive failures

### Webhook Endpoint
- **URL:** `https://your-domain.com/api/webhooks/n8n`
- **Method:** GET
- **Expected Response:** 401 or 405 (endpoint exists)
- **Check Interval:** 5 minutes
- **Alert After:** 3 consecutive failures

### n8n Instance
- **URL:** `https://primary-production-8b46.up.railway.app/api/v1/me`
- **Method:** GET
- **Headers:** `X-N8N-API-KEY: [configured]`
- **Expected Response:** 200 OK
- **Check Interval:** 5 minutes
- **Alert After:** 2 consecutive failures

## Synthetic Transactions

### Property Scoring Test
- **Endpoint:** `/api/webhooks/n8n`
- **Frequency:** Every 30 minutes
- **Test Payload:**
  ```json
  {
    "address": "MONITOR_TEST_123 Main St",
    "city": "Miami",
    "state": "FL",
    "foreclosure": true,
    "taxDelinquent": true
  }
  ```
- **Expected:** Score >= 70
- **Cleanup:** Filter out MONITOR_TEST addresses from alerts

## Database Health

### PostgreSQL Connection
- **Check:** `SELECT 1` query via Prisma
- **Frequency:** Every minute
- **Alert:** If connection fails or takes > 5 seconds

### Migration Status
- **Check:** Prisma migration table current
- **Frequency:** Daily at 3 AM ET
- **Alert:** If pending migrations detected

## Workflow Monitoring

### Google Sheets Sync
- **Workflow ID:** Will be assigned on deployment
- **Expected Frequency:** Every 5 minutes
- **Alert If:** No execution in 15 minutes
- **Check:** n8n API `/executions?workflowId=X`

### Miami-Dade Parser
- **Workflow ID:** Will be assigned on deployment
- **Expected Run:** Daily at 2:00 AM ET
- **Alert If:** No successful run by 3:00 AM ET
- **Check:** n8n API `/executions?workflowId=Y`

## External Dependencies

### Slack API
- **Check:** Bot token validity
- **Frequency:** Every hour
- **Method:** `auth.test` API call
- **Alert:** On authentication failure

### Gmail SMTP
- **Check:** SMTP connection test
- **Frequency:** Every 6 hours
- **Method:** Connection verify (no email sent)
- **Alert:** On connection failure

## Performance Metrics

### Response Times
- **API Health:** < 200ms
- **Webhook Processing:** < 5 seconds
- **Property Scoring:** < 1 second per property
- **Batch Processing:** < 30 seconds for 100 properties

### Success Rates
- **Webhook Success:** > 99%
- **n8n Workflow Success:** > 95%
- **Slack Delivery:** > 99.5%
- **Email Delivery:** > 98%

## Alert Channels

### Critical (Immediate)
- Slack: `#automation-errors`
- Email: `tannercarlson@vvsvault.com`
- SMS: Configure in monitoring tool

### Warning (Within 15 min)
- Slack: `#automation-errors`
- Email digest: Every 15 minutes

### Info (Daily digest)
- Email: Daily summary at 9 AM ET
- Slack: Weekly summary Mondays

## Monitoring Tools Setup

### UptimeRobot (Free Tier)
1. Add HTTP monitor for `/api/health`
2. Set check interval: 5 minutes
3. Configure Slack webhook alert
4. Add status page

### Railway Metrics
1. Built-in metrics dashboard
2. CPU, Memory, Network monitoring
3. Automatic restart on crash
4. Deploy webhook notifications

### n8n Monitoring
1. Enable execution logging
2. Set error workflow
3. Configure email on failure
4. Weekly execution report

## Incident Response

### Escalation Path
1. **L1 (0-5 min):** Automated restart attempt
2. **L2 (5-15 min):** Slack alert to dev team
3. **L3 (15-30 min):** Email + SMS to on-call
4. **L4 (30+ min):** Phone call to team lead

### On-Call Rotation
- Primary: Configure in PagerDuty or similar
- Secondary: Backup contact
- Business hours: 9 AM - 6 PM ET
- After hours: Critical only

## Health Check Implementation

```bash
# Quick health check script
#!/bin/bash

echo "Checking FlipOps Health..."

# API Health
curl -s https://your-domain.com/api/health | jq '.'

# n8n Health
curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" \
  https://primary-production-8b46.up.railway.app/api/v1/me | jq '.email'

# Webhook Test
curl -s -X POST https://your-domain.com/api/webhooks/n8n \
  -H "x-api-key: $FO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"address":"TEST","foreclosure":true}' | jq '.score'

echo "Health check complete"
```