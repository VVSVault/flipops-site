# REAPI Integration Guide

**Last Updated:** December 11, 2025
**Status:** Testing Phase (Trial until Dec 24, 2025)
**Credits Remaining:** 2,000

---

## Overview

REAPI (RealEstateAPI) is an alternative to ATTOM that provides property data with **built-in distress signals**. Unlike ATTOM, REAPI includes pre-foreclosure, vacant, inherited, and other distress flags directly in property records.

### Why REAPI Over ATTOM?

| Feature | ATTOM | REAPI |
|---------|-------|-------|
| Pre-foreclosure data | Separate product ($$$) | Included |
| Vacant indicators | Not available | Included |
| Inherited flags | Not available | Included |
| Tax lien data | Separate product | Included |
| Death/probate flags | Not available | Included |
| Absentee owner | Partial (inferred) | Direct flag |
| Skip tracing | Not available | Available (not used*) |
| AVM | Separate product | Included |
| Monthly cost | ~$500/mo | ~$99/mo (Starter) |

*We continue using BatchData for skip tracing as it provides better match rates.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FlipOps App                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  /api/reapi/     │    │  /api/reapi/     │                   │
│  │    search        │    │    import        │                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                              │
│           ▼                       ▼                              │
│  ┌────────────────────────────────────────────┐                 │
│  │              lib/reapi/                     │                 │
│  │  ┌─────────────┐  ┌─────────────────────┐  │                 │
│  │  │   client    │  │  endpoints/         │  │                 │
│  │  │  (HTTP +    │  │  - property-search  │  │                 │
│  │  │ rate limit) │  │  - property-detail  │  │                 │
│  │  └─────────────┘  └─────────────────────┘  │                 │
│  │  ┌─────────────┐  ┌─────────────────────┐  │                 │
│  │  │   types     │  │  utils/             │  │                 │
│  │  │  (TS defs)  │  │  - distress-scorer  │  │                 │
│  │  └─────────────┘  └─────────────────────┘  │                 │
│  │  ┌─────────────┐                           │                 │
│  │  │   mappers   │                           │                 │
│  │  │ (REAPI→DB)  │                           │                 │
│  │  └─────────────┘                           │                 │
│  └────────────────────────────────────────────┘                 │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   RealEstateAPI        │
              │   api.realestateapi.com│
              └────────────────────────┘
```

---

## File Structure

```
lib/reapi/
├── README.md              # This file
├── index.ts               # Main exports
├── client.ts              # HTTP client with rate limiting
├── types.ts               # TypeScript interfaces
├── mappers.ts             # REAPI → Prisma Property mapping
├── endpoints/
│   ├── property-search.ts # PropertySearch endpoint
│   └── property-detail.ts # PropertyDetail endpoint
└── utils/
    └── distress-scorer.ts # Distress scoring algorithm

app/api/reapi/
├── search/
│   └── route.ts           # POST /api/reapi/search
└── import/
    └── route.ts           # POST /api/reapi/import

scripts/
├── test-reapi-connection.ts  # Basic connection test
└── test-reapi-simple.ts      # Detailed API test
```

---

## Environment Variables

Add to `.env.local`:

```env
# RealEstateAPI (REAPI)
REAPI_API_KEY=FLIPOPS-d721-7349-b6cb-47c5edfa6742
REAPI_BASE_URL=https://api.realestateapi.com
```

---

## API Endpoints

### POST /api/reapi/search

Search for properties with optional distress filters.

**Request:**
```json
{
  "zip": "32202",
  "pageSize": 20,
  "propertyType": "SFR",
  "minBeds": 2,
  "maxBeds": 5,
  "minValue": 50000,
  "maxValue": 500000,
  "preForeclosure": true,
  "vacant": true,
  "absenteeOwner": true,
  "highEquity": true
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| zip | string | One of zip/city/state/county required | ZIP code |
| city | string | | City name |
| state | string | | 2-letter state code |
| county | string | | County name |
| pageSize | number | | Results per page (1-100, default: 20) |
| propertyType | enum | | SFR, MFH2to4, MFH5plus, CONDO, LAND, MOBILE |
| minBeds | number | | Minimum bedrooms |
| maxBeds | number | | Maximum bedrooms |
| minValue | number | | Minimum estimated value |
| maxValue | number | | Maximum estimated value |
| preForeclosure | boolean | | Filter by pre-foreclosure |
| vacant | boolean | | Filter by vacant properties |
| absenteeOwner | boolean | | Filter by absentee owner |
| outOfStateOwner | boolean | | Filter by out-of-state owner |
| inherited | boolean | | Filter by inherited properties |
| highEquity | boolean | | Filter by high equity (50%+) |
| taxLien | boolean | | Filter by tax lien |
| death | boolean | | Filter by death transfer |
| countOnly | boolean | | Only return count (FREE - no credits) |

**Response:**
```json
{
  "success": true,
  "count": 15,
  "total": 2390,
  "creditsUsed": 20,
  "properties": [
    {
      "reapiId": "335604995",
      "address": "123 Main St",
      "city": "Jacksonville",
      "state": "FL",
      "zip": "32202",
      "county": "Duval County",
      "ownerName": "John Smith",
      "mailingAddress": "456 Other St, Atlanta, GA 30305",
      "propertyType": "SFR",
      "bedrooms": 3,
      "bathrooms": 2,
      "squareFeet": 1500,
      "yearBuilt": 1985,
      "estimatedValue": 250000,
      "assessedValue": 200000,
      "lastSaleDate": "2019-05-15",
      "lastSalePrice": 180000,
      "equityPercent": 75,
      "estimatedEquity": 187500,
      "preForeclosure": false,
      "auction": false,
      "vacant": false,
      "absenteeOwner": true,
      "outOfStateOwner": true,
      "inherited": false,
      "death": false,
      "taxLien": false,
      "judgment": false,
      "highEquity": true,
      "freeClear": false,
      "corporateOwned": false,
      "distressScore": 25,
      "distressGrade": "D",
      "motivation": "LOW",
      "distressSignals": ["OUT_OF_STATE_OWNER", "HIGH_EQUITY"]
    }
  ]
}
```

### POST /api/reapi/import

Import selected properties from search results to database.

**Request:**
```json
{
  "properties": [
    {
      "reapiId": "335604995",
      "address": "123 Main St",
      "city": "Jacksonville",
      "state": "FL",
      "zip": "32202",
      "ownerName": "John Smith",
      "propertyType": "SFR",
      "bedrooms": 3,
      "bathrooms": 2,
      "squareFeet": 1500,
      "yearBuilt": 1985,
      "estimatedValue": 250000,
      "lastSalePrice": 180000,
      "preForeclosure": false,
      "vacant": false,
      "absenteeOwner": true,
      "highEquity": true,
      "distressScore": 25
    }
  ],
  "fetchFullDetails": false,
  "skipTrace": true
}
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| properties | array | required | Array of property objects from search |
| fetchFullDetails | boolean | false | Fetch PropertyDetail for each (costs credits) |
| skipTrace | boolean | true | Run BatchData skip trace on each property |

**Response:**
```json
{
  "success": true,
  "results": {
    "imported": 5,
    "skipped": 2,
    "enriched": 4,
    "detailsFetched": 0,
    "errors": [],
    "creditsUsed": 0
  },
  "skipTraceEnabled": true,
  "message": "Imported 5 properties, 4 enriched with contact info, 2 already existed"
}
```

---

## Distress Scoring Algorithm

Properties are scored 0-100 based on distress signals. Higher scores indicate more motivated sellers.

### Score Breakdown

| Signal | Points | Description |
|--------|--------|-------------|
| Pre-foreclosure | 25 | Active NOD/Lis Pendens |
| Auction/Foreclosure | 25 | Scheduled for auction |
| Tax Lien/Judgment | 20 | Has liens or judgments |
| Vacant | 15 | Property appears vacant |
| Out-of-state Owner | 15 | Owner lives out of state |
| Inherited | 15 | Property was inherited |
| Death Transfer | 15 | Recent death transfer |
| REO | 10 | Bank-owned property |
| Absentee Owner (in-state) | 10 | Owner lives elsewhere in state |
| High Equity (50%+) | 10 | Significant equity |
| Long-term Owner (15+ yrs) | 10 | Tired landlord potential |
| Portfolio Owner (4+ props) | 10 | Owns multiple properties |
| Corporate Owned | 5 | LLC/Corp ownership |
| Free & Clear | 5 | No mortgage |

### Grades & Motivation Levels

| Grade | Score | Motivation |
|-------|-------|------------|
| A | 80-100 | HIGH |
| B | 60-79 | HIGH |
| C | 40-59 | MEDIUM |
| D | 20-39 | LOW |
| F | 0-19 | NONE |

---

## Usage Examples

### Search Properties (TypeScript)

```typescript
import { searchProperties, filterByDistress, quickDistressScore } from '@/lib/reapi';

// Search all properties in ZIP
const response = await searchProperties({
  zip: '32202',
  size: 50,
});

// Filter to only distressed properties client-side
const distressed = filterByDistress(response.data, {
  preForeclosure: true,
  vacant: true,
  absenteeOwner: true,
});

// Calculate scores
const scored = distressed.map(p => ({
  ...p,
  score: quickDistressScore(p),
}));

// Sort by score
scored.sort((a, b) => b.score - a.score);
```

### Count Properties (FREE)

```typescript
import { countProperties } from '@/lib/reapi';

// This is FREE - no credits used
const count = await countProperties({
  zip: '32202',
});
console.log(`Found ${count} properties`);
```

### Import to Database

```typescript
// Call the API endpoint
const response = await fetch('/api/reapi/import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    properties: selectedProperties,
    skipTrace: true,
  }),
});

const result = await response.json();
console.log(`Imported ${result.results.imported} properties`);
```

---

## Credit Optimization

REAPI charges per property fetched. Here's how to minimize credit usage:

### Free Operations (0 credits)
- Count queries (`count: true`)
- ID-only queries (`ids_only: true`)

### Credit-Consuming Operations
- Property Search: 1 credit per property returned
- Property Detail: 1 credit per property

### Optimization Strategy

1. **Use count first** to estimate results
2. **Filter by location** (ZIP/city) to reduce results
3. **Apply distress filters client-side** (trial limitation)
4. **Skip PropertyDetail** unless needed (search has most data)

```typescript
// Step 1: Free count
const count = await countProperties({ zip: '32202' });
console.log(`Total: ${count}`);

// Step 2: Fetch only what you need
const response = await searchProperties({
  zip: '32202',
  size: Math.min(count, 50), // Limit to 50
});

// Step 3: Filter client-side (free)
const hot = filterByDistress(response.data, {
  preForeclosure: true,
  vacant: true,
});
```

---

## Known Limitations (Trial Tier)

1. **Server-side distress filters don't work** - Filters like `preForeclosure: true` in the request body return errors. Use `filterByDistress()` client-side instead.

2. **2,000 credit limit** - Each property fetched costs 1 credit. Use count queries liberally.

3. **No AVM endpoint access** - AVM data is included in PropertyDetail but separate AVM endpoint may be restricted.

4. **Rate limit: 10 req/sec** - Built into the client automatically.

---

## Data Flow: ATTOM vs REAPI

### Current (ATTOM)
```
Search ZIP → Get basic data → Skip trace → Infer distress → Score → Save
                                            ↑
                                   Limited to tax delinquent
                                   and absentee owner only
```

### New (REAPI)
```
Search ZIP → Get data WITH distress flags → Skip trace → Score → Save
                    ↑
            Pre-foreclosure, vacant,
            inherited, death, liens,
            all included!
```

---

## Leads Page UI Integration

The Leads page (`app/app/leads/page-content.tsx`) has been updated to support both ATTOM and REAPI data sources.

### Features Added

1. **Data Source Toggle** - Switch between REAPI (default) and ATTOM (legacy)
2. **Distress Filter Checkboxes** (REAPI only):
   - Pre-Foreclosure
   - Vacant
   - Absentee Owner
   - High Equity
   - Inherited
   - Tax Lien
   - Death/Probate

3. **Enhanced Search Results Display** (REAPI):
   - Distress Score badge with color coding (red: 60+, orange: 40-59)
   - Equity percentage
   - Distress signal badges
   - Motivation level indicator

4. **Source Filter** - Filter imported properties by source (REAPI, ATTOM, Manual)

### Type Definitions

```typescript
// Union type for search results
type SearchProperty = AttomProperty | ReapiProperty;

// Type guard to check data source
function isReapiProperty(p: SearchProperty): p is ReapiProperty {
  return 'reapiId' in p;
}
```

### UI Components

```
┌─────────────────────────────────────────────┐
│ Find Properties Dialog                       │
├─────────────────────────────────────────────┤
│ [REAPI (Distress Data)] [ATTOM (Legacy)]    │  ← Data Source Toggle
├─────────────────────────────────────────────┤
│ ZIP Code: [_____]  Min: [$____]  Max: [$___]│
├─────────────────────────────────────────────┤
│ Distress Filters (REAPI only):              │
│ ☐ Pre-Foreclosure  ☐ Vacant                 │
│ ☐ Absentee Owner   ☐ High Equity            │
│ ☐ Inherited        ☐ Tax Lien               │
│ ☐ Death/Probate                             │
├─────────────────────────────────────────────┤
│ [Search REAPI]                              │
├─────────────────────────────────────────────┤
│ Results:                                    │
│ ☐ 123 Main St         Score: 75  (orange)  │
│   Jacksonville, FL     Equity: 85%         │
│   [PRE-FORECLOSURE] [VACANT] [HIGH_EQUITY] │
└─────────────────────────────────────────────┘
```

---

## Migration Path

### Current State
- ATTOM + BatchData in production
- REAPI integration ready for testing
- **Leads page supports both ATTOM and REAPI** (toggle in UI)

### Testing Phase (Now → Dec 24)
1. Test REAPI search via leads page UI (default selection)
2. Import test properties via `/api/reapi/import`
3. Compare data quality vs ATTOM
4. Monitor credit usage
5. Gather user feedback on distress signals usefulness

### Post-Trial Decision
If REAPI proves valuable:
1. Subscribe to Starter plan (~$99/mo)
2. Consider making REAPI the only option (remove ATTOM toggle)
3. Save ~$400/mo on property data costs

---

## Testing

### Run Test Script
```bash
npx tsx scripts/test-reapi-simple.ts
```

### Manual API Test
```bash
# Search
curl -X POST http://localhost:3007/api/reapi/search \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-clerk-session]" \
  -d '{"zip": "32202", "pageSize": 5}'
```

---

## Troubleshooting

### "REAPI not configured"
Check `.env.local` has `REAPI_API_KEY` set.

### "preForeclosure is not allowed"
Trial tier doesn't support server-side distress filters. Use `filterByDistress()` client-side.

### Empty results
- Check if ZIP code has coverage
- Try a different geographic area
- Use count query first to verify data exists

### Rate limit errors
Built-in rate limiter should prevent this. If it happens, the client will retry automatically.

---

## Related Files

- [BETA_FIX_GUIDE.md](../../BETA_FIX_GUIDE.md) - Overall beta documentation
- [lib/batchdata.ts](../batchdata.ts) - Skip tracing service (still used)
- [lib/cron/shared/scoring.ts](../cron/shared/scoring.ts) - Original scoring (for comparison)

---

## Contact & Support

- **REAPI Docs:** https://docs.realestateapi.com
- **Trial Expires:** December 24, 2025
- **Credits:** 2,000 (monitor usage!)
