# FlipOps Discovery Workflow - Complete Implementation Guide

## Overview
Production-grade property discovery workflow that aggregates multiple data sources, deduplicates via FlipOps API, and feeds normalized data to your scoring system.

## Key Improvements Over ChatGPT's Suggestion

### 1. **Simplified Architecture**
- Removed complex loop-based deduplication in favor of batch processing
- Uses n8n's built-in error handling instead of separate error trigger
- Leverages your existing `/api/events/seen` endpoint properly

### 2. **Better Source Integration**
- Direct integration with your existing Google Sheets (ID: 1TwEzCOn-2FygrJ3jSTixzXgdknMmn-I_AiuHaCPjJKY)
- Proper normalization for all 6 data sources
- Maintains source attribution throughout pipeline

### 3. **Production-Ready Features**
- Implements proper HMAC signing with your secret
- Rate limiting at 3 requests/second to avoid overwhelming APIs
- Batch processing (25 items) for efficiency
- Complete observability with Slack + API notifications

## Workflow JSON Location
The complete workflow JSON is saved at:
```
C:\Users\tanne\flipopsLP\flipops-site\n8n-workflows\discovery-all-sources.json
```

## API Commands

### 1. Create Workflow (When API Key is Valid)
```bash
curl -X POST "https://primary-production-8b46.up.railway.app/api/v1/workflows" \
  -H "X-N8N-API-KEY: YOUR_VALID_API_KEY" \
  -H "Content-Type: application/json" \
  -d @"C:\Users\tanne\flipopsLP\flipops-site\n8n-workflows\discovery-all-sources.json"
```

### 2. Activate Workflow
```bash
curl -X PATCH "https://primary-production-8b46.up.railway.app/api/v1/workflows/{workflowId}" \
  -H "X-N8N-API-KEY: YOUR_VALID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"active": true}'
```

### 3. Run Workflow On-Demand
```bash
curl -X POST "https://primary-production-8b46.up.railway.app/api/v1/workflows/{workflowId}/run" \
  -H "X-N8N-API-KEY: YOUR_VALID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 4. Get Workflow Executions
```bash
curl -X GET "https://primary-production-8b46.up.railway.app/api/v1/executions?workflowId={workflowId}" \
  -H "X-N8N-API-KEY: YOUR_VALID_API_KEY"
```

## Manual Import Instructions (Current Method)

Since the API key appears expired, follow these steps:

1. **Access n8n UI**
   - Go to: https://primary-production-8b46.up.railway.app
   - Log in with your credentials

2. **Import Workflow**
   - Click "Add workflow" or "Import from file"
   - Select the JSON file: `discovery-all-sources.json`
   - The workflow will be imported with all nodes and connections

3. **Configure Credentials (REQUIRED)**

   You must manually bind these credentials in the UI:

   a. **Google Sheets Node** ("Google Sheets - Manual Leads")
      - Click the node
      - Select credential: "Google Sheets OAuth2" (already configured)
      - Verify Sheet ID: 1TwEzCOn-2FygrJ3jSTixzXgdknMmn-I_AiuHaCPjJKY
      - Verify Sheet Name: "ManualLeads" (create if doesn't exist)

   b. **Slack Nodes** ("Slack Summary" and "Slack Error Alert")
      - Click each Slack node
      - Select credential: "Slack OAuth2" (already configured)
      - Verify channel: #flipops-alerts (C09JDCY5SKH)

   c. **Provider API Node** (if using)
      - Click "Fetch Provider API" node
      - Create new HTTP Header Auth credential
      - Header Name: "Authorization"
      - Header Value: "Bearer YOUR_PROVIDER_API_KEY"

4. **Configure Environment Variables**

   Add these in n8n Settings > Variables:

   ```json
   {
     "TAX_CSV_URL": "https://your-source.com/tax-delinquent.csv",
     "CODE_VIOLATIONS_URL": "https://your-source.com/violations.json",
     "EVICTIONS_URL": "https://your-source.com/evictions.html",
     "PROBATE_URL": "https://your-source.com/probate.json",
     "PROVIDER_API_URL": "https://api.provider.com/properties"
   }
   ```

5. **Activate Workflow**
   - Toggle the "Active" switch in the workflow editor
   - Confirm activation

## Property Schema (All Sources Output This)

```typescript
interface FlipOpsProperty {
  type: "property";
  source: string; // Source identifier
  property: {
    address1: string;
    city: string;
    state: string;
    zip: string;
    apn: string | null;
    ownerName: string | null;
  };
  flags: {
    foreclosure: boolean;
    preForeclosure: boolean;
    taxDelinquent: boolean;
    vacant: boolean;
    bankruptcy: boolean;
    absenteeOwner: boolean;
  };
  metadata: {
    scrapeUrl: string | null;
    recordedAt: string | null; // YYYY-MM-DD
    ingestedAt: string; // ISO-8601
    raw: object; // Original data
  };
  _idempotency: string; // Generated key
  _headers?: {
    "X-Fo-Sig": string; // HMAC signature
  };
}
```

## Workflow Architecture

```
Triggers (Cron 2AM + Manual)
    ↓
Parallel Source Fetching:
  - Google Sheets ManualLeads
  - Tax Delinquent CSV
  - Code Violations JSON
  - Evictions HTML
  - Probate Records
  - Provider API
    ↓
Normalize Each Source → FlipOpsProperty
    ↓
Merge All Sources
    ↓
Add Idempotency Keys
    ↓
Check Seen (via API)
    ↓
Filter New Properties
    ↓
Batch (25 items)
    ↓
Add HMAC Signature
    ↓
Rate Limit (3 req/s)
    ↓
Publish to Scoring Webhook
    ↓
Mark as Seen
    ↓
Metrics & Notifications
```

## Test Plan

### Phase 1: Unit Testing Each Source
1. Temporarily disable the "Publish to Scoring" node
2. Run workflow manually
3. Check that each source produces valid FlipOpsProperty objects
4. Verify idempotency keys are generated correctly

### Phase 2: Deduplication Testing
1. Run workflow twice with same test data
2. First run: Should process all properties
3. Second run: Should skip all as "seen"
4. Check Slack summary shows correct deduped count

### Phase 3: Integration Testing
1. Enable publishing to scoring webhook
2. Monitor your scoring workflow receives properties
3. Verify high-score alerts trigger
4. Check notifications API logs events

### Phase 4: Error Handling
1. Simulate source unavailable (wrong URL)
2. Verify error notification to Slack
3. Check workflow continues with other sources

### Phase 5: Performance Testing
1. Load 100+ properties from sheets
2. Verify batching works (25 per batch)
3. Confirm rate limiting (~3 req/s)
4. No 429 errors from APIs

## Monitoring & Observability

### Slack Notifications
- **Channel**: #flipops-alerts (C09JDCY5SKH)
- **Summary Format**: Daily metrics with source breakdown
- **Error Format**: Node name, error message, source, URL

### API Notifications
- **Endpoint**: POST /api/notifications
- **Types**: workflow_complete, error, high_score_property
- **Storage**: Last 100 in memory

### Metrics Tracked
```json
{
  "total": 150,
  "published": 120,
  "deduped": 30,
  "sources": {
    "google-sheets-manual": 25,
    "miami-dade-tax": 40,
    "city-code-violations": 30,
    "evictions-court": 20,
    "probate-docket": 15,
    "provider-api": 20
  },
  "errors": 0,
  "timestamp": "2025-01-16T02:00:00.000Z"
}
```

## Production Deployment Checklist

- [ ] Import workflow JSON to n8n
- [ ] Bind Google Sheets credential
- [ ] Bind Slack credentials (2 nodes)
- [ ] Configure source URLs in n8n variables
- [ ] Create "ManualLeads" sheet if needed
- [ ] Test with single manual trigger
- [ ] Verify scoring webhook receives data
- [ ] Check Slack notifications work
- [ ] Activate workflow for 2AM daily run
- [ ] Monitor first automated run

## Troubleshooting

### Common Issues

1. **401 Unauthorized on API calls**
   - Regenerate n8n API key in settings
   - Update N8N_API_KEY in .env

2. **Google Sheets not reading**
   - Verify OAuth2 credential is connected
   - Check sheet name is exactly "ManualLeads"
   - Ensure sheet has proper column headers

3. **No properties publishing**
   - Check /api/events/seen endpoint is accessible
   - Verify API key in webhook headers
   - Look for errors in n8n execution logs

4. **Rate limit errors**
   - Increase wait time in Rate Limit node
   - Reduce batch size from 25 to 10

## Source Data Requirements

### Google Sheets Columns
```
address | city | state | zip | ownerName | apn | foreclosure | taxDelinquent | vacant
```

### Tax CSV Headers
```
ADDRESS,CITY,STATE,ZIP,OWNER,APN,DELINQUENT_DATE,AMOUNT_OWED
```

### Code Violations JSON
```json
[{
  "property_address": "string",
  "city": "string",
  "postal_code": "string",
  "folio": "string",
  "owner_name": "string",
  "violation_date": "YYYY-MM-DD",
  "is_vacant": boolean
}]
```

## Next Steps

1. **Immediate**: Import workflow and configure credentials
2. **Today**: Test with manual trigger and sample data
3. **Tomorrow**: Add real data source URLs
4. **This Week**: Monitor daily runs and tune performance
5. **Next Week**: Add more data sources as needed

## Support

- **n8n Docs**: https://docs.n8n.io
- **FlipOps API**: https://flipops-api-production.up.railway.app
- **Slack Channel**: #flipops-alerts
- **Your n8n**: https://primary-production-8b46.up.railway.app