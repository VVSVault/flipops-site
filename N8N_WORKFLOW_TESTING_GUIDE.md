# n8n Multi-Tenant Workflow Testing Guide

**Date:** November 22, 2025
**Status:** Ready for Testing
**Server:** http://localhost:3007
**n8n Dashboard:** https://primary-production-8b46.up.railway.app

---

## ✅ Pre-Test Verification

### API Endpoints Status
All 7 API endpoints are **working correctly** with userId filtering:

- ✅ `/api/deals/approve/status` - Returns 400 without userId, 200 with userId
- ✅ `/api/deals/bid-spread/status` - Returns 400 without userId, 200 with userId
- ✅ `/api/deals/budget-variance/status` - Returns 400 without userId, 200 with userId
- ✅ `/api/deals/change-orders/status` - Returns 400 without userId, 200 with userId
- ✅ `/api/deals/stalled` - Returns 400 without userId, 200 with userId
- ✅ `/api/deals/active` - Returns 400 without userId, 200 with userId
- ✅ `/api/contractors/performance` - Returns 400 without userId, 200 with userId

### Active Test Users
You have **4 active users** in the system:

1. **Jacksonville Test Investor** (ID: `test-investor-jacksonville`)
2. **Arizona Test Investor** (ID: `test-investor-arizona`)
3. **Miami Test Investor** (ID: `test-investor-miami`)
4. **System Default User** (ID: `default-user-id`)

---

## 🧪 Workflow Testing Steps

### Step 1: Access n8n Dashboard

1. Go to: https://primary-production-8b46.up.railway.app
2. Log in with your n8n credentials
3. You should see all 7 updated workflows in the sidebar

---

### Step 2: Test Individual Workflow

Let's start by testing **G1 - Deal Approval Alert** as an example.

#### 2.1 Open the Workflow
1. Click on "G1 - Deal Approval Alert" in the sidebar
2. Verify the workflow structure shows:
   - **Schedule Trigger** → **Fetch Active Users** → **Loop Through Users** → **Fetch G1 Status** → **Check If Any Blocked** → **Format Slack Alert** → **Send to Slack**

#### 2.2 Execute the Workflow Manually
1. Click the **"Execute Workflow"** button (play icon) in the top right
2. Watch the execution flow in real-time

#### 2.3 Verify Node Outputs

Click on each node to see its output:

**Node 1: Fetch Active Users**
```json
{
  "success": true,
  "count": 4,
  "users": [
    {
      "id": "test-investor-jacksonville",
      "email": "jacksonville@test.com",
      "name": "Jacksonville Test Investor",
      "slackWebhook": "https://hooks.slack.com/services/..."
    },
    // ... 3 more users
  ]
}
```

**Node 2: Loop Through Users**
- Should show it's processing **4 items** (one per user)
- Click through each iteration to see individual user data

**Node 3: Fetch G1 Status** (for each user)
```json
{
  "success": true,
  "summary": {
    "total": 0,  // Number of blocked deals for THIS user
    "uniqueDeals": 0,
    "totalOverage": 0,
    "avgOveragePct": 0
  },
  "blockedDeals": []
}
```

**Node 4: Check If Any Blocked**
- Should show TRUE/FALSE based on whether user has violations
- If FALSE, execution stops here (no Slack message sent)
- If TRUE, continues to format and send Slack message

---

### Step 3: Test All 7 Workflows

Repeat Step 2 for each workflow:

| Workflow | Purpose | What to Verify |
|----------|---------|----------------|
| **G1 - Deal Approval Alert** | Blocked deals (P80 > max exposure) | User loop works, userId passed correctly |
| **G2 - Bid Spread Alert** | Bid spreads > 15% | Each user's bids filtered separately |
| **G3 - Invoice & Budget Guardian** | Budget variance > 10% | Each user's budgets filtered separately |
| **G4 - Change Order Gatekeeper** | Pending change orders | Each user's change orders filtered |
| **Pipeline Monitoring** | Stalled deals across G1-G4 | Each user's pipeline isolated |
| **Contractor Performance Tracking** | Flagged contractors | Each user's vendors filtered |
| **Data Refresh & Sync** | Active deals refresh | Each user's deals refreshed separately |

---

### Step 4: Verify Data Isolation

This is the **most important test** - ensuring users can't see each other's data.

#### 4.1 Create Test Data for User 1

Using Prisma Studio or your database client:

1. Create a deal for Jacksonville Test Investor:
   ```sql
   INSERT INTO "DealSpec" ("id", "userId", "address", "maxExposureUsd", "targetRoiPct")
   VALUES ('test-deal-jax-1', 'test-investor-jacksonville', '123 Test St, Jacksonville', 300000, 25);
   ```

2. Create a G1 BLOCK event for this deal:
   ```sql
   INSERT INTO "Event" ("id", "dealId", "actor", "action", "artifact", "ts", "diff")
   VALUES (
     'test-event-jax-1',
     'test-deal-jax-1',
     'system:G1',
     'BLOCK',
     'DealSpec',
     NOW(),
     '{"reason":"P80 exceeds max exposure","p80":385000,"maxExposureUsd":300000}'::jsonb
   );
   ```

#### 4.2 Create Test Data for User 2

1. Create a deal for Arizona Test Investor:
   ```sql
   INSERT INTO "DealSpec" ("id", "userId", "address", "maxExposureUsd", "targetRoiPct")
   VALUES ('test-deal-az-1', 'test-investor-arizona', '456 Test Ave, Phoenix', 250000, 30);
   ```

2. Create a G1 BLOCK event for this deal:
   ```sql
   INSERT INTO "Event" ("id", "dealId", "actor", "action", "artifact", "ts", "diff")
   VALUES (
     'test-event-az-1',
     'test-deal-az-1',
     'system:G1',
     'BLOCK',
     'DealSpec',
     NOW(),
     '{"reason":"P80 exceeds max exposure","p80":320000,"maxExposureUsd":250000}'::jsonb
   );
   ```

#### 4.3 Test Data Isolation

1. **Run G1 workflow** manually in n8n
2. **Check Loop Through Users node** - should process both users
3. **Check Fetch G1 Status for Jacksonville user**:
   - Should return **1 blocked deal**: "123 Test St, Jacksonville"
   - Should **NOT** return Arizona deal
4. **Check Fetch G1 Status for Arizona user**:
   - Should return **1 blocked deal**: "456 Test Ave, Phoenix"
   - Should **NOT** return Jacksonville deal

✅ **Expected Result:** Each user sees only their own data

❌ **Failure:** If either user sees the other's data, data isolation is broken

---

### Step 5: Test Slack Notifications

#### 5.1 Set Up User-Specific Slack Webhooks

For proper testing, each user needs their own Slack webhook:

1. Open Prisma Studio: `npx prisma studio`
2. Navigate to **User** table
3. For each user, add a **unique Slack webhook URL**:
   - Jacksonville: Channel #test-jax
   - Arizona: Channel #test-az
   - Miami: Channel #test-miami
   - Default: Channel #test-default

#### 5.2 Execute Workflow

1. Run **G1 - Deal Approval Alert** with test data
2. Each user with violations should receive a **separate Slack message** in their own channel

#### 5.3 Verify Slack Message Content

Each message should include:
- ✅ User's name and company in the header
- ✅ Only that user's violations
- ✅ Sent to that user's specific webhook

Example message for Jacksonville:
```
🏠 ATTOM Property Discovery Report
Jacksonville Test Investor (Test Company)

G1 Violations:
- 123 Test St, Jacksonville - $85,000 over budget (28.3%)
```

---

## 🔍 Common Issues & Troubleshooting

### Issue 1: "userId parameter is required" Error

**Symptom:** Workflow fails at "Fetch G1 Status" node
**Cause:** userId not being passed from Loop Through Users
**Fix:**
1. Check "Loop Through Users" node is connected
2. Verify "Fetch G1 Status" node has parameter: `userId={{ $json.id }}`

---

### Issue 2: No Users Found

**Symptom:** "Fetch Active Users" returns empty array
**Cause:** No users with `subscriptionStatus = "active"`
**Fix:**
```sql
UPDATE "User" SET "subscriptionStatus" = 'active' WHERE email LIKE '%test%';
```

---

### Issue 3: Invalid Slack Webhook

**Symptom:** 400 error from Slack: "invalid_payload"
**Cause:** User's slackWebhook field is null or invalid
**Fix:**
1. Open Prisma Studio
2. Set valid webhook for each user
3. Or update workflow to skip users without webhooks

---

### Issue 4: All Users See Same Data

**Symptom:** Jacksonville user sees Arizona deals
**Cause:** API endpoint not filtering by userId
**Fix:**
1. Check endpoint includes `where: { userId }` in Prisma query
2. Restart server: `npm run build && npm run start`
3. Re-run test script: `npx tsx scripts/test-multi-tenant-endpoints.ts`

---

## 📋 Testing Checklist

Use this checklist to verify each workflow:

### G1 - Deal Approval Alert
- [ ] Fetches all active users
- [ ] Loops through each user individually
- [ ] Passes correct userId to API
- [ ] Filters blocked deals by userId
- [ ] Shows only user's own blocked deals
- [ ] Sends to user-specific Slack webhook
- [ ] Message includes user name/company
- [ ] Data isolation confirmed (User A can't see User B's deals)

### G2 - Bid Spread Alert
- [ ] Fetches all active users
- [ ] Loops through each user
- [ ] Filters deals by userId
- [ ] Calculates bid spreads only for user's deals
- [ ] Data isolation confirmed

### G3 - Invoice & Budget Guardian
- [ ] Fetches all active users
- [ ] Loops through each user
- [ ] Filters budget ledgers by userId
- [ ] Shows only user's budget variances
- [ ] Data isolation confirmed

### G4 - Change Order Gatekeeper
- [ ] Fetches all active users
- [ ] Loops through each user
- [ ] Filters change orders by deal.userId
- [ ] Shows only user's pending change orders
- [ ] Data isolation confirmed

### Pipeline Monitoring
- [ ] Fetches all active users
- [ ] Loops through each user
- [ ] Filters stalled deals by userId
- [ ] Shows user's pipeline status only
- [ ] Data isolation confirmed

### Contractor Performance Tracking
- [ ] Fetches all active users
- [ ] Loops through each user
- [ ] Filters vendors by userId
- [ ] Shows only user's contractor performance
- [ ] Data isolation confirmed

### Data Refresh & Sync
- [ ] Fetches all active users
- [ ] Loops through each user
- [ ] Filters active deals by userId
- [ ] Refreshes only user's deals
- [ ] Data isolation confirmed

---

## 🚀 Production Deployment

Once all tests pass:

1. **Update API URLs in workflows:**
   - Change `http://localhost:3007` to your production domain
   - Update in all 7 workflows

2. **Activate workflows:**
   - Set each workflow to **Active** in n8n dashboard
   - Monitor first few executions

3. **Set up monitoring:**
   - Check n8n execution history daily
   - Monitor Slack for alerts
   - Review logs for errors

4. **Onboard first real investor:**
   - Create user account
   - Set up their Slack webhook
   - Import their deals/properties
   - Verify they only see their data

---

## 📊 Success Criteria

✅ **All tests passed if:**

1. All 7 workflows execute without errors
2. Each user receives separate Slack notifications
3. Data isolation is perfect (no cross-user data leakage)
4. API endpoints require userId and filter correctly
5. Slack messages include user context
6. No performance issues (executes in <30 seconds for 4 users)

---

**Happy Testing!** 🎉

For issues or questions, refer to:
- [MULTI_TENANT_WORKFLOWS_UPDATE.md](./MULTI_TENANT_WORKFLOWS_UPDATE.md) - Complete migration documentation
- [ATTOM_PROPERTY_DISCOVERY_WORKFLOW.md](./ATTOM_PROPERTY_DISCOVERY_WORKFLOW.md) - ATTOM workflow details
