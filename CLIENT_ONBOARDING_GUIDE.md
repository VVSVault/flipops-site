# FlipOps Client Onboarding Guide

**Last Updated:** November 19, 2025
**Purpose:** Step-by-step guide for onboarding new clients to FlipOps workflows

---

## Overview

FlipOps uses automated n8n workflows to provide personalized property leads, deal management, and contractor tracking for real estate investors. This guide covers everything needed to onboard a new client.

---

## Prerequisites

Before onboarding a client, ensure you have:

- [ ] Client's email address
- [ ] Client's name
- [ ] Client's Slack webhook URL (optional, for notifications)
- [ ] Client's target markets (as ZIP codes)
- [ ] Client's investor profile information
- [ ] Access to FlipOps database

---

## Step 1: Collect Client Information

During the intake call or form submission, collect the following:

### Basic Information
- **Full Name:** Required for personalized notifications
- **Email:** Primary contact and account identifier
- **Phone:** Optional, for urgent notifications

### Target Markets
**IMPORTANT:** Collect target markets as **ZIP codes**, not counties or cities.

**Example Questions:**
- "What ZIP codes do you want to focus on for property leads?"
- "Which areas are you actively investing in? (Please provide ZIP codes)"

**Format:** Array of ZIP code strings
```json
["32202", "32204", "32205", "33125", "33126"]
```

**Tips:**
- If client provides counties/cities, help them convert to ZIP codes
- Recommend 10-20 ZIP codes for optimal daily lead volume
- ZIP codes can be updated later as their strategy evolves

### Investor Profile

Collect detailed preferences to personalize their property matching:

#### 1. Investment Strategies (select all that apply)
- [ ] Heavy Rehab (distressed properties needing major work)
- [ ] Quick Flip (already renovated, fast turnover)
- [ ] Wholesale (find deals, assign contracts)
- [ ] Buy & Hold (rental properties)

#### 2. Price Ranges
**Primary Range:** Min $_____ to Max $_____
**Secondary Range (optional):** Min $_____ to Max $_____

**Example:**
```json
{
  "priceRanges": [
    { "min": 75000, "max": 250000, "weight": 1.0, "label": "Primary" },
    { "min": 250000, "max": 400000, "weight": 0.5, "label": "Secondary" }
  ]
}
```

#### 3. Distress Indicator Preferences (0.0 to 1.0 weights)
**Question:** "How important are these factors when evaluating properties?"

- **Foreclosure:** _____ (1.0 = highest priority, 0 = ignore)
- **Pre-Foreclosure:** _____
- **Tax Delinquent:** _____
- **Vacant Properties:** _____
- **Absentee Owner:** _____
- **Bankruptcy:** _____

**Default weights if client is unsure:**
```json
{
  "distressIndicators": {
    "foreclosure": 1.0,
    "preForeclosure": 0.9,
    "taxDelinquent": 0.85,
    "vacant": 0.9,
    "absenteeOwner": 0.7,
    "bankruptcy": 0.6
  }
}
```

#### 4. Property Characteristics
- **Bedrooms:** Min ___ to Max ___
- **Bathrooms:** Min ___ to Max ___
- **Square Feet:** Min _____ to Max _____
- **Year Built:** Min ____ to Max ____

**Example:**
```json
{
  "preferredCharacteristics": {
    "beds": { "min": 2, "max": 5 },
    "baths": { "min": 1, "max": 3 },
    "sqft": { "min": 1000, "max": 3000 },
    "yearBuilt": { "min": 1950, "max": 2024 }
  }
}
```

#### 5. Equity Requirements
- **Minimum Equity Percentage:** ___% (default: 20%)
- **Preferred Equity Percentage:** ___% (default: 40%)

#### 6. Lead Preferences
- **Daily Max Leads:** ___ (default: 20)
- **Minimum Match Score:** ___ (default: 65)

#### 7. Partner Ecosystem
- [ ] Has Realtor Partner (works with agent for MLS listings)
- [ ] Has Contractor Network (established rehab team)
- [ ] Prefers Off-Market Deals

#### 8. Deal Breakers
- [ ] No Mobile Homes
- [ ] No Condos
- [ ] No Commercial Properties
- [ ] Maximum HOA Fees: $_____

---

## Step 2: Create User in Database

Use the FlipOps admin panel or run this SQL:

```sql
INSERT INTO "User" (
  id,
  email,
  name,
  onboarded,
  "targetMarkets",
  "investorProfile",
  "minScore",
  tier,
  "subscriptionStatus",
  "createdAt",
  "updatedAt"
)
VALUES (
  'client-unique-id', -- Generate with: crypto.randomUUID()
  'client@example.com',
  'Client Name',
  true, -- Set to true to activate workflows
  '["32202", "32204", "32205"]', -- Target markets as JSON string
  '{
    "targetZipCodes": ["32202", "32204", "32205", "33125", "33126"],
    "strategies": ["heavy_rehab", "quick_flip"],
    "priceRanges": [
      { "min": 75000, "max": 250000, "weight": 1.0, "label": "Primary" }
    ],
    "distressIndicators": {
      "foreclosure": 1.0,
      "preForeclosure": 0.9,
      "taxDelinquent": 0.85,
      "vacant": 0.9,
      "absenteeOwner": 0.7,
      "bankruptcy": 0.6
    },
    "equityRequirements": {
      "minEquityPercent": 20,
      "preferredEquityPercent": 40
    },
    "preferredCharacteristics": {
      "beds": { "min": 2, "max": 5 },
      "baths": { "min": 1, "max": 3 },
      "sqft": { "min": 1000, "max": 3000 },
      "yearBuilt": { "min": 1950, "max": 2024 }
    },
    "partnerPreferences": {
      "hasRealtorPartner": true,
      "hasContractorNetwork": true,
      "prefersMLS": false
    },
    "dealBreakers": {
      "noMobileHomes": true,
      "noCondos": false,
      "noCommercial": true,
      "maxHOAFees": 200
    },
    "leadPreferences": {
      "dailyMaxLeads": 20,
      "minMatchScore": 65
    }
  }', -- Full investor profile as JSON string
  65, -- Minimum match score
  'pro', -- Tier: free, pro, enterprise
  'active', -- Subscription status
  NOW(),
  NOW()
);
```

---

## Step 3: Verify Workflow Configuration

All workflows are **already configured** and will automatically process new clients.

### Active Workflows:

#### 1. ATTOM Property Discovery
**What it does:** Daily property lead generation based on investor profile
**When:** Runs daily at 6am
**Requirements:** User must have `investorProfile.targetZipCodes` set
**URL:** https://primary-production-8b46.up.railway.app/workflow/aIB67joSAh1vT5Sb

#### 2. Skip Tracing & Enrichment
**What it does:** Gets owner contact info for properties
**When:** Runs weekly
**Cost:** $0.20 per property
**URL:** https://primary-production-8b46.up.railway.app/workflow/qAfOjkKjQU9V4Mb4

#### 3. G1-G4 Guardrails
**What they do:** Alert on deal approval, bid spread, budget variance, change orders
**When:** Run every 4 hours
**Purpose:** Risk management and compliance

#### 4. Pipeline Monitoring
**What it does:** Alerts on stalled deals
**When:** Runs daily

#### 5. Contractor Performance Tracking
**What it does:** Updates contractor reliability scores
**When:** Runs weekly

#### 6. Data Refresh & Sync
**What it does:** Refreshes active deal data
**When:** Runs daily

**No workflow changes needed!** Simply add the client to the database and workflows will pick them up automatically.

---

## Step 4: Test Client Setup

### 4.1 Verify User in Database
```bash
curl https://bb4c35d48e9c.ngrok-free.app/api/users \
  -H "x-api-key: fo_live_10177805c8d743e1a6e1860515dc2b3f" \
  -H "ngrok-skip-browser-warning: true"
```

**Expected:** User appears in response with all fields populated

### 4.2 Manually Run ATTOM Workflow
1. Go to n8n: https://primary-production-8b46.up.railway.app
2. Open "ATTOM Property Discovery" workflow
3. Click "Execute Workflow" button
4. Wait for execution to complete
5. Check execution log:
   - User should be filtered and processed
   - ZIP codes should be loaded from `investorProfile.targetZipCodes`
   - Properties should be fetched and scored
   - Qualified properties should be ingested

### 4.3 Verify Properties Ingested
```bash
# Check properties for this user
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Property\" WHERE \"userId\" = 'client-unique-id';"
```

**Expected:** Properties appear in database with scores

### 4.4 Test Slack Notification (if configured)
If client provided Slack webhook, verify notification was sent with top 5 properties.

---

## Step 5: Client Communication

### Welcome Email Template

```
Subject: Welcome to FlipOps - Your Property Discovery is Active!

Hi [Client Name],

Welcome to FlipOps! Your account is now active and our automated workflows are working for you.

Here's what's happening:

📍 Target Markets: [List their ZIP codes]
🏘️ Property Discovery: Running daily at 6am EST
📊 Match Score Threshold: [Their minScore]
📬 Daily Lead Limit: [Their dailyMaxLeads] properties

What to Expect:

1. **Daily Property Leads** - You'll receive personalized property leads that match your criteria every morning. We're looking for properties with your preferred price range, distress indicators, and characteristics.

2. **Skip Tracing** - Contact information (phone/email) will be automatically enriched for high-value properties.

3. **Deal Management** - Once you start working deals, our G1-G4 guardrails will alert you to any risks or issues.

Your Property Criteria:
- Price Range: $[min] - $[max]
- Focus: [Their strategies]
- Equity Target: [Their equity %]
- Key Indicators: [Top 3 distress indicators]

Dashboard: https://flipops.com/dashboard
Support: support@flipops.com

Questions? Just reply to this email!

Best,
FlipOps Team
```

---

## Step 6: Ongoing Management

### Updating Client Preferences

Clients can update their preferences at any time. Simply update the `investorProfile` JSON field in the database:

```sql
UPDATE "User"
SET "investorProfile" = '{
  "targetZipCodes": ["new", "zip", "codes"],
  -- ... rest of profile
}'
WHERE id = 'client-unique-id';
```

**No workflow changes needed!** Updates take effect on next workflow run.

### Monitoring Client Activity

#### Daily Property Ingestion
```sql
SELECT
  DATE("createdAt") as date,
  COUNT(*) as properties_added
FROM "Property"
WHERE "userId" = 'client-unique-id'
  AND "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY DATE("createdAt")
ORDER BY date DESC;
```

#### Average Match Scores
```sql
SELECT AVG(score) as avg_score
FROM "Property"
WHERE "userId" = 'client-unique-id'
  AND score IS NOT NULL;
```

#### Skip Trace Coverage
```sql
SELECT
  COUNT(*) as total_properties,
  SUM(CASE WHEN enriched = true THEN 1 ELSE 0 END) as enriched,
  ROUND(100.0 * SUM(CASE WHEN enriched = true THEN 1 ELSE 0 END) / COUNT(*), 2) as enrichment_pct
FROM "Property"
WHERE "userId" = 'client-unique-id';
```

---

## Troubleshooting

### Issue: Client not receiving properties

**Check:**
1. `onboarded = true` in database
2. `investorProfile.targetZipCodes` is populated and valid
3. `minScore` is not too high (try lowering to 50 for testing)
4. Workflow execution log shows user being processed

**Fix:**
```sql
UPDATE "User"
SET onboarded = true,
    "minScore" = 50
WHERE id = 'client-unique-id';
```

### Issue: All properties scoring too low

**Check:**
- Client's `distressIndicators` weights might be too strict
- ATTOM data might not have distress info for their markets
- Price ranges might be too narrow

**Fix:** Adjust scoring weights or expand price ranges

### Issue: Too many properties daily

**Check:**
- `leadPreferences.dailyMaxLeads` value
- `minScore` threshold

**Fix:**
```sql
-- Update to reduce daily leads
UPDATE "User"
SET "investorProfile" = jsonb_set(
  "investorProfile"::jsonb,
  '{leadPreferences,dailyMaxLeads}',
  '10'
)
WHERE id = 'client-unique-id';
```

---

## InvestorProfile JSON Schema Reference

Complete schema for `investorProfile` field:

```typescript
{
  // REQUIRED: Target ZIP codes for property discovery
  "targetZipCodes": string[], // e.g., ["32202", "32204"]

  // Investment strategies (array of strings)
  "strategies": ("heavy_rehab" | "quick_flip" | "wholesale" | "buy_and_hold")[],

  // Price ranges with weights
  "priceRanges": [
    {
      "min": number,
      "max": number,
      "weight": number, // 0.0 to 1.0
      "label": string
    }
  ],

  // Distress indicator importance (0.0 to 1.0)
  "distressIndicators": {
    "foreclosure": number,
    "preForeclosure": number,
    "taxDelinquent": number,
    "vacant": number,
    "absenteeOwner": number,
    "bankruptcy": number
  },

  // Equity requirements
  "equityRequirements": {
    "minEquityPercent": number,
    "preferredEquityPercent": number
  },

  // Property characteristics
  "preferredCharacteristics": {
    "beds": { "min": number, "max": number },
    "baths": { "min": number, "max": number },
    "sqft": { "min": number, "max": number },
    "yearBuilt": { "min": number, "max": number }
  },

  // Partner ecosystem
  "partnerPreferences": {
    "hasRealtorPartner": boolean,
    "hasContractorNetwork": boolean,
    "prefersMLS": boolean
  },

  // Deal breakers
  "dealBreakers": {
    "noMobileHomes": boolean,
    "noCondos": boolean,
    "noCommercial": boolean,
    "maxHOAFees": number | null
  },

  // Lead preferences
  "leadPreferences": {
    "dailyMaxLeads": number,
    "minMatchScore": number
  }
}
```

---

## Quick Reference: Client Onboarding Checklist

- [ ] Collect basic info (name, email, phone)
- [ ] **Collect target ZIP codes** (10-20 recommended)
- [ ] Collect investor profile (strategies, price ranges, preferences)
- [ ] Create user in database with full `investorProfile`
- [ ] Verify `onboarded = true`
- [ ] Test ATTOM workflow manually
- [ ] Verify properties ingested
- [ ] Send welcome email
- [ ] Schedule 1-week check-in call

---

## Support Resources

**n8n Workflows:** https://primary-production-8b46.up.railway.app/workflows
**FlipOps API:** https://bb4c35d48e9c.ngrok-free.app
**Documentation:** See `APIs-and-Credentials.md`
**Workflow Build Script:** `scripts/build-all-workflows.ts`

---

**Last Updated:** November 19, 2025
**Version:** 1.0
**Maintained By:** FlipOps Engineering
