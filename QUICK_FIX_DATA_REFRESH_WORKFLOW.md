# Quick Fix: Data Refresh & Sync Workflow

**Issue:** The "Loop Through Users" node isn't properly configured to iterate through users.

**Solution:** Manually fix in n8n UI (takes 2 minutes)

---

## Step-by-Step Fix

### 1. Open the Workflow

1. Go to: https://primary-production-8b46.up.railway.app
2. Click **"Data Refresh & Sync"** in the sidebar
3. You should see 8 nodes

---

### 2. Delete the Current Loop Node

1. Click on **"Loop Through Users"** node
2. Press **Delete** key (or right-click → Delete)

---

### 3. Add a New Loop Node

1. Click the **"+"** button between "Fetch Active Users" and "Fetch Active Deals"
2. Search for: **"Loop Over Items"**
3. Select **"Loop Over Items"** (NOT "Split In Batches")

---

### 4. Configure Loop Over Items

In the Loop Over Items configuration panel:

```
Field to Loop Over: users
```

That's it! This tells it to loop over the `users` array from "Fetch Active Users"

---

### 5. Update the userId Expression

1. Click on **"Fetch Active Deals"** node
2. In the **Query Parameters** section
3. Find the `userId` parameter
4. Change the value from:
   ```
   ={{ $("Loop Through Users").item.json.id }}
   ```
   To:
   ```
   ={{ $json.id }}
   ```

This is because "Loop Over Items" puts each user directly in `$json`, not `$item.json`

---

### 6. Test the Workflow

1. Click **"Execute Workflow"** button (top right)
2. Watch it execute:
   - ✅ Fetch Active Users (should show 4 users)
   - ✅ Loop Over Items (should show 4 iterations)
   - ✅ Fetch Active Deals (should run 4 times, once per user)
   - ✅ Each call should have different userId

---

## Alternative: Simpler Approach (No Loop)

If the loop is still causing issues, here's a simpler approach for testing:

### Remove the Loop Entirely

1. **Delete** "Loop Through Users" node
2. **Connect** "Fetch Active Users" directly to "Fetch Active Deals"
3. **Update** "Fetch Active Deals" node:
   - Change Query Parameters → userId value to:
     ```
     test-investor-jacksonville
     ```
   (hardcode one user for now)

This will make it work for a single user, which is fine for testing!

---

## Why This Happened

Our automated script tried to add multi-tenant support by:
1. Adding "Fetch Active Users" node ✅
2. Adding "Split In Batches" loop node ❌ (wrong type)
3. Updating userId parameters ✅

The issue is that "Split In Batches" is designed for pagination, not iterating over items. We should have used "Loop Over Items" instead.

---

## Next Steps

Once you get "Data Refresh & Sync" working:

1. **Don't worry about the other 6 workflows yet** - they likely have the same issue
2. We can either:
   - Fix them manually one by one (takes ~10 minutes total)
   - OR just test with hardcoded userIds for now
   - OR I can create a better script that uses the correct loop type

Let me know which approach you prefer!

---

## Quick Reference: Correct Workflow Structure

```
1. Schedule Trigger
   ↓
2. Fetch Active Users
   URL: https://7fcbc4a17dba.ngrok-free.app/api/users?status=active
   ↓
3. Loop Over Items
   Field to Loop Over: users
   ↓
4. Fetch Active Deals
   URL: https://7fcbc4a17dba.ngrok-free.app/api/deals/active
   Query Param: userId = {{ $json.id }}
   ↓
5. Check If Any Deals
   ↓
6. Refresh Deal Data
   ↓
7. Format Slack Message
   ↓
8. Send to Slack
   URL: {{ $json.slackWebhook }}
```

---

**TL;DR:** Replace "Split In Batches" with "Loop Over Items" and set field to "users"
