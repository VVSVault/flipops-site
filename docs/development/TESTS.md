# FlipOps Test Suite

## API Endpoint Tests

### 1. Health Check
```bash
# Test: API Health
curl -X GET http://localhost:3000/api/health

# Expected Response (200 OK):
{
  "api": "ok",
  "db": "ok",
  "time": "2025-01-07T12:00:00.000Z",
  "responseTime": 45
}

# Test: Health with DB down
# Stop database, then:
curl -X GET http://localhost:3000/api/health

# Expected Response (503):
{
  "api": "ok",
  "db": "error",
  "time": "2025-01-07T12:00:00.000Z"
}
```

### 2. Events - Check if Seen
```bash
# Test: Check unseen event
curl -X GET http://localhost:3000/api/events/seen/evt_new_12345

# Expected Response (200 OK):
{
  "seen": false
}

# Test: Check existing event
# First create an event:
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"eventId":"evt_test_seen","type":"test","message":"Test"}'

# Then check:
curl -X GET http://localhost:3000/api/events/seen/evt_test_seen

# Expected Response (200 OK):
{
  "seen": true
}

# Test: Invalid event ID
curl -X GET http://localhost:3000/api/events/seen/

# Expected Response (404):
{
  "error": "Not Found"
}
```

### 3. Deals Enrichment
```bash
# Test: Get deal data
curl -X GET http://localhost:3000/api/deals/deal_test_001

# Expected Response (200 OK):
{
  "address": "920 Main Street, Miami FL",
  "stage": "discovery",
  "investorId": "inv_001",
  "p50": 1061500,
  "p80": 1249000,
  "p95": 1436350,
  "url": "https://flipops.com/deals/deal_test_001"
}

# Test: Different deal ID (deterministic)
curl -X GET http://localhost:3000/api/deals/deal_abc_123

# Expected Response (200 OK):
# Values will be different but consistent for same ID
```

### 4. Notifications - List
```bash
# Test: Get all notifications
curl -X GET "http://localhost:3000/api/notifications"

# Expected Response (200 OK):
{
  "data": [...],
  "total": 25,
  "limit": 50,
  "offset": 0
}

# Test: Filter by type
curl -X GET "http://localhost:3000/api/notifications?type=property.alert"

# Expected Response (200 OK):
{
  "data": [
    {
      "id": "...",
      "eventId": "evt_123",
      "type": "property.alert",
      "message": "High-score property found",
      "metadata": {...}
    }
  ],
  "total": 5,
  "limit": 50,
  "offset": 0
}

# Test: Pagination
curl -X GET "http://localhost:3000/api/notifications?limit=10&offset=10"

# Expected Response (200 OK):
# Returns items 11-20
```

### 5. Notifications - Create
```bash
# Test: Create new notification
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt_test_'$(date +%s)'",
    "type": "property.alert",
    "message": "Test property alert",
    "metadata": {
      "score": 85,
      "address": "789 Test St"
    }
  }'

# Expected Response (201 Created):
{
  "id": "clxxxxx",
  "eventId": "evt_test_1234567890",
  "type": "property.alert",
  "message": "Test property alert",
  "metadata": {...},
  "createdAt": "2025-01-07T12:00:00.000Z"
}

# Test: Duplicate eventId
# Send same request again
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"eventId":"evt_duplicate","type":"test","message":"Test"}'

# Expected Response (409 Conflict):
{
  "error": "Event already processed",
  "eventId": "evt_duplicate"
}

# Test: Invalid body
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}'

# Expected Response (400 Bad Request):
{
  "error": "Invalid request body",
  "details": [...]
}
```

### 6. Mark Event as Seen
```bash
# Test: Mark event as seen
curl -X POST http://localhost:3000/api/events/mark-seen \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt_mark_test_001"
  }'

# Expected Response (200 OK):
{
  "success": true,
  "eventId": "evt_mark_test_001",
  "processed": true
}

# Test: Mark with timestamp
curl -X POST http://localhost:3000/api/events/mark-seen \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt_mark_test_002",
    "processedAt": "2025-01-07T12:00:00.000Z"
  }'

# Expected Response (200 OK):
{
  "success": true,
  "eventId": "evt_mark_test_002",
  "processed": true
}

# Test: Invalid datetime
curl -X POST http://localhost:3000/api/events/mark-seen \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "test",
    "processedAt": "not-a-date"
  }'

# Expected Response (400 Bad Request):
{
  "error": "Invalid request body",
  "details": [...]
}
```

## Webhook Tests

### 1. Property Scoring
```bash
# Test: Single property with high score
curl -X POST http://localhost:3000/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -H "x-api-key: fo_live_10177805c8d743e1a6e1860515dc2b3f" \
  -d '{
    "address": "123 Test St",
    "city": "Miami",
    "state": "FL",
    "foreclosure": true,
    "taxDelinquent": true,
    "vacant": true
  }'

# Expected Response (200 OK):
{
  "address": "123 Test St",
  "score": 80,
  "potentialProfit": 35000,
  "alert": true
}

# Test: Batch properties
curl -X POST http://localhost:3000/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -H "x-api-key: fo_live_10177805c8d743e1a6e1860515dc2b3f" \
  -d '[
    {"address": "111 First St", "foreclosure": true},
    {"address": "222 Second St", "taxDelinquent": true},
    {"address": "333 Third St", "vacant": true}
  ]'

# Expected Response (200 OK):
[
  {"address": "111 First St", "score": 55, ...},
  {"address": "222 Second St", "score": 45, ...},
  {"address": "333 Third St", "score": 40, ...}
]

# Test: Missing API key
curl -X POST http://localhost:3000/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -d '{"address": "Test"}'

# Expected Response (401 Unauthorized):
{
  "error": "Missing or invalid API key"
}
```

### 2. Guardrail Event with HMAC
```bash
# Generate HMAC signature
PAYLOAD='{"id":"evt_test_g1","type":"g1.denied","dealId":"deal_123"}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$FO_WEBHOOK_SECRET" | cut -d' ' -f2)
TIMESTAMP=$(date +%s)

# Test: Valid HMAC signature
curl -X POST http://localhost:3000/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: $SIGNATURE" \
  -H "x-webhook-timestamp: $TIMESTAMP" \
  -H "x-api-key: fo_live_10177805c8d743e1a6e1860515dc2b3f" \
  -d "$PAYLOAD"

# Expected Response (200 OK):
{
  "success": true,
  "processed": true
}

# Test: Invalid signature
curl -X POST http://localhost:3000/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: invalid_signature" \
  -H "x-webhook-timestamp: $TIMESTAMP" \
  -H "x-api-key: fo_live_10177805c8d743e1a6e1860515dc2b3f" \
  -d "$PAYLOAD"

# Expected Response (401 Unauthorized):
{
  "error": "Invalid signature"
}

# Test: Expired timestamp (>5 min old)
OLD_TIMESTAMP=$(($(date +%s) - 400))
curl -X POST http://localhost:3000/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: $SIGNATURE" \
  -H "x-webhook-timestamp: $OLD_TIMESTAMP" \
  -H "x-api-key: fo_live_10177805c8d743e1a6e1860515dc2b3f" \
  -d "$PAYLOAD"

# Expected Response (401 Unauthorized):
{
  "error": "Request timestamp too old"
}
```

## n8n Workflow Tests

### 1. Google Sheets Sync
```bash
# Preparation: Add test row to Google Sheet
# Address: "TEST 999 Workflow St"
# Foreclosure: yes
# Tax Delinquent: yes

# Wait 5 minutes for scheduled sync, or trigger manually:
WORKFLOW_ID="[sheets_workflow_id]"
curl -X POST \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_BASE_URL/api/v1/workflows/$WORKFLOW_ID/execute"

# Verification:
# 1. Check webhook received property
# 2. Check score calculated (should be 70+)
# 3. Check Slack alert sent (if score 80+)
# 4. Check notification created

# Cleanup: Remove test row from sheet
```

### 2. Miami-Dade Parser
```bash
# Test: Manual execution
WORKFLOW_ID="[parser_workflow_id]"
curl -X POST \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_BASE_URL/api/v1/workflows/$WORKFLOW_ID/execute"

# Monitor execution:
curl -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_BASE_URL/api/v1/executions?workflowId=$WORKFLOW_ID&limit=1" \
  | jq '.data[0] | {id, finished, status}'

# Verification:
# 1. Check HTML fetched successfully
# 2. Check properties extracted (count > 0)
# 3. Check dedupe working (no duplicates)
# 4. Check batch sent to webhook
# 5. Check high scores alerted

# Check logs for errors:
EXEC_ID="[execution_id]"
curl -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_BASE_URL/api/v1/executions/$EXEC_ID" \
  | jq '.data.resultData.error'
```

### 3. Error Handling
```bash
# Test: Force workflow error
# 1. Edit workflow to add intentional error (bad URL)
# 2. Execute workflow
# 3. Verify error caught
# 4. Check Slack #automation-errors for alert

# Verification in Slack:
# Message should contain:
# - Workflow name
# - Error message
# - Execution ID
# - Timestamp
```

## Integration Tests

### 1. End-to-End Property Flow
```bash
# Step 1: Add property to Google Sheet
echo "E2E Test, Miami, FL, 33139, Test, yes, yes, yes, yes, no, no" >> test.csv

# Step 2: Import to sheet (manual or API)

# Step 3: Wait for sync (5 min) or trigger

# Step 4: Verify webhook received
curl "http://localhost:3000/api/notifications?type=property.alert" \
  | jq '.data[] | select(.metadata.address == "E2E Test")'

# Step 5: Check score (should be 90+)
# Step 6: Verify Slack alert sent
# Step 7: Verify email sent (check inbox)

# Cleanup: Remove test property
```

### 2. Guardrail Event Flow
```bash
# Step 1: Send guardrail event
npm run test:guardrails:fire g1.denied deal_e2e_test

# Step 2: Check idempotency (not seen initially)
curl http://localhost:3000/api/events/seen/evt_test_$(date +%s)
# Expected: {"seen": false}

# Step 3: Check deal enrichment called
curl http://localhost:3000/api/deals/deal_e2e_test
# Expected: Mocked deal data

# Step 4: Verify Slack block sent
# Check #guardrail-alerts for formatted message

# Step 5: Mark as seen
curl -X POST http://localhost:3000/api/events/mark-seen \
  -d '{"eventId":"evt_test_'$(date +%s)'"}'

# Step 6: Verify idempotency (now seen)
# Expected: {"seen": true}
```

## Performance Tests

### 1. Batch Processing
```bash
# Generate 100 test properties
cat > batch_test.json << 'EOF'
[
EOF

for i in {1..100}; do
  echo '{"address":"'$i' Performance St","city":"Miami","foreclosure":true},' >> batch_test.json
done

# Remove last comma and close array
sed -i '$ s/,$//' batch_test.json
echo ']' >> batch_test.json

# Time the batch processing
time curl -X POST http://localhost:3000/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -H "x-api-key: fo_live_10177805c8d743e1a6e1860515dc2b3f" \
  -d @batch_test.json

# Expected: < 30 seconds for 100 properties
```

### 2. Concurrent Requests
```bash
# Test concurrent webhook calls
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/webhooks/n8n \
    -H "Content-Type: application/json" \
    -H "x-api-key: fo_live_10177805c8d743e1a6e1860515dc2b3f" \
    -d '{"address":"Concurrent '$i'","foreclosure":true}' &
done
wait

# All requests should complete successfully
```

## Database Tests

### 1. Migration Check
```bash
# Check migration status
npx prisma migrate status

# Expected: Database schema is up to date

# Test rollback and re-apply
npx prisma migrate reset --skip-seed
npx prisma migrate deploy
```

### 2. Data Integrity
```sql
-- Check for orphaned notifications
SELECT COUNT(*) FROM Notification
WHERE dealId IS NOT NULL
  AND dealId NOT IN (SELECT id FROM DealSpec);

-- Expected: 0

-- Check for duplicate eventIds
SELECT eventId, COUNT(*) FROM Notification
GROUP BY eventId
HAVING COUNT(*) > 1;

-- Expected: Empty result
```

## Security Tests

### 1. SQL Injection
```bash
# Test: SQL injection attempt
curl -X GET "http://localhost:3000/api/notifications?type=';DROP TABLE Notification;--"

# Expected: Safe parameter handling, no SQL execution
```

### 2. XSS Prevention
```bash
# Test: XSS in notification message
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "xss_test",
    "type": "test",
    "message": "<script>alert(\"XSS\")</script>"
  }'

# Verify: Message stored safely, no script execution
```

### 3. Rate Limiting
```bash
# Send 100 requests rapidly
for i in {1..100}; do
  curl -X GET http://localhost:3000/api/health &
done
wait

# Expected: Some requests rate limited after threshold
```

## Monitoring Tests

### 1. Health Check Response Time
```bash
# Measure health check latency
for i in {1..10}; do
  curl -w "\nResponse time: %{time_total}s\n" \
    -o /dev/null -s \
    http://localhost:3000/api/health
done

# Expected: All < 200ms
```

### 2. Memory Leak Test
```bash
# Monitor memory usage during extended run
while true; do
  curl -X POST http://localhost:3000/api/webhooks/n8n \
    -H "Content-Type: application/json" \
    -H "x-api-key: fo_live_10177805c8d743e1a6e1860515dc2b3f" \
    -d '{"address":"Memory Test","foreclosure":true}'
  sleep 1
done

# Run for 10 minutes, memory should stabilize
```

## Cleanup

```bash
# Remove test data
psql $DATABASE_URL << SQL
DELETE FROM Notification WHERE eventId LIKE 'evt_test_%';
DELETE FROM Property WHERE address LIKE '%Test%' OR address LIKE '%TEST%';
SQL

# Clear test workflows
# Remove via n8n UI or API

# Reset environment
npm run migrate:reset
npm run migrate
```

---

## Test Coverage Summary

- ✅ API Endpoints: 6/6 tested
- ✅ Webhooks: 2/2 tested
- ✅ n8n Workflows: 3/3 tested
- ✅ Security: Basic coverage
- ✅ Performance: Batch and concurrent
- ✅ Database: Migration and integrity
- ✅ Integration: E2E flows

**Next:** Add automated test runner with Jest/Vitest