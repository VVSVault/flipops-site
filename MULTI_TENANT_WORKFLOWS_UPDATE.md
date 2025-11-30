# Multi-Tenant Workflow Migration - Complete Update Guide

**Date:** November 20, 2025
**Status:** ✅ ALL WORKFLOWS UPDATED
**Migration:** Single-Tenant → Multi-Tenant SaaS

---

## 🎯 Executive Summary

Successfully migrated all 7 operational n8n workflows from single-tenant to multi-tenant architecture. Each workflow now:
- Fetches all active users from `/api/users?status=active`
- Loops through users individually
- Filters data by `userId` for complete isolation
- Routes alerts to user-specific Slack webhooks

**Total Workflows Updated:** 7
**API Endpoints Updated:** 7
**Schema Changes:** Complete (userId added to all relevant tables)

---

## 📊 Workflows Updated

### 🛡️ Guardrails (4 workflows)

#### 1. G1 - Deal Approval Alert
**Workflow ID:** `bMguRTKgOG4fFMU2`
**Purpose:** Monitor deals where P80 exceeds max exposure
**Node Count:** 5 → 7 nodes (added user loop)

**Changes:**
- ✅ Added "Fetch Active Users" node
- ✅ Added "Loop Through Users" node
- ✅ Updated API call to `/api/deals/approve/status?userId={userId}`
- ✅ Changed Slack webhook to user-specific: `={{ $("Loop Through Users").item.json.slackWebhook }}`
- ✅ Added user context to Slack message (name, company)

**New Flow:**
```
Schedule Trigger → Fetch Active Users → Loop Through Users →
Fetch G1 Status (with userId) → Check If Any Blocked →
Format Slack Alert (with user context) → Send to User's Slack
```

---

#### 2. G2 - Bid Spread Alert
**Workflow ID:** `8hXMk1O6SlCjbOhs`
**Purpose:** Monitor deals where bid spread exceeds 15%
**Node Count:** 5 → 7 nodes

**Changes:**
- ✅ Added user iteration loop
- ✅ Updated API call to `/api/deals/bid-spread/status?userId={userId}`
- ✅ User-specific Slack routing
- ✅ User context in alerts

---

#### 3. G3 - Invoice & Budget Guardian
**Workflow ID:** `vvqi4QEb16A2jHbo`
**Purpose:** Monitor budget variance exceeding 10%
**Node Count:** 5 → 7 nodes

**Changes:**
- ✅ Added user iteration loop
- ✅ Updated API call to `/api/deals/budget-variance/status?userId={userId}`
- ✅ User-specific Slack routing
- ✅ User context in alerts

---

#### 4. G4 - Change Order Gatekeeper
**Workflow ID:** `WXEtnLHedF2AVFAK`
**Purpose:** Monitor pending change order approvals
**Node Count:** 5 → 7 nodes

**Changes:**
- ✅ Added user iteration loop
- ✅ Updated API call to `/api/deals/change-orders/status?userId={userId}`
- ✅ User-specific Slack routing
- ✅ User context in alerts

---

### 📊 Monitoring (2 workflows)

#### 5. Pipeline Monitoring
**Workflow ID:** `JiBPkO0jlvlCZfjT`
**Purpose:** Track stalled deals across all gates
**Node Count:** 5 → 7 nodes

**Changes:**
- ✅ Added user iteration loop
- ✅ Updated API call to `/api/deals/stalled?userId={userId}`
- ✅ User-specific Slack routing
- ✅ Filters deals by all 4 gates (G1-G4) per user

---

#### 6. Contractor Performance Tracking
**Workflow ID:** `UlVCiQTkNNm5kvAL`
**Purpose:** Track contractor on-time/on-budget performance
**Node Count:** 6 → 8 nodes

**Changes:**
- ✅ Added user iteration loop
- ✅ Updated API call to `/api/contractors/performance?userId={userId}`
- ✅ User-specific Slack routing
- ✅ Filters vendors by userId

---

### ⚙️ Operations (1 workflow)

#### 7. Data Refresh & Sync
**Workflow ID:** `TwWfbKedznM8gPjr`
**Purpose:** Refresh deal data weekly
**Node Count:** 6 → 8 nodes

**Changes:**
- ✅ Added user iteration loop
- ✅ Updated API call to `/api/deals/active?userId={userId}`
- ✅ User-specific Slack routing
- ✅ Only refreshes deals owned by each user

---

## 🔧 API Endpoints Updated

All endpoints now **require** `userId` query parameter and filter all data by user ownership.

### 1. `/api/users`
**Changes:**
- ✅ Added `status` query param to filter active users
- ✅ Added `companyName` to response
- ✅ Returns all fields needed by workflows (slackWebhook, preferences, etc.)

**Usage:** `GET /api/users?status=active`

---

### 2. `/api/deals/approve/status` (G1)
**Changes:**
- ✅ Requires `userId` query param (400 if missing)
- ✅ Filters `DealSpec` by `userId`
- ✅ Only returns blocked deals for that user

**Usage:** `GET /api/deals/approve/status?userId=cuid123`

---

### 3. `/api/deals/bid-spread/status` (G2)
**Changes:**
- ✅ Requires `userId` query param
- ✅ Filters `DealSpec` by `userId`
- ✅ Only calculates bid spreads for user's deals

**Usage:** `GET /api/deals/bid-spread/status?userId=cuid123`

---

### 4. `/api/deals/budget-variance/status` (G3)
**Changes:**
- ✅ Requires `userId` query param
- ✅ Filters `DealSpec` by `userId`
- ✅ Only checks budget variance for user's deals

**Usage:** `GET /api/deals/budget-variance/status?userId=cuid123`

---

### 5. `/api/deals/change-orders/status` (G4)
**Changes:**
- ✅ Requires `userId` query param
- ✅ Filters `ChangeOrder` by `deal.userId`
- ✅ Only returns change orders for user's deals

**Usage:** `GET /api/deals/change-orders/status?userId=cuid123`

---

### 6. `/api/deals/stalled` (Pipeline)
**Changes:**
- ✅ Requires `userId` query param
- ✅ Filters all queries (DealSpec, Bid, Invoice, ChangeOrder) by userId
- ✅ Monitors stalled items across G1-G4 per user

**Usage:** `GET /api/deals/stalled?userId=cuid123`

---

### 7. `/api/deals/active` (Data Refresh)
**Changes:**
- ✅ Requires `userId` query param
- ✅ Filters `DealSpec` by `userId`
- ✅ Only returns active deals for that user

**Usage:** `GET /api/deals/active?userId=cuid123`

---

### 8. `/api/contractors/performance`
**Changes:**
- ✅ Requires `userId` query param
- ✅ Filters `Vendor` by `userId`
- ✅ Only shows performance for user's contractors

**Usage:** `GET /api/contractors/performance?userId=cuid123`

---

## 🏗️ Technical Architecture

### Multi-Tenant Workflow Pattern

All workflows now follow this standard pattern:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Schedule Trigger (cron)                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ 2. Fetch Active Users                                        │
│    GET /api/users?status=active                              │
│    Returns: [{ id, email, name, companyName, slackWebhook }] │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ 3. Loop Through Users (Split In Batches)                     │
│    Processes one user at a time                              │
│    Passes user object to next node                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ 4. Fetch User's Data                                         │
│    GET /api/endpoint?userId={{ $json.id }}                   │
│    Returns data filtered by userId                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ 5. Check Conditions                                          │
│    IF node - check if violations/alerts exist                │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ 6. Format Slack Message (Code Node)                          │
│    Access user: $("Loop Through Users").item.json            │
│    Include user name/company in message                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ 7. Send to User's Slack                                      │
│    URL: {{ $("Loop Through Users").item.json.slackWebhook }} │
│    Each user gets their own notification                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### User Model (Complete)
```prisma
model User {
  id                  String    @id @default(cuid())
  email               String    @unique
  clerkId             String?   @unique
  name                String?
  companyName         String?

  // Investment preferences
  targetMarkets       String    // JSON
  propertyTypes       String?   // JSON
  minScore            Int       @default(70)
  maxBudget           Float?

  // Notification preferences
  slackWebhook        String?   // User-specific Slack webhook
  emailAlerts         Boolean   @default(true)
  dailyDigest         Boolean   @default(true)
  digestTime          String?
  timezone            String    @default("America/New_York")

  // Subscription
  tier                String    @default("pro")
  subscriptionStatus  String    @default("active")

  // Relations
  properties          Property[]
  deals               DealSpec[]
  vendors             Vendor[]
}
```

### Multi-Tenant Fields Added
- `DealSpec.userId` (required)
- `Property.userId` (required)
- `Vendor.userId` (optional - null = shared platform vendor)

---

## 🔐 Data Isolation Strategy

### Query-Level Isolation
All Prisma queries now filter by `userId`:

```typescript
// Before (single-tenant)
const deals = await prisma.dealSpec.findMany({
  where: {
    createdAt: { gte: lastWeek }
  }
});

// After (multi-tenant)
const deals = await prisma.dealSpec.findMany({
  where: {
    userId,  // Filter by user
    createdAt: { gte: lastWeek }
  }
});
```

### Relationship Isolation
For related entities without direct `userId`:

```typescript
// Change orders filtered by deal ownership
const changeOrders = await prisma.changeOrder.findMany({
  where: {
    deal: { userId }  // Filter through relationship
  }
});
```

---

## 🧪 Testing Plan

### 1. Create Test Users

```bash
# Via Prisma Studio or seed script
User 1:
  - email: investor1@test.com
  - name: "Investor A"
  - companyName: "ABC Properties"
  - slackWebhook: "<unique-webhook-1>"
  - subscriptionStatus: "active"

User 2:
  - email: investor2@test.com
  - name: "Investor B"
  - companyName: "XYZ Investments"
  - slackWebhook: "<unique-webhook-2>"
  - subscriptionStatus: "active"
```

### 2. Create Test Data

```bash
# Assign deals/properties to each user
Deal 1: userId = User 1 ID, address = "123 Main St"
Deal 2: userId = User 2 ID, address = "456 Oak Ave"
Property 1: userId = User 1 ID
Property 2: userId = User 2 ID
```

### 3. Test Endpoints Directly

```bash
# Test User 1 isolation
curl http://localhost:3007/api/deals/approve/status?userId=<user1-id>
# Should return only User 1's deals

# Test User 2 isolation
curl http://localhost:3007/api/deals/approve/status?userId=<user2-id>
# Should return only User 2's deals

# Test missing userId (should fail with 400)
curl http://localhost:3007/api/deals/approve/status
# Should return: { "error": "userId parameter is required" }
```

### 4. Test Workflows in n8n

1. Open each workflow in n8n editor
2. Click "Execute Workflow" button
3. Verify:
   - ✅ Fetches both test users
   - ✅ Processes each user separately
   - ✅ Sends 2 separate Slack messages (one per user)
   - ✅ Each message contains only that user's data
   - ✅ User name/company appears in message header

### 5. Verify Data Isolation

```bash
# Create a G1 violation for User 1
# Run G1 workflow
# Verify:
# - User 1 receives alert in their Slack
# - User 2 does NOT receive alert
# - Alert shows User 1's name and deal
```

---

## 📝 Migration Scripts Created

### Workflow Updates
- **`update-all-workflows-multi-tenant.ts`** - Programmatically updated all 7 workflows
  - Added "Fetch Active Users" node
  - Added "Loop Through Users" node
  - Updated API URLs (ngrok → localhost:3007)
  - Added userId query params
  - Changed Slack webhooks to user-specific

### API Updates
- **`update-api-endpoints-userid.ts`** - Added userId filtering to all endpoints
  - Extracts `userId` from query params
  - Validates userId (400 if missing)
  - Adds userId to all Prisma `where` clauses

### Audit Tools
- **`audit-all-workflows-detailed.ts`** - Comprehensive workflow audit
  - Lists all nodes in each workflow
  - Identifies API endpoints
  - Flags multi-tenant issues

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [x] Schema migration complete (userId added to all tables)
- [x] All 7 workflows updated in n8n
- [x] All 7 API endpoints updated
- [x] `/api/users` endpoint supports status filtering
- [ ] Create 2 test user accounts
- [ ] Assign test data to each user
- [ ] Test all workflows with test users
- [ ] Verify data isolation (User A can't see User B's data)

### Post-Deployment
- [ ] Update environment variables (remove ngrok URL)
- [ ] Update production API URL in workflows
- [ ] Activate workflows one by one
- [ ] Monitor Slack for alerts
- [ ] Verify each workflow executes successfully
- [ ] Check logs for errors

### Production Cutover
- [ ] Onboard first real investor
- [ ] Import their existing deals/properties
- [ ] Configure their Slack webhook
- [ ] Activate workflows for production
- [ ] Monitor for 24 hours
- [ ] Onboard second investor
- [ ] Verify complete data isolation

---

## 🐛 Known Issues & Limitations

### URL Configuration
- **Current:** Workflows point to `localhost:3007`
- **Production:** Need to update to actual production domain
- **Fix:** Update `PROD_API_URL` in each workflow

### Slack Webhooks
- **Current:** All use single test webhook
- **Production:** Each user needs their own webhook
- **Fix:** Users must provide webhook during onboarding

### Schedule Triggers
- **Current:** All workflows run on fixed schedules
- **Future:** Consider per-user scheduling (e.g., daily digest at user's preferred time)

---

## 📊 Performance Considerations

### Workflow Execution Time
- **Single-Tenant:** O(1) - fetch all data once
- **Multi-Tenant:** O(n) - loop through n users

**Example:**
- 10 users: ~30 seconds total (3 seconds per user)
- 100 users: ~5 minutes total
- 1000 users: ~50 minutes (may need batching)

### Optimization Strategies
1. **Parallel Processing:** Run multiple user loops in parallel (n8n Enterprise)
2. **Batching:** Process users in groups (e.g., 100 at a time)
3. **Conditional Execution:** Only notify users with active violations
4. **Caching:** Cache user list for 1 hour, refresh periodically

---

## 🎓 Learning & Best Practices

### What Worked Well
1. **Programmatic Updates:** Using TypeScript scripts to update 7 workflows > 7 saved hours
2. **Standard Pattern:** All workflows follow same structure - easy to maintain
3. **Query-Level Isolation:** Adding userId to Prisma queries is clean and secure
4. **User Loop:** n8n's "Split In Batches" node perfect for multi-tenant iteration

### Lessons Learned
1. **n8n API Quirks:** `active` field is read-only - don't send in updates
2. **URL Management:** Hardcoding URLs in workflows makes updates tedious
3. **Testing Early:** Should create test users BEFORE updating workflows
4. **Documentation:** Comprehensive docs (like this) crucial for future updates

---

## 📞 Support & Troubleshooting

### Common Errors

#### "userId parameter is required"
**Cause:** Workflow not passing userId to API endpoint
**Fix:** Verify "Loop Through Users" node is connected and passing `{{ $json.id }}`

#### "Invalid Slack webhook"
**Cause:** User's slackWebhook field is null or invalid
**Fix:** Update user record with valid webhook URL

#### "No users found"
**Cause:** `/api/users?status=active` returns empty array
**Fix:** Create user with `subscriptionStatus = "active"`

#### Workflow processes same user twice
**Cause:** "Split In Batches" configuration issue
**Fix:** Set `batchSize: 1` in Loop Through Users node

---

## 🔮 Future Enhancements

### Phase 2: User-Specific Scheduling
- Allow each user to set their own digest/alert times
- Store `digestTime` and `timezone` per user
- Use n8n's dynamic scheduling

### Phase 3: Advanced Filtering
- Let users customize alert thresholds (e.g., bid spread > 20% instead of 15%)
- Store user-specific policy overrides in `Policy` table
- Pass user's policy to guardrail endpoints

### Phase 4: Performance Optimization
- Implement workflow result caching
- Add Redis for user list caching
- Batch process users in groups of 50

### Phase 5: Analytics & Reporting
- Track workflow execution metrics per user
- Weekly performance reports
- Cost tracking (ATTOM API calls per user)

---

## 📚 References

- **Schema:** `prisma/schema.prisma`
- **Workflows:** n8n Dashboard - https://primary-production-8b46.up.railway.app
- **Master Plan:** [MULTI_TENANT_MIGRATION_SUMMARY.md](./MULTI_TENANT_MIGRATION_SUMMARY.md)
- **ATTOM Workflow:** [ATTOM_PROPERTY_DISCOVERY_WORKFLOW.md](./ATTOM_PROPERTY_DISCOVERY_WORKFLOW.md)

---

**Last Updated:** November 20, 2025
**Next Review:** After first production user onboarding
**Status:** ✅ Multi-Tenant Migration Complete | 🧪 Ready for Testing
