# FlipOps API - Current Status & Deployment Issues

## 🎯 Current Objective
Setting up FlipOps API endpoint for n8n Google Sheets sync workflow to automatically import property data and calculate investment scores.

---

## ✅ What's Working

### Local Development API
- **Status:** ✅ FULLY FUNCTIONAL
- **URL:** `http://localhost:3000/api/webhooks/n8n`
- **Server Running:** Yes (via `npm run dev`)
- **Test Status:** Successfully processes property data and returns scores

### API Features Implemented
- ✅ Webhook endpoint at `/api/webhooks/n8n`
- ✅ Property scoring algorithm (50-100 point scale)
- ✅ Support for foreclosure, tax delinquency, vacancy indicators
- ✅ API key authentication (`x-api-key` header)
- ✅ JSON request/response handling
- ✅ Middleware configured to allow public access to webhook endpoints

---

## ❌ Current Production Deployment Issues

### Railway Deployment Failing
**Latest Error:** Clerk authentication errors during build
```
Error occurred prerendering page "/app/documents".
Error: useClerk can only be used within the <ClerkProvider /> component.
```

### Root Cause
Next.js is attempting to statically generate pages that require authentication context, causing the build to fail.

### Attempted Fixes (All Failed)
1. ❌ Added `output: 'standalone'` to next.config.js
2. ❌ Configured `ignoreBuildErrors: true` for TypeScript/ESLint
3. ❌ Modified railway.json to use different build commands
4. ❌ Tried using dev server in production (`npm run dev`)
5. ❌ Added `/api/webhooks/(.*)` to public routes in middleware.ts

---

## 🔧 What Needs to Be Fixed

### Primary Issue: Static Generation with Clerk
The build fails because Next.js tries to statically generate pages that use Clerk authentication hooks. Need to:

1. **Force Dynamic Rendering for All App Pages**
   - Add `export const dynamic = 'force-dynamic'` to all pages under `/app`
   - OR configure Next.js to skip static generation entirely

2. **Alternative: Separate API Deployment**
   - Deploy only the API routes without the UI
   - Create a minimal Next.js app with just the webhook endpoints

3. **Alternative: Different Hosting**
   - Consider Vercel (better Next.js support)
   - Or use a VPS with PM2 for full control

---

## 📋 n8n Configuration Parameters

### For Local Testing (Working Now)
```
URL: http://localhost:3000/api/webhooks/n8n
Method: POST
Headers:
  x-api-key: fo_live_10177805c8d743e1a6e1860515dc2b3f
  Content-Type: application/json
```

### For Production (Once Fixed)
```
URL: https://flipops-api-production.up.railway.app/api/webhooks/n8n
Method: POST
Headers:
  x-api-key: fo_live_10177805c8d743e1a6e1860515dc2b3f
  Content-Type: application/json
```

### Request Body Template
```json
{
  "type": "property",
  "action": "create",
  "workflowName": "Google Sheets Sync",
  "data": {
    "address": "{{$json.address}}",
    "city": "{{$json.city}}",
    "state": "{{$json.state}}",
    "zip": "{{$json.zip}}",
    "ownerName": "{{$json.ownerName}}",
    "assessedValue": {{$json.assessedValue || 0}},
    "taxDelinquent": {{$json.taxDelinquent || false}},
    "foreclosure": {{$json.foreclosure || false}},
    "preForeclosure": {{$json.preForeclosure || false}},
    "vacant": {{$json.vacant || false}},
    "dataSource": "Google Sheets"
  }
}
```

### Expected Response
```json
{
  "success": true,
  "message": "Processed X records",
  "results": [
    {
      "success": true,
      "address": "123 Main St",
      "score": 90,
      "potentialProfit": 45000
    }
  ]
}
```

---

## 📁 Recent File Changes

### Modified Files
- `middleware.ts` - Added `/api/webhooks/(.*)` to public routes
- `next.config.js` - Multiple attempts at fixing build issues
- `railway.json` - Various deployment configurations
- `package.json` - Simplified build command (removed workers)

### Key Files
- `/app/api/webhooks/n8n/route.ts` - Main webhook handler
- `/middleware.ts` - Authentication middleware
- `/railway.json` - Railway deployment config

---

## 🚀 Next Steps to Try

### Option 1: Fix Static Generation Issue
```bash
# Add to all pages that use Clerk
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
```

### Option 2: Create API-Only Build
1. Create new branch for API-only deployment
2. Remove all UI pages except API routes
3. Deploy minimal Next.js app

### Option 3: Use Environment Variable for Build
```bash
# In railway.json
"buildCommand": "NEXT_PUBLIC_SKIP_STATIC=true npm run build"
```

### Option 4: Deploy to Vercel Instead
```bash
vercel --prod
```

---

## 💡 Recommended Solution

**For immediate production use:**
1. Keep local server running for n8n integration
2. Use ngrok to expose local API: `ngrok http 3000`
3. Use ngrok URL in n8n workflow

**For proper production deployment:**
1. Create separate API-only Next.js project
2. Copy only the webhook route and necessary dependencies
3. Deploy to Railway without any UI components

---

## 🔑 Environment Variables

```env
# Required for API
FO_API_KEY=fo_live_10177805c8d743e1a6e1860515dc2b3f
FO_WEBHOOK_SECRET=7d82e2b8945c43959699bc3a3c1467bdd66954d25d6f41eb

# Clerk (causing issues)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dm9jYWwtY2F0ZmlzaC0yMi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_tDBLuqFTTXDPIdYk9sE6FjwJqMHarqAD2ZHmEn9w3i
```

---

## 📞 Support & Issues

- **Current Issue:** Railway deployment fails due to Clerk static generation
- **Workaround:** Use local API with ngrok for production
- **Long-term Fix:** Separate API deployment or fix static generation

---

Last Updated: October 14, 2024
Status: 🔴 Production deployment blocked, local API working