# ATTOM API Research for Personalized Property Discovery

**Date:** November 19, 2025
**Purpose:** Design highly personalized property sourcing for FlipOps investors

---

## 🎯 Business Requirements

### Primary Investor Profile (Jacksonville/Orlando/Tampa)
**Investor Type:** Experienced flipper + quick flip specialist
**Key Characteristics:**
- Does distressed/dilapidated properties (heavy rehab)
- Recently pivoted to quick flips (already renovated, fast turnover)
- Works with realtor partner for quick flips
- Frustrated with RedBarn's generic leads (not personalized enough)

### Critical Success Factor
**"Leads must match what the investor actually looks for"**

This is THE differentiator from RedBarn. Each investor should get highly targeted leads based on their specific criteria, not just generic "distressed properties in your market."

---

## 📊 Current User Schema (What We Have)

```prisma
model User {
  // Investment preferences
  targetMarkets   String    // JSON: ["Miami-Dade, FL", "Maricopa, AZ"]
  propertyTypes   String?   // JSON: ["single_family", "multi_family"]
  minScore        Int       @default(70)
  maxBudget       Float?
}
```

**Gap:** This is too generic. We need to capture investor-specific criteria like:
- Distress level preferences (heavy rehab vs turnkey)
- Property condition preferences
- Price ranges
- Equity requirements
- Time horizon (quick flip vs long hold)
- Specific distress indicators they target

---

## 🔍 ATTOM API Capabilities Research

### What We Know Works

#### 1. Sales Snapshot Endpoint ✅
**Endpoint:** `/propertyapi/v1.0.0/sale/snapshot`
**Current Usage:** Fetching properties by postal code

```typescript
GET https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot
  ?postalcode=33139
  &pagesize=10
```

**Returns:**
- Property address & details
- Owner information
- Sale history (lastSaleDate, lastSalePrice)
- Property characteristics (beds, baths, sqft, year built)
- Assessed values
- Geolocation data

**Limitation:** Cannot filter by distress indicators directly in this endpoint

---

### What We Need to Research

#### 2. Property Detail & Expanded Profile Endpoints
**Questions:**
- Can we filter by property condition?
- Can we filter by equity percentage?
- Can we get distress indicators (foreclosure, tax delinquent, vacant)?
- Can we filter by days on market?
- Can we filter by price ranges?

#### 3. ATTOM Foreclosure/Pre-Foreclosure Data
**Questions:**
- Does ATTOM have a foreclosure-specific endpoint?
- Can we get foreclosure stage (pre-foreclosure, auction, REO)?
- Can we get foreclosure dates and timeline?

#### 4. ATTOM Bulk Data vs API
**Options:**
- **API Approach:** Query on-demand per investor (current approach)
- **Bulk Approach:** Download entire county datasets, filter locally
- **Hybrid:** Cache common queries, fetch specific on-demand

#### 5. Filtering Capabilities
**Need to test:**
```
Parameters to research:
- minPrice / maxPrice
- minBeds / maxBeds
- minSqft / maxSqft
- propertyType (SFR, MFR, Condo, etc.)
- saleDate range (recent sales, old sales)
- ownerType (absentee, corporate, individual)
- equity filters
- distress filters
```

---

## 🏗️ Proposed User Preference Schema Extension

### Option 1: Extend User Model with Detailed Preferences

```prisma
model User {
  // Current fields...
  targetMarkets   String    // JSON: ["Miami-Dade, FL"]
  propertyTypes   String?   // JSON: ["single_family", "multi_family"]
  minScore        Int       @default(70)
  maxBudget       Float?

  // NEW: Detailed investment criteria
  investorProfile String?   // JSON with comprehensive criteria
  /*
  Example investorProfile JSON:
  {
    "strategies": ["heavy_rehab", "quick_flip", "wholesale"],
    "preferredCondition": {
      "distressed": true,      // Likes distressed properties
      "turnkey": true,          // Also likes move-in ready
      "minRepairNeeds": 20000,  // Minimum $20k in repairs (sweet spot)
      "maxRepairNeeds": 100000  // Max $100k in repairs
    },
    "priceRanges": [
      { "min": 50000, "max": 200000, "weight": 1.0 },  // Primary range
      { "min": 200000, "max": 350000, "weight": 0.5 }  // Secondary range
    ],
    "equityRequirements": {
      "minEquityPercent": 20,   // At least 20% equity
      "preferredEquityPercent": 40  // Prefer 40%+
    },
    "distressIndicators": {
      "foreclosure": 1.0,       // Weight 1.0 = highest priority
      "preForeclosure": 0.9,
      "taxDelinquent": 0.8,
      "vacant": 0.7,
      "absenteeOwner": 0.6,
      "bankruptcy": 0.5
    },
    "timeHorizon": "quick_flip",  // quick_flip, medium_hold, long_hold
    "partnerPreferences": {
      "hasRealtorPartner": true,  // Works with realtor for listings
      "hasContractorNetwork": true,
      "prefersMLS": false  // Prefers off-market
    },
    "dealBreakers": {
      "noCondos": false,
      "noMobilehomes": true,
      "noCommercial": true,
      "maxYearBuilt": null  // No age restriction
    }
  }
  */
}
```

### Option 2: Separate InvestorProfile Model

```prisma
model InvestorProfile {
  id                String   @id @default(cuid())
  userId            String   @unique

  // Strategy flags
  heavyRehab        Boolean  @default(false)
  quickFlip         Boolean  @default(false)
  wholesale         Boolean  @default(false)
  buyAndHold        Boolean  @default(false)

  // Price preferences
  minPrice          Float?
  maxPrice          Float?
  sweetSpotMin      Float?
  sweetSpotMax      Float?

  // Condition preferences
  prefersDistressed Boolean  @default(false)
  prefersTurnkey    Boolean  @default(false)
  minRepairEstimate Float?
  maxRepairEstimate Float?

  // Equity requirements
  minEquityPercent  Float?   @default(20)

  // Distress weights (0-1)
  foreclosureWeight      Float @default(1.0)
  preForeclosureWeight   Float @default(0.9)
  taxDelinquentWeight    Float @default(0.8)
  vacantWeight           Float @default(0.7)
  absenteeOwnerWeight    Float @default(0.6)

  // Partner ecosystem
  hasRealtorPartner Boolean  @default(false)
  hasContractorTeam Boolean  @default(false)

  // Deal breakers
  excludeCondos     Boolean  @default(false)
  excludeMobileHomes Boolean @default(false)
  excludeCommercial Boolean  @default(false)

  user              User     @relation(fields: [userId], references: [id])
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

**Recommendation:** **Option 1 (JSON field)** for MVP speed, migrate to Option 2 later if needed.

---

## 🔄 Workflow Architecture

### High-Level Flow

```
Scheduled Trigger (Daily 6am per investor timezone)
    ↓
FOR EACH Active User:
    ↓
    1. Fetch User Preferences
       - targetMarkets (counties/zips)
       - investorProfile (detailed criteria)
       - minScore threshold
    ↓
    2. Build ATTOM Query Parameters
       - Convert counties → ZIP codes
       - Apply price filters
       - Apply property type filters
    ↓
    3. Call ATTOM API (per market)
       - Sales Snapshot for general properties
       - Foreclosure endpoint (if available) for distressed
    ↓
    4. Transform & Filter Data
       - ATTOM format → FlipOps format
       - Calculate distress scores
       - Apply investor-specific filters
       - Rank by match score
    ↓
    5. Ingest Top Matches
       - POST to /api/properties/ingest
       - Limit to top 20-50 properties per day
    ↓
    6. Trigger Scoring Pipeline
       - Calculate FlipOps score (0-100)
       - Filter by user's minScore
    ↓
    7. Send Personalized Digest
       - "Found 12 properties matching your criteria"
       - Slack + Email notification
       - Include top 5 with scores
```

---

## 🎯 Personalization Strategy

### Scoring Algorithm

Each property gets a **Match Score (0-100)** based on how well it matches investor criteria:

```typescript
function calculateMatchScore(property, investorProfile) {
  let score = 0;

  // Price match (30 points)
  if (property.price in profile.sweetSpotRange) {
    score += 30;
  } else if (property.price in profile.acceptableRange) {
    score += 15;
  }

  // Distress match (40 points)
  const distressScore =
    (property.foreclosure ? profile.foreclosureWeight * 10 : 0) +
    (property.preForeclosure ? profile.preForeclosureWeight * 10 : 0) +
    (property.taxDelinquent ? profile.taxDelinquentWeight * 8 : 0) +
    (property.vacant ? profile.vacantWeight * 6 : 0) +
    (property.absenteeOwner ? profile.absenteeOwnerWeight * 6 : 0);
  score += Math.min(distressScore, 40);

  // Property type match (15 points)
  if (profile.propertyTypes.includes(property.type)) {
    score += 15;
  }

  // Equity match (15 points)
  const equity = (property.estimatedValue - property.lastSalePrice) / property.estimatedValue;
  if (equity >= profile.preferredEquityPercent) {
    score += 15;
  } else if (equity >= profile.minEquityPercent) {
    score += 8;
  }

  return Math.round(score);
}
```

### Example: Jacksonville Investor Profile

```json
{
  "userId": "test-investor-jacksonville",
  "targetMarkets": ["Duval County, FL", "Orange County, FL", "Hillsborough County, FL"],
  "investorProfile": {
    "strategies": ["heavy_rehab", "quick_flip"],
    "preferredCondition": {
      "distressed": true,
      "turnkey": true,
      "minRepairNeeds": 15000,
      "maxRepairNeeds": 80000
    },
    "priceRanges": [
      { "min": 75000, "max": 250000, "weight": 1.0 }
    ],
    "equityRequirements": {
      "minEquityPercent": 25,
      "preferredEquityPercent": 35
    },
    "distressIndicators": {
      "foreclosure": 1.0,
      "preForeclosure": 0.95,
      "taxDelinquent": 0.85,
      "vacant": 0.9,
      "absenteeOwner": 0.7,
      "bankruptcy": 0.6
    },
    "partnerPreferences": {
      "hasRealtorPartner": true,
      "hasContractorNetwork": true
    }
  }
}
```

---

## 📋 Implementation Plan

### Phase 1: Research & Validation (1 hour)
1. **Test ATTOM API endpoints** for available filters
   - Create script: `scripts/test-attom-filters.ts`
   - Test price filters, property type filters
   - Test for foreclosure/distress data availability
   - Document what's possible vs what requires client-side filtering

2. **Review ATTOM API documentation**
   - Search for all available endpoints
   - Document filter parameters
   - Check rate limits (important for multi-investor platform)

### Phase 2: Schema Extension (30 mins)
1. Add `investorProfile` JSON field to User model
2. Create migration
3. Update seed script to include Jacksonville investor with detailed profile

### Phase 3: Build Discovery Workflow (2-3 hours)
1. Create `scripts/create-attom-discovery-workflow-v2.ts`
2. Implement intelligent filtering based on investor profiles
3. Implement match scoring algorithm
4. Add daily digest generation
5. Test with Jacksonville/Orlando/Tampa markets

### Phase 4: Testing & Refinement (1 hour)
1. Run discovery for test investors
2. Verify personalization works
3. Tune scoring weights
4. Add logging for debugging

---

## 🆚 ATTOM vs BatchData

### ATTOM (Property Discovery)
**Purpose:** Find properties at scale
**Cost:** $500-1k/month (30-day trial active)
**Strengths:**
- Nationwide coverage
- Sales data, owner info, property characteristics
- Good for bulk discovery
- Consistent data quality

**Use Case:** **PRIMARY SOURCE** for property lead generation

### BatchData (Skip Tracing)
**Purpose:** Get owner contact info for specific properties
**Cost:** $0.20 per property
**Strengths:**
- Phone numbers, emails
- Skip tracing data
- Pay-per-use model

**Use Case:** **SECONDARY ENRICHMENT** - Once we identify promising properties via ATTOM, use BatchData to get contact info for outreach

**Workflow Integration:**
```
ATTOM (Discovery) → FlipOps (Scoring) → BatchData (Contact Enrichment) → Outreach
```

---

## 🚀 Next Steps

1. **Research ATTOM capabilities** (30 mins)
   - Test available filters
   - Document limitations

2. **Extend User schema** (15 mins)
   - Add investorProfile field
   - Create migration

3. **Build personalized workflow** (2-3 hours)
   - Implement match scoring
   - Build n8n workflow programmatically

4. **Test with real Florida markets** (30 mins)
   - Jacksonville, Orlando, Tampa
   - Verify lead quality

---

## ❓ Open Questions

1. **ATTOM API Limits:**
   - What's the rate limit per account?
   - Can we batch multiple ZIP codes in one request?
   - Do we need different pricing tiers for 10+ investors?

2. **Data Freshness:**
   - How often does ATTOM update?
   - Should we run discovery daily, weekly, or on-demand?

3. **Client Onboarding:**
   - Quiz-based preference capture?
   - Manual setup call?
   - Pre-defined investor archetypes?

4. **Match Score Validation:**
   - How do we validate that our scoring matches investor expectations?
   - A/B test different scoring weights?
   - Feedback loop for "thumbs up/down" on leads?

---

**Status:** Ready to research ATTOM capabilities and build personalized discovery workflow 🚀
