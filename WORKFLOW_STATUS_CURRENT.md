# ATTOM Property Discovery Workflow - Current Status

**Date:** November 19, 2025
**Status:** 85% Complete - Workflow stuck at "Loop Through ZIPs" node
**Workflow ID:** EkhrKhMhfRyu00go
**n8n URL:** https://primary-production-8b46.up.railway.app/workflow/EkhrKhMhfRyu00go

---

## ✅ What's Working

### 1. Authentication Fixed
- **File:** `middleware.ts` line 12
- **Fix:** Added `/api/users` to public routes
- **Result:** Endpoint returns JSON (not HTML sign-in page)

### 2. Fetch Active Users Node
- **URL:** `https://bb4c35d48e9c.ngrok-free.app/api/users`
- **Method:** GET
- **Returns:** 4 users (Jacksonville, Arizona, Miami, System Default)
- **Status:** ✅ Working

### 3. Filter Active Users Node
- **Type:** Code node (JavaScript)
- **Fix Applied:** Changed from `$input.all()` to `$input.first().json.users`
- **Code:**
```javascript
const response = $input.first().json;
const allUsers = response.users || [];

const activeUsers = allUsers.filter(user => {
  return user.subscriptionStatus === 'active' && user.onboarded === true;
});

console.log(`Found ${activeUsers.length} active users out of ${allUsers.length} total`);

// Return each user as a separate item for processing
return activeUsers.map(user => ({ json: user }));
```
- **Output:** 4 separate items (one per user)
- **Status:** ✅ Working

### 4. Build ATTOM Query Node
- **Type:** Code node (JavaScript)
- **Function:** Builds query parameters from user preferences
- **Extracts:**
  - Target markets → ZIP codes
  - Property types → ATTOM format (SFR|CONDO|TOWNHOUSE)
  - Price range from investorProfile
- **Status:** ✅ Working (assumed based on flow)

---

## ⚠️ Current Problem: Stuck at "Loop Through ZIPs"

### Symptom
- Workflow executes through "Build ATTOM Query"
- Gets stuck at "Loop Through ZIPs" node
- "Fetch from ATTOM API" node never activates

### Loop Through ZIPs Node Details
- **Type:** `n8n-nodes-base.splitOut`
- **Version:** 1
- **Parameters:**
```javascript
{
  fieldToSplitOut: 'queryParams.zips',
  options: {}
}
```

### Expected Behavior
- Should split the `queryParams.zips` array into individual items
- Each ZIP should flow to "Fetch from ATTOM API" node
- Example: Jacksonville has 15 ZIPs (5 per county × 3 counties)

### Likely Issues
1. **Field path wrong:** Maybe `queryParams.zips` doesn't exist in the data structure
2. **Array format:** The zips might not be in the expected format for splitOut
3. **Empty array:** The zips array might be empty

---

## 🔍 Debugging Next Steps

### 1. Check Build ATTOM Query Output
Look at what "Build ATTOM Query" is actually outputting:
- Is `queryParams.zips` present?
- Is it an array?
- Does it have ZIP codes in it?

### 2. Verify Data Structure
The "Build ATTOM Query" node should output:
```javascript
{
  json: {
    user: {
      id: 'test-investor-jacksonville',
      name: 'Jacksonville Test Investor',
      minScore: 65,
      investorProfile: {...}
    },
    queryParams: {
      zips: ['32202', '32204', '32205', ...],  // ← Array of strings
      propertyType: 'SFR|TOWNHOUSE|CONDO',
      minSaleAmt: 75000,
      maxSaleAmt: 250000,
      pageSize: 20
    }
  }
}
```

### 3. Test splitOut Configuration
The `splitOut` node needs the data in this exact structure. If the path is wrong or the data isn't an array, it will hang.

**Possible fixes:**
- Change `fieldToSplitOut` to just `zips` if the path is relative
- Use a Code node instead to manually split the array
- Add logging to see what data structure is actually being passed

---

## 📁 Key Files

### Workflow Script
**File:** `scripts/create-attom-discovery-workflow-v2.ts`

**Key Sections:**
- Lines 35-46: Fetch Active Users (HTTP Request)
- Lines 47-69: Filter Active Users (Code)
- Lines 70-153: Build ATTOM Query (Code) ← **CHECK OUTPUT HERE**
- Lines 154-171: Loop Through ZIPs (splitOut) ← **STUCK HERE**
- Lines 172-214: Fetch from ATTOM API (HTTP Request)

### Middleware
**File:** `middleware.ts`
**Line 12:** `/api/users` added to public routes

### Users API
**File:** `app/api/users/route.ts`
**Returns:** `{ success: true, count: 4, users: [...], requestId: '...' }`

### Test Investor
**File:** `scripts/seed-jacksonville-investor.ts`
**ID:** `test-investor-jacksonville`
**Markets:** Duval County, FL + Orange County, FL + Hillsborough County, FL
**ZIPs Expected:** 15 total (5 per county)

---

## 🔧 Quick Fix Options

### Option A: Replace splitOut with Code Node
```javascript
// Replace "Loop Through ZIPs" node with Code node
const input = $input.first().json;
const zips = input.queryParams?.zips || [];

console.log(`Splitting ${zips.length} ZIPs for processing`);

// Return one item per ZIP, keeping all context
return zips.map(zip => ({
  json: {
    ...input,
    queryParams: {
      ...input.queryParams,
      zips: zip  // Single ZIP instead of array
    }
  }
}));
```

### Option B: Debug splitOut Path
Try different field paths:
- `queryParams.zips` (current)
- `zips` (relative path)
- `json.queryParams.zips` (absolute path)

### Option C: Check Build ATTOM Query Code
Look at line 135-151 in the workflow script - verify the return statement includes `queryParams.zips` as an array.

---

## 📊 Workflow Connection Map

```
Schedule Daily Discovery
    ↓
Fetch Active Users (GET /api/users)
    ↓ Returns 4 users
Filter Active Users (Code - extract users array)
    ↓ Outputs 4 items
Build ATTOM Query (Code - build query params)
    ↓ Should output queryParams.zips array
Loop Through ZIPs (splitOut) ← **STUCK HERE**
    ↓ Should output 1 item per ZIP
Fetch from ATTOM API (HTTP Request)
    ↓
Transform & Calculate Match Score (Code - 0-100 scoring)
    ↓
Has Qualified Properties? (IF condition)
    ↓              ↓
YES (≥65)      NO
    ↓              ↓
Ingest         Log Skip
    ↓
Format Digest
    ↓
Send Slack
```

---

## 🎯 Expected Jacksonville Test Run

### Input
- **User:** test-investor-jacksonville
- **Markets:** 3 FL counties (Duval, Orange, Hillsborough)
- **ZIPs:** 15 total (5 per county)
- **Price Range:** $75k-$250k
- **Property Types:** SFR, TOWNHOUSE, CONDO

### Expected Flow
1. Jacksonville user filtered (active + onboarded) ✅
2. Query params built with 15 ZIPs ✅ (assumed)
3. Split into 15 items (1 per ZIP) ❌ **STUCK**
4. Fetch ATTOM API 15 times (once per ZIP)
5. Transform ~400 properties → score → filter
6. Ingest top 20 properties
7. Send Slack notification

---

## 🚀 Recovery Commands

### Recreate Workflow
```bash
cd flipops-site
npx tsx scripts/recreate-attom-workflow.ts
```

### Test Users Endpoint
```bash
curl http://localhost:3007/api/users
curl https://bb4c35d48e9c.ngrok-free.app/api/users
```

### Check Workflow in n8n
https://primary-production-8b46.up.railway.app/workflow/EkhrKhMhfRyu00go

---

## 💡 Immediate Action Required

1. **Open n8n workflow** and click on "Loop Through ZIPs" node
2. **Check the INPUT data** - what is the exact structure?
3. **Verify `queryParams.zips` exists** and is an array
4. **If not an array** → Use Option A (replace with Code node)
5. **If wrong path** → Use Option B (try different paths)
6. **If empty array** → Fix "Build ATTOM Query" code

---

## 📞 Context for Next Session

- We've been debugging n8n node connections for the past hour
- Fixed authentication (middleware.ts)
- Fixed filter code ($input.first().json.users)
- Removed splitInBatches loop (was causing infinite hang)
- Now stuck at splitOut node for ZIPs
- All building blocks tested individually (ATTOM API works, scoring works, ingest works)
- Just need to get the workflow flowing through all nodes

**The workflow is 85% complete - just needs the splitOut node fixed to process ZIPs!**
