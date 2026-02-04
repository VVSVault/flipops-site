# REAPI Integration Documentation

> Complete documentation of the RealEstateAPI (REAPI) integration for FlipOps.
> Last Updated: 2025-12-13

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [API Endpoints](#api-endpoints)
5. [Distress Scoring Algorithm](#distress-scoring-algorithm)
6. [UI Integration](#ui-integration)
7. [Data Flow](#data-flow)
8. [Type Definitions](#type-definitions)
9. [Configuration](#configuration)
10. [Usage Examples](#usage-examples)
11. [Data Quality Validation](#data-quality-validation)
12. [Migration from ATTOM](#migration-from-attom)
13. [Troubleshooting](#troubleshooting)

---

## Overview

### What is REAPI?

RealEstateAPI (REAPI) is a property data provider that offers comprehensive distress signals that ATTOM does not provide:

| Feature | ATTOM | REAPI |
|---------|-------|-------|
| Pre-foreclosure | ❌ NO | ✅ YES |
| Vacant indicator | ❌ NO | ✅ YES |
| Inherited flag | ❌ NO | ✅ YES |
| Death/Probate | ❌ NO | ✅ YES |
| Tax lien | Partial | ✅ YES |
| High equity | ❌ NO | ✅ YES |
| Judgment | ❌ NO | ✅ YES |
| Free & clear | ❌ NO | ✅ YES |
| Corporate owned | ❌ NO | ✅ YES |
| Absentee owner (in/out of state) | ❌ NO | ✅ YES |
| **Cost** | ~$500/mo | ~$99/mo |

### Trial Information

- **Trial Expires:** December 24, 2025
- **Credits:** 2,000
- **Tier Limitations:** Trial tier may not support server-side distress filtering

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UI LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  Leads Page                 │  Underwriting Page            │
│  (app/app/leads/            │  (app/app/underwriting/       │
│   page-content.tsx)         │   page-content.tsx)           │
│  - REAPI/ATTOM toggle       │  - ARV validation             │
│  - Distress filters         │  - Outlier comp detection     │
│  - Search results           │  - Data quality alerts        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API ROUTES                               │
├─────────────────────────────────────────────────────────────┤
│  /api/reapi/search          │  /api/reapi/import            │
│  - Property search          │  - Import to database         │
│  - Distress filtering       │  - Skip trace integration     │
│  - Score calculation        │  - Score persistence          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  REAPI MODULE (lib/reapi/)                   │
├─────────────────────────────────────────────────────────────┤
│  client.ts      │  types.ts       │  mappers.ts             │
│  - HTTP client  │  - TypeScript   │  - Prisma mapping       │
│  - Rate limit   │    interfaces   │  - Property conversion  │
│  - Error handle │  - API types    │  - Type mapping         │
├─────────────────┴─────────────────┴─────────────────────────┤
│  endpoints/                  │  utils/                      │
│  - property-search.ts        │  - distress-scorer.ts        │
│  - property-detail.ts        │                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              REAPI (api.realestateapi.com)                   │
│              - /v2/PropertySearch                            │
│              - /v2/PropertyDetail                            │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
flipops-site/
├── lib/reapi/
│   ├── index.ts              # Main exports
│   ├── client.ts             # HTTP client with rate limiting
│   ├── types.ts              # TypeScript interfaces
│   ├── mappers.ts            # REAPI → Prisma Property mapping
│   ├── README.md             # REAPI-specific documentation
│   ├── endpoints/
│   │   ├── property-search.ts  # Search endpoint wrapper
│   │   └── property-detail.ts  # Detail endpoint wrapper
│   └── utils/
│       └── distress-scorer.ts  # Distress scoring algorithm
│
├── app/api/reapi/
│   ├── search/route.ts       # POST /api/reapi/search
│   └── import/route.ts       # POST /api/reapi/import
│
├── app/app/leads/
│   └── page-content.tsx      # UI with REAPI/ATTOM toggle
│
├── app/app/underwriting/
│   └── page-content.tsx      # Data quality validation
│
└── docs/
    └── REAPI_INTEGRATION.md  # This documentation
```

---

## API Endpoints

### POST /api/reapi/search

Search for properties with optional distress filters.

**Request Body:**
```typescript
{
  zip?: string;              // Required: ZIP code
  city?: string;             // City name
  state?: string;            // 2-letter state code
  county?: string;           // County name

  // Property filters
  propertyType?: 'SFR' | 'MFH2to4' | 'MFH5plus' | 'CONDO' | 'LAND' | 'MOBILE';
  minBeds?: number;
  maxBeds?: number;
  minValue?: number;         // Estimated value minimum
  maxValue?: number;         // Estimated value maximum
  minYearBuilt?: number;
  maxYearBuilt?: number;

  // Distress filters (client-side filtering on trial tier)
  preForeclosure?: boolean;
  vacant?: boolean;
  absenteeOwner?: boolean;
  outOfStateOwner?: boolean;
  inherited?: boolean;
  highEquity?: boolean;
  taxLien?: boolean;
  death?: boolean;

  // Minimum distress score filter (NEW in 2025-12-13)
  minScore?: number;         // 0-100, filters results to only include properties
                             // with distressScore >= minScore

  // Pagination
  pageSize?: number;         // Default: 20, Max: 100
  countOnly?: boolean;       // Just return count (free)
}
```

**Response:**
```typescript
{
  success: boolean;
  count: number;             // Properties returned
  total: number;             // Total matching (before limit)
  creditsUsed: number;       // REAPI credits consumed
  properties: ReapiProperty[];
}
```

### POST /api/reapi/import

Import selected properties to the database with optional skip tracing.

**Request Body:**
```typescript
{
  properties: ReapiProperty[];  // From search results
  fetchFullDetails?: boolean;   // Fetch PropertyDetail (1 credit each)
  skipTrace?: boolean;          // Enable BatchData skip tracing
}
```

**Response:**
```typescript
{
  success: boolean;
  results: {
    imported: number;
    skipped: number;
    enriched: number;
    detailsFetched: number;
    creditsUsed: number;
    errors: string[];
  };
  message: string;
}
```

---

## Distress Scoring Algorithm

The distress scoring algorithm (`lib/reapi/utils/distress-scorer.ts`) calculates a 0-100 score based on weighted distress signals.

### Signal Weights (v2.0 - December 2025)

| Signal | Weight | Description |
|--------|--------|-------------|
| **High-Value Signals (20-25 pts)** | | |
| PRE_FORECLOSURE | 25 | Active pre-foreclosure filing (NOD, Lis Pendens) |
| AUCTION | 25 | Property scheduled for foreclosure auction |
| LIEN_JUDGMENT | 20 | Active tax lien or court judgment on property |
| **Medium-Value Signals (10-15 pts)** | | |
| VACANT | 15 | Property identified as vacant or unoccupied |
| OUT_OF_STATE_OWNER | 15 | Owner mailing address is in a different state |
| INHERITED | 15 | Property was transferred via inheritance |
| DEATH_TRANSFER | 15 | Recent death or spousal death transfer recorded |
| NEGATIVE_EQUITY | 15 | Mortgage balance exceeds property value |
| LONG_TERM_OWNER | **15** | Owner has held property for 15+ years *(was 10)* |
| ABSENTEE_OWNER | **12** | In-state owner at different address *(was 10)* |
| HIGH_EQUITY | 10 | Owner has 50%+ equity in property |
| REO | 10 | Bank-owned / Real Estate Owned property |
| PRICE_REDUCED | 10 | Active listing with recent price reduction |
| PRIVATE_LENDER | 10 | Non-institutional / private money financing |
| PORTFOLIO_OWNER | 10 | Owner has 4+ properties AND is absentee |
| **Lower-Value Signals (5 pts)** | | |
| FREE_CLEAR | 5 | No mortgage on property (100% equity) |
| CORPORATE_OWNED | 5 | Owned by corporation, LLC, or trust |
| ADJUSTABLE_RATE | 5 | Property has adjustable rate mortgage (ARM) |
| QUIT_CLAIM | **5** | Property transferred via quit claim deed *(new)* |

### Grades and Motivation Levels (v2.0)

| Score | Grade | Motivation | Recommended Action |
|-------|-------|------------|-------------------|
| 65-100 | A | HIGH | Immediate outreach - highest priority |
| 50-64 | B | HIGH | Priority outreach within 24-48 hours |
| 35-49 | C | MEDIUM | Standard follow-up sequence |
| 20-34 | D | LOW | Add to nurture campaign |
| 0-19 | F | NONE | Archive or remove from active pipeline |

### Key Changes from v1.0

| Change | Previous | Revised | Rationale |
|--------|----------|---------|-----------|
| Grade A Threshold | 80+ | 65+ | Adjusted for realistic signal stacking |
| Grade B Threshold | 60-79 | 50-64 | Better reflects quality lead range |
| Grade C Threshold | 40-59 | 35-49 | Workable leads worth pursuing |
| LONG_TERM_OWNER | 10 pts | 15 pts | Strong motivation indicator |
| ABSENTEE (in-state) | 10 pts | 12 pts | Slightly increased weight |
| QUIT_CLAIM | - | 5 pts | New signal for deed transfers |

### Usage

```typescript
import { calculateDistressScore, quickDistressScore } from '@/lib/reapi';

// Full calculation with signal breakdown
const result = calculateDistressScore(reapiProperty);
console.log(result.score);      // 75
console.log(result.grade);      // 'B'
console.log(result.motivation); // 'HIGH'
console.log(result.signals);    // [{ signal: 'PRE_FORECLOSURE', ... }]

// Quick score (just the number)
const score = quickDistressScore(reapiProperty);
```

---

## UI Integration

### Leads Page (`app/app/leads/page-content.tsx`)

#### Features Added

1. **Data Source Toggle** - Switch between REAPI (default) and ATTOM
2. **Distress Filter Checkboxes** (REAPI only)
3. **Enhanced Search Results Display** with distress badges
4. **Source Filter** - Filter imported properties by source

#### Type Definitions

```typescript
// REAPI Search Result Type
interface ReapiProperty {
  reapiId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  ownerName: string | null;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  yearBuilt: number | null;
  estimatedValue: number | null;
  lastSaleDate: string | null;
  lastSalePrice: number | null;
  equityPercent: number | null;
  estimatedEquity: number | null;

  // Distress flags
  preForeclosure: boolean;
  auction: boolean;
  foreclosure: boolean;
  vacant: boolean;
  absenteeOwner: boolean;
  outOfStateOwner: boolean;
  inherited: boolean;
  death: boolean;
  taxLien: boolean;
  judgment: boolean;
  highEquity: boolean;
  freeClear: boolean;
  corporateOwned: boolean;

  // Calculated
  distressScore: number;
  distressGrade: string;
  motivation: string;
  distressSignals: string[];
}

// Union type for search results
type SearchProperty = AttomProperty | ReapiProperty;

// Type guard
function isReapiProperty(p: SearchProperty): p is ReapiProperty {
  return 'reapiId' in p;
}
```

#### UI Components

```
┌─────────────────────────────────────────────────────────────┐
│ Find Properties Dialog                                       │
├─────────────────────────────────────────────────────────────┤
│ [REAPI (Distress Data)] [ATTOM (Legacy)]                    │
├─────────────────────────────────────────────────────────────┤
│ ZIP Code: [32250]     Min: [$____]     Max: [$500000]       │
├─────────────────────────────────────────────────────────────┤
│ Minimum Distress Score                              [60+]   │
│ ○───────────────●─────────────────○                         │
│ Any        40+ (Medium)   60+ (High)   80+ (Hot)            │
├─────────────────────────────────────────────────────────────┤
│ Filter by Distress Signals:                                  │
│ ☐ Pre-Foreclosure  ☐ Vacant      ☐ Absentee Owner          │
│ ☐ High Equity      ☐ Inherited   ☐ Tax Lien                │
│ ☐ Death/Probate                                              │
├─────────────────────────────────────────────────────────────┤
│ [Search REAPI]                                               │
├─────────────────────────────────────────────────────────────┤
│ Results:                                                     │
│ ☑ 123 Main St, Jacksonville Beach, FL    Score: 75 (orange) │
│   3 bed | 2 bath | 1,850 sqft            Equity: 85%        │
│   [PRE-FORECLOSURE] [VACANT] [HIGH_EQUITY]                  │
│                                                              │
│ ☐ 456 Oak Ave, Jacksonville Beach, FL    Score: 65 (orange) │
│   4 bed | 3 bath | 2,200 sqft            Equity: 60%        │
│   [ABSENTEE_OWNER] [INHERITED]                               │
├─────────────────────────────────────────────────────────────┤
│                    [Cancel]  [Import 1 Properties]           │
└─────────────────────────────────────────────────────────────┘
```

#### Minimum Score Filter

The minimum score slider allows users to filter properties by their calculated distress score:

| Score Range | Badge Color | Meaning |
|-------------|-------------|---------|
| 0 (Any) | Gray | No filtering, show all properties |
| 1-39 | Yellow | Low motivation properties |
| 40-59 | Orange | Medium motivation properties |
| 60-79 | Red | High motivation properties |
| 80-100 | Red (Hot) | Very high motivation properties |

The filter is applied client-side after receiving search results. If the minimum score filters out all properties, users receive a helpful message suggesting they lower their minimum score.

### Underwriting Page Data Quality Validation

The underwriting page (`app/app/underwriting/page-content.tsx`) includes data quality validation:

1. **ARV vs AVM Check** - Flags when ARV is >3x or <0.3x the AVM
2. **Outlier Comp Detection** - Identifies comps with price/sqft >3x or <0.3x median
3. **Visual Warnings** - Orange highlighting and alert icons
4. **Quality Check Panel** - Summary of data issues in Comps tab

---

## Data Flow

### Search Flow

```
User enters ZIP → [Leads Page]
        │
        ▼
POST /api/reapi/search → [Search Route]
        │
        ├── Validate input (Zod schema)
        ├── Check REAPI configuration
        ├── Build search params
        │
        ▼
searchProperties() → [lib/reapi/endpoints/property-search.ts]
        │
        ├── Rate limited POST to REAPI
        ├── /v2/PropertySearch
        │
        ▼
[REAPI Response] → Transform to ReapiProperty[]
        │
        ├── Calculate distressScore for each
        ├── Determine grade & motivation
        ├── Extract distress signals
        │
        ▼
Apply client-side filters (if distress filters selected)
        │
        ▼
Return to UI → Display results with badges
```

### Import Flow

```
User selects properties → [Leads Page]
        │
        ▼
POST /api/reapi/import → [Import Route]
        │
        ├── Validate input (Zod schema)
        ├── Check for duplicates
        │
        ▼
For each property:
        │
        ├── Optional: Fetch full details (1 credit)
        ├── Optional: Skip trace via BatchData
        ├── Calculate/recalculate distress score
        ├── Map to Prisma Property model
        ├── Store in database
        │
        ▼
Return results → Show success message
```

---

## Type Definitions

### REAPIPropertyData (`lib/reapi/types.ts`)

The actual REAPI response structure (differs from their documentation):

```typescript
interface REAPIPropertyData {
  // IDs
  id: string;
  propertyId: string;

  // Address (nested object)
  address: {
    address: string;
    city: string;
    county: string;
    fips: string;
    state: string;
    street: string;
    zip: string;
  };

  // Property characteristics
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number;
  lotSquareFeet: number;
  yearBuilt: number | null;

  // Financial
  estimatedValue: number;
  estimatedEquity: number;
  equityPercent: number;
  assessedValue: number;
  openMortgageBalance: number;
  lastSaleAmount: string;  // Note: string, not number!
  lastSaleDate?: string;

  // Distress flags (ALL AVAILABLE AT ROOT LEVEL)
  absenteeOwner: boolean;
  auction: boolean;
  corporateOwned: boolean;
  death: boolean;
  foreclosure: boolean;
  freeClear: boolean;
  highEquity: boolean;
  inherited: boolean;
  inStateAbsenteeOwner: boolean;
  judgment: boolean;
  outOfStateAbsenteeOwner: boolean;
  preForeclosure: boolean;
  reo: boolean;
  taxLien: boolean | null;
  vacant: boolean;

  // Owner info
  owner1LastName: string;
  companyName?: string;
  yearsOwned: number | null;
  totalPropertiesOwned: string;

  // MLS status
  mlsActive: boolean;
  mlsPending: boolean;
  forSale: boolean;
}
```

---

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# REAPI Configuration
REAPI_API_KEY=your_api_key_here
REAPI_BASE_URL=https://api.realestateapi.com  # Optional, this is default
```

### Checking Configuration

```typescript
import { isREAPIConfigured, getREAPIKeyMasked } from '@/lib/reapi';

if (!isREAPIConfigured()) {
  console.error('REAPI not configured');
}

console.log('API Key:', getREAPIKeyMasked()); // "abc12345...xyz9"
```

---

## Usage Examples

### Basic Search

```typescript
import { searchProperties, buildSearchParams } from '@/lib/reapi';

const params = buildSearchParams({
  zip: '32250',
  minValue: 100000,
  maxValue: 500000,
  propertyType: 'SFR',
});

const response = await searchProperties(params);
console.log(`Found ${response.resultCount} properties`);
```

### Search with Distress Filtering

```typescript
import { searchProperties, filterByDistress } from '@/lib/reapi';

// Search for all properties in ZIP
const response = await searchProperties({ zip: '32250', size: 100 });

// Filter client-side for distressed properties
const distressed = filterByDistress(response.data, {
  preForeclosure: true,
  vacant: true,
  taxLien: true,
});

console.log(`Found ${distressed.length} distressed properties`);
```

### Calculate Distress Score

```typescript
import { calculateDistressScore } from '@/lib/reapi';

const score = calculateDistressScore(reapiProperty);

if (score.motivation === 'HIGH') {
  console.log('Hot lead!', score.signals.map(s => s.signal));
}
```

### Search with Minimum Score Filter

```typescript
// Search for high-motivation properties only (score 60+)
const response = await fetch('/api/reapi/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    zip: '32250',
    pageSize: 50,
    // All results will have distressScore >= 60
  }),
});

const data = await response.json();

// Client-side filtering by minimum score
const minScore = 60;
const filtered = data.properties.filter(p => p.distressScore >= minScore);
console.log(`Found ${filtered.length} highly motivated sellers`);
```

### Import Properties

```typescript
const response = await fetch('/api/reapi/import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    properties: selectedProperties,
    skipTrace: true,  // Enable BatchData skip tracing
  }),
});

const result = await response.json();
console.log(result.message); // "Imported 5 properties, 4 enriched with contact info"
```

---

## Data Quality Validation

### ARV Validation

The underwriting page validates ARV against AVM:

```typescript
// ARV Data Quality Check
const avm = selectedProperty?.estimatedValue || 0;
const arvVsAvmRatio = avm > 0 ? adjustedARV / avm : 0;
const arvIsOutlier = arvSource === "comps" && avm > 0 &&
  (arvVsAvmRatio > 3 || arvVsAvmRatio < 0.3);
```

### Outlier Comp Detection

```typescript
// Check for outlier comps (price/sqft > 3x or < 0.3x the median)
const compPricesPerSqft = selectedCompsList.map(c => c.pricePerSqft);
const medianPricePerSqft = getMedian(compPricesPerSqft);
const outlierCompIds = selectedCompsList
  .filter(c =>
    c.pricePerSqft > medianPricePerSqft * 3 ||
    c.pricePerSqft < medianPricePerSqft * 0.3
  )
  .map(c => c.id);
```

### Warning Display

When data issues are detected:
- Orange warning banner below net sheet
- Orange highlighting on ARV value
- Orange highlighting on outlier comp rows
- Warning icons with tooltips
- Quality check items in Comps tab

---

## Migration from ATTOM

### Current State

- Both ATTOM and REAPI available via UI toggle
- REAPI is the default selection
- Properties imported from either source are tagged with `dataSource`

### Recommended Testing (Now → Dec 24)

1. Test REAPI search via leads page UI
2. Import test properties via REAPI
3. Compare data quality vs ATTOM
4. Monitor credit usage
5. Evaluate distress signal accuracy

### Post-Trial Decision

If REAPI proves valuable:
1. Subscribe to Starter plan (~$99/mo)
2. Consider making REAPI the only option
3. Potential savings: ~$400/mo on property data costs

---

## Troubleshooting

### Common Issues

#### "REAPI not configured"

Add `REAPI_API_KEY` to your `.env.local` file.

#### "Credits exhausted" (402)

Your REAPI trial credits are depleted. Upgrade to a paid plan.

#### "Rate limit exceeded" (429)

Too many requests. The client has built-in rate limiting (100ms between requests).

#### Duplicate key error in search results

Fixed by using composite selection keys: `${address}|${city}|${state}`

#### ARV showing unrealistic values

Check for outlier comps with corrupted `lastSalePrice` data. The UI now highlights these.

### Debug Logging

Enable REAPI debug logging:

```typescript
console.log('[REAPI Search] Found', properties.length, 'properties');
console.log('[REAPI Search] Sample distress flags:', {
  preForeclosure: properties[0].preForeclosure,
  vacant: properties[0].vacant,
  // ...
});
```

---

## Changelog

### 2025-12-13 (v2.0 Scoring Update)
- **Scoring Algorithm v2.0** - Major update per FlipOps_Distress_Scoring_Logic.pdf
  - LONG_TERM_OWNER: 10 → **15 pts** (strong motivation indicator)
  - ABSENTEE_OWNER (in-state): 10 → **12 pts** (slightly increased weight)
  - Added **QUIT_CLAIM** signal (5 pts) for quit claim deed transfers
  - Grade A threshold: 80+ → **65+** (adjusted for realistic signal stacking)
  - Grade B threshold: 60-79 → **50-64** (better reflects quality lead range)
  - Grade C threshold: 40-59 → **35-49** (workable leads worth pursuing)
  - HIGH motivation: 70+ → **50+** (aligned with Grade B)
  - MEDIUM motivation: 40-69 → **35-49** (aligned with Grade C)
  - LOW motivation: 15-39 → **20-34** (aligned with Grade D)
  - PORTFOLIO_OWNER trigger: >3 properties → **4+ properties**
- **Minimum Score Filter** - Added slider UI to filter properties by minimum distress score (0-100)
  - Slider with visual tiers: Any, 40+ (Medium), 60+ (High), 80+ (Hot)
  - Color-coded badge showing current selection
  - Client-side filtering with helpful messages when no properties match
- **Enhanced Distress Scoring** - Added distress signals:
  - NEGATIVE_EQUITY (15 pts) - Property underwater
  - PRICE_REDUCED (10 pts) - MLS price reduction
  - PRIVATE_LENDER (10 pts) - Hard money financing
  - ADJUSTABLE_RATE (5 pts) - ARM mortgage
  - Updated `quickDistressScore()` to match full algorithm
- **API Updates** - Added `minScore` parameter to search schema
- **UI Fix** - Added padding to scroll area to prevent last result from being cut off

### 2025-12-11
- Initial REAPI integration
- Distress scoring algorithm
- Leads page UI with REAPI/ATTOM toggle
- Distress filter checkboxes
- Search result badges and signals
- ARV data quality validation
- Outlier comp detection
- Fixed duplicate key issue in search results

### Known Limitations

1. Trial tier may not support server-side distress filtering
2. `lastSaleAmount` from REAPI is a string (parsed with `parseFloat`)
3. Some address data may be incomplete (e.g., "Mooreland Dr, , KY 40342")

---

## Related Documentation

- **[CONTRACTS_IMPLEMENTATION.md](./CONTRACTS_IMPLEMENTATION.md)** - Contracts feature status, offer management gap, and implementation plan for the Lead → Offer → Contract pipeline
