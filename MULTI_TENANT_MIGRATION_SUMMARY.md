# FlipOps Multi-Tenant SaaS Migration - Session Summary

**Date:** November 18, 2025
**Objective:** Transform FlipOps from single-tenant to multi-tenant SaaS platform

---

## 🎯 Business Context

### The Opportunity
- **Competitor:** RedBarn charges $50k setup + $3k/month ($36k/year)
- **Your Pricing:** $500/month base + usage-based pricing
- **Target Market:** Real estate investors (new and seasoned)
- **Value Prop:** Enterprise software at startup prices with AI automation

### Initial Investors
- **Count:** 2 investors waiting
- **Timeline:** 2-week MVP deadline for beta testing
- **Revenue:** $1,000/month immediate ($500 × 2)
- **Pricing Model:** Base $500/month + tiered by monthly deal volume

### Data Provider Decisions
- ✅ **ATTOM API:** Primary nationwide property discovery (30-day free trial, then ~$500-1k/month)
- ✅ **BatchData:** Already subscribed - using for skip tracing ($0.20/property)
- **API Key (ATTOM):** `72403894efb4b2cfeb4b5b41f105a53a`
- **API Key (BatchData):** `eprRFqavyw9vLUP1bZcoUycLJp6EMJxmmnhUGHDy`

---

## 🏗️ Architecture Changes

### Schema Updates (COMPLETED ✅)

#### New User Model
```prisma
model User {
  id                  String    @id @default(cuid())
  email               String    @unique
  clerkId             String?   @unique
  name                String?
  companyName         String?

  // Investment preferences
  targetMarkets       String    // JSON: ["Miami-Dade, FL", "Maricopa, AZ"]
  propertyTypes       String?   // JSON: ["single_family", "multi_family"]
  minScore            Int       @default(70)
  maxBudget           Float?

  // Notification preferences
  slackWebhook        String?   // User-specific Slack alerts
  emailAlerts         Boolean   @default(true)
  dailyDigest         Boolean   @default(true)
  digestTime          String?   // "08:00"
  timezone            String    @default("America/New_York")

  // Subscription & billing
  tier                String    @default("pro")
  monthlyDeals        Int       @default(0) // Track usage
  subscriptionStatus  String    @default("active")

  // Relations
  properties          Property[]
  deals               DealSpec[]
  policies            Policy[]
  vendors             Vendor[]
}
```

#### Multi-Tenant Fields Added
- **DealSpec:** Added `userId` (required)
- **Property:** Added `userId` (required)
- **Policy:** Added `userId` (optional - null = global default)
- **Vendor:** Added `userId` (optional - null = shared platform vendor)

#### Migration Strategy
- Created default user (`default-user-id`, `system@flipops.com`)
- Assigned all existing data (10 deals, 18 properties) to default user
- Migration file: `20251119064450_add_multi_tenant_support`

---

## 📊 Current Active Workflows (9)

### Guardrails (4)
1. **G1 - Deal Approval Alert** - Monitors P80 > maxExposureUsd
2. **G2 - Bid Spread Alert** - Monitors bid spread > 15% threshold
3. **G3 - Invoice & Budget Guardian** - Monitors budget variance
4. **G4 - Change Order Gatekeeper** - Monitors change order impact

### Monitoring (1)
5. **Pipeline Monitoring** - Tracks stalled deals across all gates

### Discovery (1)
6. **FlipOps - Property Scoring & Alerts** - Google Sheets-based (needs replacement)

### Operations (3)
7. **Contractor Performance Tracking** - On-time/on-budget scoring
8. **FlipOps - Skip Tracing** - BatchData integration for owner contact info
9. **Data Refresh & Sync** - Updates deal/property data

**⚠️ CRITICAL:** All 9 workflows are single-tenant. Need multi-tenant updates.

---

## 🚀 Build Plan (2-Week MVP)

### Week 1: Foundation (Days 1-7)

#### ✅ Day 1-2: Schema (COMPLETED)
- [x] Add User model
- [x] Add userId to DealSpec, Property, Policy, Vendor
- [x] Run migration
- [ ] Create seed data for 2 test investors

#### 📅 Day 3-4: ATTOM Integration
- [ ] Build `/api/properties/ingest` endpoint (accepts ATTOM data)
- [ ] Create ATTOM property search script
- [ ] Build n8n **ATTOM Property Discovery** workflow (multi-tenant)
- [ ] Test with ATTOM API key

#### 📅 Day 5: Property-to-Deal Conversion
- [ ] Build `/api/properties/{id}/convert` endpoint
- [ ] Create n8n **Property-to-Deal Conversion** workflow
- [ ] Auto-populate DealSpec from Property data
- [ ] Estimate maxExposureUsd from ARV

#### 📅 Day 6-7: Daily Digest
- [ ] Build n8n **Daily Property Digest** workflow
- [ ] User-specific scheduling (by timezone)
- [ ] Email/Slack formatting with top properties
- [ ] Group by city/county

---

### Week 2: Polish & Launch (Days 8-14)

#### 📅 Day 8-9: Multi-Tenant Guardrails
- [ ] Update G1 with userId filtering + user-specific policies
- [ ] Update G2 with userId filtering + user-specific thresholds
- [ ] Update G3 with userId filtering
- [ ] Update G4 with userId filtering
- [ ] Route alerts to user's Slack webhook

#### 📅 Day 10-11: User Onboarding
- [ ] Build n8n **User Onboarding** workflow
- [ ] Create setup wizard UI (market selection, preferences)
- [ ] Generate first property search on signup
- [ ] Send welcome email with first 10 properties

#### 📅 Day 12: Data Refresh
- [ ] Build n8n **Data Refresh** workflow (weekly)
- [ ] Update property foreclosure status via ATTOM
- [ ] Mark stale properties as unavailable
- [ ] Re-score properties if distress signals changed

#### 📅 Day 13: Performance Reports
- [ ] Build n8n **Weekly Performance Report** workflow
- [ ] Metrics: new properties, deals created, budget variance, guardrail blocks
- [ ] PDF or HTML email report
- [ ] User-specific data only

#### 📅 Day 14: Testing & Launch
- [ ] Create 2 test investor accounts
- [ ] Test data isolation (Investor A can't see Investor B's data)
- [ ] Verify all alerts go to correct user
- [ ] Deploy to production (no more ngrok)
- [ ] Onboarding documentation

---

## 🔧 New Workflows Needed

### Priority 1: Core Discovery
1. **ATTOM Property Discovery** (Multi-Tenant)
   - Schedule: Daily 6am (per user timezone)
   - For each active user:
     - Fetch their targetMarkets
     - Call ATTOM API with filters (foreclosure, tax delinquent, etc.)
     - POST to `/api/properties/ingest` with userId
     - Trigger scoring
     - Send daily digest

2. **Property-to-Deal Conversion**
   - Trigger: Webhook from UI ("Analyze Deal" button)
   - Fetch property details
   - Create DealSpec with pre-filled data
   - Generate scope tree from cost models
   - Send "Deal created" notification

3. **Daily Property Digest**
   - Schedule: Per user's digestTime (default 8am)
   - Fetch new properties (last 24 hours, score ≥ minScore)
   - Group by city/county
   - Format email/Slack with top 5-10
   - Include: address, score, distress signals, estimated profit

### Priority 2: Operations
4. **User Onboarding**
   - Trigger: Webhook (new user signs up)
   - Create user record
   - Send welcome email with setup wizard link
   - Wait for market selection callback
   - Run first ATTOM search
   - Send "Your first 10 properties are ready!" email

5. **Weekly Performance Report**
   - Schedule: Every Monday 9am
   - Calculate metrics for last 7 days
   - Generate PDF/HTML report
   - Email to user

6. **Data Refresh**
   - Schedule: Weekly, Saturday midnight
   - Update property status via ATTOM
   - Mark stale properties
   - Re-score changed properties

---

## 🔗 Current n8n URLs

- **n8n Dashboard:** https://primary-production-8b46.up.railway.app
- **n8n API Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w`
- **Current ngrok URL:** https://d740f7483316.ngrok-free.app
- **Slack Webhook:** https://hooks.slack.com/services/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

---

## 📝 API Endpoints Status

### Existing (Single-Tenant)
- ✅ `/api/deals/approve` - G1 endpoint
- ✅ `/api/deals/approve/status` - G1 monitoring
- ✅ `/api/deals/stalled` - Pipeline monitoring
- ✅ `/api/bids/award` - G2 endpoint
- ✅ `/api/bids/award/status` - G2 monitoring
- ✅ `/api/properties/score` - Property scoring

### Need to Build (Multi-Tenant)
- [ ] `/api/properties/ingest` - Bulk property ingest from ATTOM
- [ ] `/api/properties/{id}/convert` - Convert property to deal
- [ ] `/api/users` - User management (CRUD)
- [ ] `/api/users/{id}/preferences` - User preferences
- [ ] `/api/users/{id}/properties` - User's properties
- [ ] `/api/users/{id}/deals` - User's deals

### Need to Update (Add userId Filtering)
- [ ] All existing endpoints must filter by userId from auth token

---

## 🎓 Key Learning: Why This Matters

### What You're Building
**"Redfin for Fix-and-Flip Investors"** - Complete platform from property discovery → deal analysis → construction management → exit

### Market Position
- **RedBarn:** $50k setup + $3k/month (enterprise, less features)
- **FlipOps:** $500/month base (disruptor pricing, more features, AI-powered)
- **DealMachine/REIPro:** $100-500/month (lower tier, missing deal management)

### Competitive Advantages
1. **AI Automation:** G1-G4 guardrails (RedBarn doesn't have this)
2. **Nationwide Coverage:** ATTOM API (consistent data everywhere)
3. **Integrated Skip Tracing:** BatchData built-in
4. **Construction Management:** Cost models, bid comparison, change order tracking
5. **White-Glove Onboarding:** $500/month justifies personalized setup

---

## 💰 Revenue Model

### Pricing Tiers
- **Base:** $500/month (includes 5 deals/month)
- **Growth:** $1,000/month (includes 15 deals/month)
- **Enterprise:** $2,500/month (unlimited deals, custom features)

### Break-Even Analysis
- **ATTOM Cost:** ~$500-1,000/month
- **Break-even:** 2-3 customers
- **Current:** 2 customers waiting = profitable Day 1

### Cost Structure (Per Month)
- ATTOM API: $500-1,000
- BatchData: Already covered
- n8n (Railway): $20
- Hosting (Vercel): Free tier
- **Total:** ~$520-1,020/month
- **Revenue (2 customers):** $1,000/month
- **Profit:** Break-even immediately, profitable at customer 3

---

## 🚨 Critical Next Steps

### Immediate (Today)
1. ✅ Schema migration complete
2. [ ] Create 2 test investor user accounts
3. [ ] Build `/api/properties/ingest` endpoint
4. [ ] Test ATTOM API key

### This Week
1. [ ] Build ATTOM Property Discovery workflow
2. [ ] Build Property-to-Deal Conversion workflow
3. [ ] Build Daily Property Digest workflow
4. [ ] Update G1-G4 for multi-tenant

### Next Week
1. [ ] User Onboarding workflow
2. [ ] Weekly Performance Report workflow
3. [ ] Data Refresh workflow
4. [ ] Deploy to production domain (no more ngrok)
5. [ ] Onboard 2 test investors

---

## 📚 Important Files

### Schema
- `prisma/schema.prisma` - Database schema (NOW MULTI-TENANT)
- `prisma/migrations/20251119064450_add_multi_tenant_support/` - Migration

### Scripts
- `scripts/audit-current-workflows.ts` - Workflow inventory tool
- `scripts/test-attom-api.ts` - ATTOM API testing
- `scripts/setup-batchdata-credential.ts` - BatchData n8n credentials

### Documentation
- `SKIP-TRACING-READY.md` - BatchData skip tracing docs
- `n8n-workflows/BATCHDATA-CONFIG.md` - BatchData configuration

---

## 🔐 Environment Variables Needed

```env
# Database
DATABASE_URL="file:./dev.db"

# ATTOM API
ATTOM_API_KEY="72403894efb4b2cfeb4b5b41f105a53a"

# BatchData
BATCHDATA_API_KEY="eprRFqavyw9vLUP1bZcoUycLJp6EMJxmmnhUGHDy"

# n8n
N8N_API_URL="https://primary-production-8b46.up.railway.app/api/v1"
N8N_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Slack
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/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"

# Clerk (Auth)
CLERK_SECRET_KEY="your-clerk-secret-key"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
```

---

## 🎯 Success Metrics (2-Week MVP)

### Technical
- [ ] User model implemented
- [ ] All data isolated by userId
- [ ] ATTOM integration working
- [ ] 6 new workflows built
- [ ] 9 existing workflows updated
- [ ] 2 test investors onboarded
- [ ] Data isolation verified

### Business
- [ ] $1,000/month revenue (2 × $500)
- [ ] Automated property discovery running
- [ ] Daily digests sending
- [ ] Guardrails protecting deals
- [ ] No manual intervention needed

---

## 📞 Contact & Support

- **ATTOM Support:** https://api.developer.attomdata.com/docs
- **BatchData Support:** https://batchdata.com
- **n8n Docs:** https://docs.n8n.io
- **Prisma Docs:** https://www.prisma.io/docs

---

**Last Updated:** November 18, 2025
**Next Review:** After Day 7 (end of Week 1)
**Status:** ✅ Schema Complete | 🚧 Building ATTOM Integration
