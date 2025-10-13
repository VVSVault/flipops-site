# Gate G1 Implementation - Maximum Exposure Protection ✅

## Overview
Gate G1 has been fully implemented to protect against excessive exposure by blocking deals where P80 exceeds the maximum allowable exposure defined in the policy.

## Components Implemented

### 1. Database Schema
- **Policy Model**: Added to `prisma/schema.prisma`
  - Stores region/grade-specific policies
  - Defines `maxExposureUsd` thresholds
  - Includes contingency targets and variance tiers

### 2. Core Libraries
- **`lib/prisma.ts`**: Singleton Prisma client for database access
- **`lib/estimator.ts`**: Enhanced with G1 support
- **`lib/events.ts`**: Immutable event logging with checksums
- **`lib/logger.ts`**: Structured logging for debugging

### 3. API Endpoint
- **`app/api/deals/approve/route.ts`**: Main G1 enforcement endpoint
  - Validates deal against policy
  - Computes P50/P80/P95 estimates
  - Blocks or approves based on P80 vs maxExposure
  - Creates immutable audit events

### 4. Seed Data
- **`prisma/seed.ts`**: Updated with:
  - Policies for Miami region (Standard/Premium/Luxury)
  - Safe deal (`SAFE_DEAL_001`) that passes G1
  - Risky deal (`RISKY_DEAL_001`) that fails G1

### 5. Testing
- **`tests/g1-approval.test.ts`**: Comprehensive test suite
- **`test-g1.sh`**: Manual testing script
- **`vitest.config.ts`**: Test configuration

## How It Works

### Success Flow (200 APPROVED)
```json
POST /api/deals/approve
{
  "dealId": "SAFE_DEAL_001",
  "region": "Miami",
  "grade": "Standard"
}

Response:
{
  "status": "APPROVED",
  "dealId": "SAFE_DEAL_001",
  "metrics": {
    "baseline": 43100,
    "p50": 43100,
    "p80": 49565,
    "p95": 52795
  },
  "policy": {
    "maxExposureUsd": 150000,
    "targetRoiPct": 20,
    "contingencyTargetPct": 10
  },
  "headroom": {
    "amount": 100435,
    "percentage": 66.96
  },
  "eventId": "evt_xxx"
}
```

### Failure Flow (409 BLOCKED)
```json
POST /api/deals/approve
{
  "dealId": "RISKY_DEAL_001",
  "region": "Miami",
  "grade": "Standard"
}

Response:
{
  "status": "BLOCKED_G1",
  "reason": "P80 exceeds maximum exposure limit",
  "metrics": {
    "p50": 116200,
    "p80": 162450,
    "p95": 178900,
    "maxExposureUsd": 150000,
    "overBy": 12450,
    "overByPct": 8.3
  },
  "drivers": [
    {"trade": "Roofing", "delta": 26000},
    {"trade": "Kitchen", "delta": 35000}
  ],
  "recommendation": "Reduce scope or negotiate better pricing",
  "eventId": "evt_yyy"
}
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd flipops-site
npm install
```

### 2. Setup Database
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
# Terminal 1: Start Redis (required for queues)
redis-server

# Terminal 2: Start Next.js app
npm run dev

# Terminal 3: Start workers (optional for G1, required for other gates)
npm run dev:workers
```

### 4. Test the Gate
```bash
# Option 1: Run automated tests
npm test

# Option 2: Manual testing with curl
chmod +x test-g1.sh
./test-g1.sh

# Option 3: Individual curl commands
# Test safe deal (should approve)
curl -X POST http://localhost:3000/api/deals/approve \
  -H "Content-Type: application/json" \
  -d '{"dealId":"SAFE_DEAL_001","region":"Miami","grade":"Standard"}'

# Test risky deal (should block)
curl -X POST http://localhost:3000/api/deals/approve \
  -H "Content-Type: application/json" \
  -d '{"dealId":"RISKY_DEAL_001","region":"Miami","grade":"Standard"}'
```

## Integration with n8n

Once G1 is working, you can integrate with n8n:

### Webhook Configuration
```javascript
// n8n webhook node configuration
{
  "webhookUrl": "https://your-n8n.com/webhook/g1-alerts",
  "method": "POST",
  "responseMode": "onReceived",
  "responseData": "allEntries"
}
```

### Alert Workflow
1. G1 blocks a deal → Event created
2. Optional: Add webhook call in the API
3. n8n receives the block event
4. n8n sends Slack/Email alerts with:
   - Deal ID and address
   - P80 vs Max Exposure
   - Top cost drivers
   - Recommended actions

## Security Features

### Immutable Audit Trail
- Every decision creates an Event with SHA-256 checksum
- Cannot be modified after creation
- Tracks actor, action, and full context

### Input Validation
- Zod schemas validate all inputs
- Type-safe throughout the stack
- Clear error messages for invalid data

### Error Handling
- Structured error responses
- Request IDs for tracing
- No sensitive data in logs

## Performance Considerations

### Optimization Points
- Database queries use indexes
- Prisma client uses connection pooling
- Monte Carlo simulation runs 1000 iterations (configurable)
- Results cacheable for same inputs

### Monitoring
- Structured logs with Pino
- Request duration tracking
- Event creation for audit
- Health check endpoint available

## Next Steps

With G1 complete, implement the remaining gates:

1. **Gate G2**: Bid spread control (`/api/bids/award`)
2. **Budget Guardian**: Variance monitoring (`/api/invoices/ingest`)
3. **Change Order Gatekeeper**: Impact simulation (`/api/change-orders/submit`)
4. **Panel APIs**: Dashboard data endpoints (`/api/panels/*`)

## Troubleshooting

### Common Issues

#### "Deal not found"
- Ensure seed data is loaded: `npm run prisma:seed`
- Check deal ID matches exactly

#### "No policy configured"
- Run migrations: `npm run prisma:migrate dev`
- Seed policies: `npm run prisma:seed`

#### "Cannot connect to database"
- Check DATABASE_URL in `.env.local`
- Ensure PostgreSQL is running
- Verify database exists

#### Test failures
- Start the app first: `npm run dev`
- Check BASE_URL matches your setup
- Ensure Redis is running for events

## API Response Codes

- **200**: Deal approved
- **404**: Deal not found
- **409**: Guardrail violation (P80 > maxExposure)
- **422**: Validation failed (invalid input)
- **500**: Internal server error

---

*Gate G1 Implementation Complete - Ready for Production*