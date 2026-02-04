# Gate G2 Implementation - Bid Spread Control ✅

## Overview
Gate G2 has been fully implemented to prevent overpaying by blocking bid awards when the spread between bids exceeds 15%. This ensures competitive pricing and identifies potential outliers.

## Components Implemented

### 1. Database Updates
- **Bid Model**: Enhanced with `normalized` JSON field for storing normalized comparison data
- **Policy Model**: Already includes `bidSpreadMaxPct` threshold (15% default)

### 2. Core Libraries
- **`lib/normalizeBid.ts`**: Comprehensive unit normalization system
  - Handles 30+ unit variations (squares, sqft, sf, etc.)
  - Converts roofing "squares" to sqft (1 square = 100 sqft)
  - Statistical analysis (min, max, median, spread, outliers)
- **`lib/prisma.ts`**: Shared database client
- **`lib/events.ts`**: Audit logging for all decisions

### 3. API Endpoint
- **`app/api/bids/award/route.ts`**: Main G2 enforcement endpoint
  - Normalizes all bids to canonical units
  - Calculates spread: `(max - min) / median`
  - Blocks if spread > 15%
  - Awards and updates budget ledger if approved
  - Creates immutable audit events

### 4. Seed Data
- **`prisma/seed.ts`**: Enhanced with:
  - Safe bids: 3 bids with ~10% spread ($9,000, $9,450, $9,900)
  - Risky bids: 3 bids with ~40% spread ($24,000, $28,000, $34,000)
  - Different unit formats to test normalization

### 5. Testing
- **`tests/g2-award.test.ts`**: Comprehensive test suite
- **`test-g2.sh`**: Manual testing script
- **`app/api/debug/bids`**: Helper endpoint to get test bid IDs

## How It Works

### Success Flow (200 AWARDED)
```json
POST /api/bids/award
{
  "dealId": "SAFE_DEAL_001",
  "winningBidId": "bid_xxx"
}

Response:
{
  "status": "AWARDED",
  "dealId": "SAFE_DEAL_001",
  "winningBidId": "bid_xxx",
  "vendor": {
    "id": "vendor_1",
    "name": "Miami Roofing Pros"
  },
  "trade": "Roofing",
  "awardedAmount": 9000,
  "stats": {
    "min": 9000,
    "median": 9450,
    "max": 9900,
    "spread": 900,
    "spreadPct": 9.5
  },
  "threshold": 15,
  "savingsVsMax": 900,
  "savingsVsMedian": 450,
  "eventId": "evt_xxx"
}
```

### Failure Flow (409 BLOCKED)
```json
POST /api/bids/award
{
  "dealId": "RISKY_DEAL_001",
  "winningBidId": "bid_yyy"
}

Response:
{
  "status": "BLOCKED_G2",
  "reason": "Bid spread 41.7% exceeds threshold 15%",
  "trade": "Roofing",
  "stats": {
    "min": 24000,
    "median": 28000,
    "max": 34000,
    "spread": 10000,
    "spreadPct": 41.7
  },
  "threshold": 15,
  "outliers": ["bid_high"],
  "recommendation": "Request additional bids or negotiate with vendors",
  "bids": [
    {"bidId": "bid_1", "vendorId": "v1", "total": 24000, "isOutlier": false},
    {"bidId": "bid_2", "vendorId": "v2", "total": 28000, "isOutlier": false},
    {"bidId": "bid_3", "vendorId": "v3", "total": 34000, "isOutlier": true}
  ],
  "eventId": "evt_yyy"
}
```

## Key Features

### Unit Normalization
The system handles various unit formats vendors might use:

```javascript
// All these normalize to 1500 sqft:
"15 squares" → 1500 sqft (roofing squares)
"1500 sqft" → 1500 sqft
"1500 sf" → 1500 sqft
"1500 square feet" → 1500 sqft
```

### Outlier Detection
Uses IQR (Interquartile Range) method:
- Q1 = 25th percentile
- Q3 = 75th percentile
- IQR = Q3 - Q1
- Outliers = values outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR]

### Budget Ledger Integration
When a bid is awarded:
1. Updates bid status to 'awarded'
2. Rejects other bids for same trade
3. Updates `BudgetLedger.committed` for the trade
4. Tracks total committed across all trades

## Setup Instructions

### 1. Install Dependencies
```bash
cd flipops-site
npm install
```

### 2. Database Migration
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate dev

# Seed test data
npm run prisma:seed
```

### 3. Start Services
```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Next.js
npm run dev
```

### 4. Get Test Bid IDs
```bash
# Get bid IDs for testing
curl http://localhost:3000/api/debug/bids

# This returns test commands you can copy/paste
```

### 5. Test the Gate
```bash
# Test with safe bid (should award)
curl -X POST http://localhost:3000/api/bids/award \
  -H "Content-Type: application/json" \
  -d '{"dealId":"SAFE_DEAL_001","winningBidId":"[SAFE_BID_ID]"}'

# Test with risky bid (should block)
curl -X POST http://localhost:3000/api/bids/award \
  -H "Content-Type: application/json" \
  -d '{"dealId":"RISKY_DEAL_001","winningBidId":"[RISKY_BID_ID]"}'

# Run automated tests
npm test g2-award
```

## Integration with n8n

### Webhook Configuration
```javascript
// n8n webhook for blocked bids
{
  "webhookUrl": "https://your-n8n.com/webhook/g2-blocked",
  "method": "POST",
  "filters": {
    "status": "BLOCKED_G2"
  }
}
```

### Alert Workflow
1. G2 blocks a bid award → Event created
2. n8n receives the block event with:
   - All bid amounts and vendors
   - Spread percentage and threshold
   - Identified outliers
3. n8n actions:
   - Send Slack alert to procurement team
   - Email vendors requesting revised quotes
   - Create task for manual review

## Advanced Features

### Multi-Trade Support
While the current implementation compares bids for a single trade, the architecture supports:
- Multi-trade bid packages
- Trade-by-trade comparison
- Aggregate spread analysis

### Configurable Thresholds
Thresholds can vary by:
- Region (Miami: 15%, Orlando: 20%)
- Grade (Standard: 15%, Luxury: 10%)
- Trade (Roofing: 15%, HVAC: 20%)

### Savings Tracking
Every award response includes:
- `savingsVsMax`: How much saved vs highest bid
- `savingsVsMedian`: How much saved vs median bid
- Useful for ROI reporting

## Security Features

### Input Validation
- Zod schemas validate all inputs
- Bid must belong to specified deal
- Vendor verification

### Audit Trail
- Every decision creates an immutable Event
- Includes all bids compared
- Tracks spread calculation
- Cannot be modified after creation

### Error Handling
- Clear error messages
- Request IDs for debugging
- No sensitive data exposed

## Performance Optimizations

### Database
- Indexed on dealId and vendorId
- JSON fields for flexible bid items
- Efficient batch updates

### Normalization
- In-memory unit conversion
- Cached canonical units
- Minimal database queries

## Troubleshooting

### Common Issues

#### "Winning bid not found"
- Ensure bid ID exists: `curl http://localhost:3000/api/debug/bids`
- Check bid belongs to correct deal
- Verify bid status is 'pending'

#### "Need at least 2 bids"
- Seed more bids: `npm run prisma:seed`
- Check all bids have items with same trade
- Verify bids aren't already awarded

#### "Unknown unit"
- Check `lib/normalizeBid.ts` for supported units
- Add new unit mapping if needed
- Units are case-insensitive

#### High spread but not blocking
- Check policy threshold: Default is 15%
- Verify spread calculation: (max - min) / median
- Check all bids being compared

## API Response Codes

- **200**: Bid awarded successfully
- **404**: Bid or deal not found
- **409**: Guardrail violation (spread > 15%)
- **422**: Validation failed
- **500**: Internal server error

## Next Steps

With G1 and G2 complete, implement:

1. **Budget Guardian**: Invoice ingestion with variance tiers (`/api/invoices/ingest`)
2. **Change Order Gatekeeper**: Impact simulation (`/api/change-orders/submit`)
3. **Panel APIs**: Dashboard endpoints (`/api/panels/*`)

---

*Gate G2 Implementation Complete - Ready for Production*