# FO_Guardrails__Alerts Deployment Guide

## Overview
This workflow processes guardrail events (G1/G4 policy violations) from FlipOps, validates them with HMAC signatures, ensures idempotency, and sends real-time alerts via Slack and email.

## Prerequisites
- n8n instance running (Railway/self-hosted)
- FlipOps API access
- Slack workspace with bot configured
- Email service (SendGrid/Gmail SMTP)

## Deployment

### 1. Install Dependencies
```bash
pnpm install
# or
npm install
```

### 2. Configure Environment Variables
Copy `env.sample` to `.env` and update with your actual values:
```bash
cp env.sample .env
# Edit .env with your credentials
```

### 3. Deploy Workflow to n8n
```bash
pnpm tsx scripts/upsert-workflow.ts workflows/
# or
npx tsx scripts/upsert-workflow.ts workflows/
```

This will:
- Connect to your n8n instance
- Create or update the FO_Guardrails__Alerts workflow
- Activate it automatically (due to `__activate: true` flag)

### 4. Verify Deployment
Check your n8n instance at: https://primary-production-8b46.up.railway.app
- Navigate to Workflows
- Find "FO_Guardrails__Alerts"
- Verify it shows as "Active"

## Testing

### Prerequisites for Testing
Create a simple HMAC generator script:

```bash
# Create hmac.js
cat > hmac.js << 'EOF'
const crypto = require('crypto');
const secret = process.env.FO_WEBHOOK_SECRET || '7d82e2b8945c43959699bc3a3c1467bdd66954d25d6f41eb';
const payload = process.argv[2];
console.log(crypto.createHmac('sha256', secret).update(payload).digest('hex'));
EOF
```

### Test 1: Happy Path (G1 Deny)

Create test payload:
```bash
cat > body.json << 'EOF'
{
  "id": "evt_test_g1_001",
  "type": "g1.denied",
  "version": 1,
  "occurredAt": "2025-10-07T12:00:00.000Z",
  "tenantId": "tn_test",
  "dealId": "deal_test_001",
  "p80": 245000,
  "maxExposureUsd": 230000,
  "reason": "P80 exceeds maxExposureUsd by $15,000"
}
EOF
```

Send test event:
```bash
NOW=$(date +%s000)
SIG=$(node hmac.js "$NOW.$(cat body.json | tr -d '\n')")

curl -X POST "https://primary-production-8b46.up.railway.app/webhook/fo.guardrails.alerts" \
  -H "Content-Type: application/json" \
  -H "X-Fo-Id: evt_test_g1_001" \
  -H "X-Fo-Type: g1.denied" \
  -H "X-Fo-Version: 1" \
  -H "X-Fo-Ts: $NOW" \
  -H "X-Fo-Sig: v1=$SIG" \
  -d @body.json
```

**Expected Results:**
- HTTP 200 with `{"status":"ok"}`
- Slack message in #guardrail-alerts channel
- Investor DM (if mapped)
- Email sent to configured addresses
- Entry in FlipOps notifications table

### Test 2: Idempotency Check

Run the exact same curl command again with the same `X-Fo-Id`.

**Expected Results:**
- HTTP 200 with `{"status":"ok"}`
- NO duplicate Slack/email/notifications
- Workflow should exit early after idempotency check

### Test 3: Invalid Signature

```bash
curl -X POST "https://primary-production-8b46.up.railway.app/webhook/fo.guardrails.alerts" \
  -H "Content-Type: application/json" \
  -H "X-Fo-Id: evt_test_bad_001" \
  -H "X-Fo-Type: g1.denied" \
  -H "X-Fo-Version: 1" \
  -H "X-Fo-Ts: $(date +%s000)" \
  -H "X-Fo-Sig: v1=invalid_signature" \
  -d '{"id":"evt_test_bad_001","type":"g1.denied"}'
```

**Expected Results:**
- HTTP 401 or workflow error
- Error message in #automation-errors Slack channel
- No alerts sent

### Test 4: Stale Event (>5 minutes old)

```bash
OLD_TIME=$(($(date +%s000) - 360000))  # 6 minutes ago
SIG=$(node hmac.js "$OLD_TIME.$(cat body.json | tr -d '\n')")

curl -X POST "https://primary-production-8b46.up.railway.app/webhook/fo.guardrails.alerts" \
  -H "Content-Type: application/json" \
  -H "X-Fo-Id: evt_test_stale_001" \
  -H "X-Fo-Type: g1.denied" \
  -H "X-Fo-Version: 1" \
  -H "X-Fo-Ts: $OLD_TIME" \
  -H "X-Fo-Sig: v1=$SIG" \
  -d @body.json
```

**Expected Results:**
- Workflow error: "Event too old (>5 min)"
- Error alert in #automation-errors

## Monitoring

### Check Execution History
1. Go to n8n dashboard
2. Navigate to Executions
3. Filter by workflow: FO_Guardrails__Alerts
4. Review success/failure status

### Performance Metrics
- Target: < 5 seconds end-to-end
- Check execution timeline in n8n
- Monitor Slack delivery time

### Error Handling
All errors are posted to `#automation-errors` with:
- Execution ID
- Error message
- Event details
- Direct link to n8n execution

## Rollback Instructions

### To Deactivate Workflow
```bash
curl -X POST "https://primary-production-8b46.up.railway.app/api/v1/workflows/{workflow_id}/deactivate" \
  -H "X-N8N-API-KEY: $N8N_API_KEY"
```

### To Delete Workflow
```bash
curl -X DELETE "https://primary-production-8b46.up.railway.app/api/v1/workflows/{workflow_id}" \
  -H "X-N8N-API-KEY: $N8N_API_KEY"
```

## FlipOps Integration Points

### APIs Used
1. `GET /events/seen/{eventId}` - Check idempotency
2. `GET /deals/{dealId}` - Enrich deal data
3. `POST /notifications` - Persist to investor portal
4. `POST /events/mark-seen` - Mark event as processed

### Dashboard Integration

#### Admin Panel - Automation Log
Add to your Next.js app:
```typescript
// app/admin/automation/page.tsx
const executions = await fetch('/api/automation/executions?type=guardrails&limit=50');
// Display: eventId, deal, type, status, timestamps, n8n link
```

#### Truth Panel Enhancement
Show guardrail status chips:
```typescript
// Get latest guardrail notification for deal
const guardrailStatus = notifications.find(n =>
  n.dealId === dealId && n.type === 'guardrail'
);
```

## Troubleshooting

### Common Issues

**No Slack messages appearing**
- Verify SLACK_BOT_TOKEN is correct
- Check bot has access to channel
- Ensure SLACK_ALERTS_CHANNEL_ID matches

**Email not sending**
- Check EMAIL_FROM and EMAIL_TO_FALLBACK
- Verify SMTP credentials if using Gmail
- Check SendGrid API key if using SendGrid

**Idempotency not working**
- Ensure `/events/seen` endpoint exists in FlipOps
- Check FO_API_KEY has proper permissions
- Verify event IDs are truly unique

**HMAC validation failing**
- Ensure FO_WEBHOOK_SECRET matches on both sides
- Check timestamp is in milliseconds (not seconds)
- Verify raw body is stringified correctly

## Support

- n8n Documentation: https://docs.n8n.io
- FlipOps API: Check internal docs
- Slack Bot Setup: https://api.slack.com/bot-users