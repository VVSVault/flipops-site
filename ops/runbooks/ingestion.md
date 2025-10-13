# FlipOps Ingestion Runbook

## How to Re-run Failed Ingestion

### 1. Identify Failed Workflow

#### Via n8n UI
1. Navigate to https://primary-production-8b46.up.railway.app
2. Go to Executions tab
3. Filter by "Failed" status
4. Find the specific workflow

#### Via CLI
```bash
# List recent failed executions
curl -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "https://primary-production-8b46.up.railway.app/api/v1/executions?status=failed&limit=10"
```

### 2. Analyze Failure Reason

Common failure patterns:

#### Timeout Error
**Symptoms:** Execution stopped after 30-60 seconds
**Cause:** County website slow or large dataset
**Fix:**
```bash
# Increase timeout in workflow
# Edit workflow → HTTP Request node → Options → Timeout: 60000
```

#### Parse Error
**Symptoms:** No data extracted or wrong format
**Cause:** County website structure changed
**Fix:**
```bash
# Check fallback parser is enabled
# Update CSS selectors in HTML Extract node
# Test with single execution first
```

#### API Rate Limit
**Symptoms:** 429 errors or rate_limited
**Cause:** Too many requests too quickly
**Fix:**
```bash
# Add delay between requests
# Reduce batch size from 25 to 10
# Implement exponential backoff
```

### 3. Manual Re-run

#### Method A: Via n8n UI
1. Open failed execution
2. Click "Retry" button
3. Choose "Retry from failed node" or "Retry entire workflow"
4. Monitor execution progress

#### Method B: Via API
```bash
# Get execution ID
EXEC_ID="abc123"

# Retry failed execution
curl -X POST \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "https://primary-production-8b46.up.railway.app/api/v1/executions/$EXEC_ID/retry"
```

#### Method C: Manual Trigger
```bash
# Manually trigger workflow
WORKFLOW_ID="workflow_id_here"

curl -X POST \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "https://primary-production-8b46.up.railway.app/api/v1/workflows/$WORKFLOW_ID/execute"
```

## How to Replay an Event to Guardrails

### 1. Find Original Event

```bash
# Search in notifications table
curl "https://your-domain.com/api/notifications?type=g1.denied&limit=10"

# Or query database directly
psql $DATABASE_URL -c "
  SELECT eventId, type, metadata
  FROM Notification
  WHERE type LIKE 'g%'
  ORDER BY createdAt DESC
  LIMIT 10;
"
```

### 2. Prepare Replay Payload

```bash
# Extract original event data
EVENT_ID="evt_test_001"
DEAL_ID="deal_123"

# Create replay payload
cat > replay.json << EOF
{
  "id": "${EVENT_ID}_replay_$(date +%s)",
  "type": "g1.denied",
  "version": 1,
  "occurredAt": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "tenantId": "tn_prod",
  "dealId": "$DEAL_ID",
  "p80": 245000,
  "maxExposureUsd": 230000,
  "reason": "REPLAY: P80 exceeds maxExposureUsd"
}
EOF
```

### 3. Generate HMAC Signature

```bash
# Calculate HMAC
PAYLOAD=$(cat replay.json)
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$FO_WEBHOOK_SECRET" | cut -d' ' -f2)
TIMESTAMP=$(date +%s)
```

### 4. Send Replay Event

```bash
# Send to webhook
curl -X POST https://your-domain.com/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: $SIGNATURE" \
  -H "x-webhook-timestamp: $TIMESTAMP" \
  -H "x-api-key: $FO_API_KEY" \
  -d "@replay.json"
```

### 5. Verify Replay

```bash
# Check if processed
curl "https://your-domain.com/api/events/seen/${EVENT_ID}_replay_*"

# Check Slack for alert
# Check notification logs
```

## How to Add a New County

### 1. Research County Website

```bash
# Find official foreclosure page
# Examples:
# - Broward: https://www.broward.org/RecordsTaxesTreasury/Records/Pages/Foreclosures.aspx
# - Palm Beach: https://www.pbcgov.org/papa/Foreclosure.htm

# Test accessibility
curl -I "https://county-website.gov/foreclosures"
```

### 2. Create Parser Workflow

1. Duplicate `miami-dade-foreclosure-parser.json`
2. Rename to `[county]-foreclosure-parser.json`
3. Update:
   - Workflow name
   - URL in HTTP Request node
   - CSS selectors in HTML Extract
   - Parse logic in Code node

### 3. Test Parser Locally

```javascript
// Test extraction in n8n Code node
const testHtml = `<paste sample HTML here>`;

// Your parsing logic
const addresses = testHtml.match(/\d+\s+\w+\s+(St|Ave|Rd)/g);
console.log('Found addresses:', addresses);

// Verify output format
return [{
  json: {
    address: addresses[0],
    city: 'County City',
    state: 'FL',
    foreclosure: true
  }
}];
```

### 4. Configure Schedule

```json
{
  "parameters": {
    "rule": {
      "interval": [{
        "field": "cronExpression",
        "expression": "0 2 * * *"  // 2 AM daily
      }]
    }
  }
}
```

### 5. Deploy Workflow

```bash
# Add to workflows directory
cp county-parser.json workflows/

# Deploy to n8n
npm run deploy:workflows

# Verify deployment
curl -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "https://primary-production-8b46.up.railway.app/api/v1/workflows" \
  | jq '.data[] | select(.name | contains("County"))'
```

### 6. Monitor First Run

```bash
# Manually execute once
WORKFLOW_ID="new_workflow_id"
npm run n8n:execute $WORKFLOW_ID

# Check execution
npm run n8n:logs $WORKFLOW_ID

# Verify data flow
# 1. Check properties received at webhook
# 2. Check scores calculated
# 3. Check alerts sent for 80+ scores
```

## Common Ingestion Issues

### Issue: Duplicate Properties

**Solution:**
```sql
-- Check for duplicates
SELECT address, city, COUNT(*)
FROM Property
GROUP BY address, city
HAVING COUNT(*) > 1;

-- Remove duplicates (keep newest)
DELETE FROM Property a
USING Property b
WHERE a.id < b.id
  AND a.address = b.address
  AND a.city = b.city;
```

### Issue: Missing Enrichment

**Solution:**
```bash
# Find unenriched high-scores
curl "https://your-domain.com/api/properties?score_min=85&enriched=false"

# Trigger enrichment manually
./scripts/enrich-properties.ts --score-min=85
```

### Issue: Stuck Workflows

**Solution:**
```bash
# Find stuck executions
curl -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "https://primary-production-8b46.up.railway.app/api/v1/executions?status=running"

# Stop stuck execution
EXEC_ID="stuck_exec_id"
curl -X POST \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "https://primary-production-8b46.up.railway.app/api/v1/executions/$EXEC_ID/stop"
```

## Performance Optimization

### Batch Size Tuning
```javascript
// Start conservative
const BATCH_SIZE = 10;

// Monitor success rate
// If 100% success for 1 week, increase to 25
// If any failures, reduce to 5

// Update in workflow
"batching": {
  "batch": {
    "batchSize": BATCH_SIZE,
    "batchInterval": 2000  // 2 seconds between batches
  }
}
```

### Parallel Processing
```javascript
// For multiple counties
const counties = ['miami-dade', 'broward', 'palm-beach'];

// Run in parallel (carefully)
await Promise.all(
  counties.map(county =>
    processCounty(county).catch(e => console.error(county, e))
  )
);
```

### Caching Strategy
```javascript
// Cache county HTML for 1 hour
const CACHE_KEY = `county_html_${county}_${date}`;
const cached = await redis.get(CACHE_KEY);

if (cached) {
  return JSON.parse(cached);
}

const fresh = await fetchCountyData();
await redis.setex(CACHE_KEY, 3600, JSON.stringify(fresh));
return fresh;
```

## Emergency Procedures

### Full System Reset
```bash
# 1. Stop all workflows
npm run n8n:stop-all

# 2. Clear notification queue
psql $DATABASE_URL -c "UPDATE Notification SET processed = true WHERE processed = false;"

# 3. Reset rate limits
redis-cli DEL "ratelimit:*"

# 4. Restart workflows
npm run n8n:start-all
```

### Data Recovery
```bash
# Backup before recovery
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup_20250107.sql

# Verify data integrity
npm run db:verify
```

### Rollback Deployment
```bash
# Via Railway
railway rollback

# Via Git
git revert HEAD
git push origin main

# Verify rollback
npm run health:local
```

## Monitoring Queries

### Daily Statistics
```sql
-- Properties processed today
SELECT
  DATE(createdAt) as date,
  COUNT(*) as total,
  AVG(score) as avg_score,
  COUNT(CASE WHEN score >= 80 THEN 1 END) as high_scores
FROM Property
WHERE createdAt >= CURRENT_DATE
GROUP BY DATE(createdAt);
```

### Alert Effectiveness
```sql
-- Alert to action ratio
SELECT
  type,
  COUNT(*) as alerts_sent,
  SUM(CASE WHEN metadata->>'clicked' = 'true' THEN 1 ELSE 0 END) as clicked,
  AVG(EXTRACT(EPOCH FROM (updatedAt - createdAt))) as avg_response_time
FROM Notification
WHERE type LIKE 'property.%'
  AND createdAt >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY type;
```