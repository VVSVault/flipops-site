# 🚀 Quick Google Sheets Setup (3 Minutes)

Since the service account permission is taking time to propagate, here's the fastest way to complete the setup:

## Option A: Manual Sheet Creation (Fastest - 2 min)

### 1. Create Google Sheet
1. Go to: https://sheets.google.com
2. Click "+" to create new sheet
3. Name it: "FlipOps Properties"

### 2. Copy Headers
Copy and paste this into cell A1, then use Data → Split text to columns:
```
address,city,state,zip,owner_name,foreclosure,pre_foreclosure,tax_delinquent,vacant,bankruptcy,absentee_owner
```

### 3. Import Sample Data
Copy and paste these rows starting from A2:
```
123 Main St,Miami,FL,33139,John Doe,yes,no,yes,no,no,yes
456 Oak Ave,Miami,FL,33140,Jane Smith,no,yes,no,yes,no,no
789 Elm Dr,Miami Beach,FL,33141,Bob Johnson,yes,no,yes,yes,no,yes
321 Pine St,Coral Gables,FL,33142,Alice Williams,no,no,yes,no,yes,yes
654 Maple Blvd,Miami,FL,33143,Charlie Brown,yes,yes,yes,yes,yes,yes
987 Cedar Way,Miami,FL,33144,Diana Prince,no,no,no,yes,no,yes
147 Birch Ln,Miami,FL,33145,Edward Jones,yes,no,no,no,no,no
258 Willow Ct,Miami Beach,FL,33146,Frank Miller,no,yes,yes,no,no,yes
369 Spruce Ave,Miami,FL,33147,Grace Lee,yes,yes,yes,yes,no,yes
741 Ash Dr,Coral Gables,FL,33148,Henry Wilson,no,no,yes,yes,yes,no
```

### 4. Share with Service Account
1. Click "Share" button
2. Add: `flipops@composed-falcon-474420-j9.iam.gserviceaccount.com`
3. Give "Editor" access
4. Click "Send"

### 5. Get Sheet ID
Look at your sheet URL:
```
https://docs.google.com/spreadsheets/d/[THIS_IS_YOUR_SHEET_ID]/edit
```
Copy the ID between `/d/` and `/edit`

## Option B: Wait and Auto-Create (5 min)

If you prefer to wait for permissions to propagate:

```bash
# Wait 5 minutes, then run:
cd flipops-site && npx tsx scripts/setup-google-sheet.ts
```

## Configure n8n Workflow

### 1. Open n8n
Go to: https://primary-production-8b46.up.railway.app

### 2. Edit "FlipOps Google Sheets Sync" Workflow
1. Open the workflow (ID: qFVcWb9f6JmGZCFU)
2. Double-click "Get Properties from Sheet" node

### 3. Add Credentials
1. Click "Create New" for credential
2. Choose "Google Sheets API" → "Service Account"
3. Add:
   - **Service Account Email:** `flipops@composed-falcon-474420-j9.iam.gserviceaccount.com`
   - **Private Key:** Copy from `google-service-account.json` (the entire key including BEGIN/END lines)

### 4. Configure Sheet
1. **Document ID:** Paste your Sheet ID
2. **Sheet Name:** `Sheet1` (or whatever your sheet tab is named)
3. **Range:** Leave empty to read all

### 5. Save and Activate
1. Click "Save"
2. Toggle workflow to "Active"

## 🎯 Expected Results

Within 5 minutes you should see:
- **Slack Alert** for "654 Maple Blvd" (Score: 93)
- **Slack Alert** for "369 Spruce Ave" (Score: 85)
- **Slack Alert** for "789 Elm Dr" (Score: 80)

## Verify It's Working

### Check Webhook Logs
```bash
# Watch the dev server for webhook hits
# You should see scores being calculated
```

### Check n8n Executions
1. Go to n8n → Executions
2. Look for "FlipOps Google Sheets Sync"
3. Should show successful runs every 5 minutes

### Check Slack
Look in #guardrail-alerts channel for property alerts

---

**Total Time:** 3 minutes for manual, 8 minutes if waiting for permissions