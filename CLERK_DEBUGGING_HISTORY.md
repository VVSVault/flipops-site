# Clerk Debugging History - Complete Session Log

## Initial Problem
- **Error**: `Application error: a client-side exception has occurred`
- **Console Error**: `@clerk/clerk-react: useAuth can only be used within the <ClerkProvider /> component`
- **Environment**: Railway deployment on production

## Root Cause Discovery
Railway CLI was linked to **wrong project** (`flipops-api` instead of `beautiful-enjoyment`)
- All environment variable commands were setting values on wrong service
- This explained why variables appeared to be "missing" despite being set

## Debugging Attempts Chronology

### 1. Environment Variable Corruption (Initial)
**Issue**: Clerk URLs corrupted by Git Bash path conversion
```
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=C:/Program Files/Git/app
```

**Fix Attempted**:
```bash
MSYS_NO_PATHCONV=1 railway variables --set "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app"
```

**Result**: Fixed path corruption, but error persisted (was on wrong project)

### 2. Build Pre-rendering Errors
**Issue**: Next.js attempting to pre-render pages with Clerk hooks at build time

**Errors**:
```
Error occurred prerendering page "/"
Error: @clerk/clerk-react: UserButton can only be used within the <ClerkProvider />
```

**Fixes Attempted**:
- Added `export const dynamic = 'force-dynamic'` to root layout
- Added to 12+ pages (root, /not-authorized, /app/*, /sign-in, /sign-up, etc.)
- Updated directive order: `"use client"` must come before `dynamic` export

**Files Modified**:
- `app/layout.tsx`
- `app/page.tsx`
- `app/not-authorized/page.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- `app/sign-in/[[...sign-in]]/page.tsx`
- `app/sign-up/[[...sign-up]]/page.tsx`
- All 8 `/app/*` pages

**Result**: Build succeeded (72 pages generated), but runtime errors continued

### 3. ClerkProvider Configuration
**Issue**: ClerkProvider needed to be client-side only

**Fixes Attempted**:
- Created `app/components/clerk-provider-wrapper.tsx` as client component
- Wrapped root layout with ClerkProviderWrapper
- Added `isMounted` state to prevent SSR hydration issues
- Added early return in app layout until mounted

**Files Created/Modified**:
- `app/components/clerk-provider-wrapper.tsx` (new)
- `app/layout.tsx` (wrapped with ClerkProviderWrapper)
- `app/app/layout.tsx` (added isMounted check, early return)

**Result**: Build succeeded, but runtime errors persisted

### 4. Node Version Mismatch
**Issue**: Railway using Node 20.11.0, local using Node 22.17.1

**Fix Attempted**:
- Updated `.node-version` from 20.11.0 to 22.17.1
- Created `nixpacks.toml` specifying `nodejs_22`

**Files Modified**:
- `.node-version`
- `nixpacks.toml` (new)

**Result**: No impact on Clerk errors

### 5. Dynamic Import Strategy
**Issue**: Clerk hooks causing SSR errors during page generation

**Fix Attempted**: Split all pages using Clerk hooks into wrapper + content:
- `page.tsx`: Client wrapper with manual `useEffect` import
- `page-content.tsx`: Original page logic

**Pattern Used**:
```typescript
// page.tsx
"use client";
export const dynamic = 'force-dynamic';

export default function Page() {
  const [PageContent, setPageContent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import("./page-content").then((mod) => {
      setPageContent(() => mod.default);
    });
  }, []);

  if (!PageContent) return <div>Loading...</div>;
  return <PageContent />;
}
```

**Files Modified**: 8 pages
- `app/app/page.tsx` + `page-content.tsx`
- `app/app/leads/page.tsx` + `page-content.tsx`
- `app/app/offers/page.tsx` + `page-content.tsx`
- `app/app/contracts/page.tsx` + `page-content.tsx`
- `app/app/renovations/page.tsx` + `page-content.tsx`
- `app/app/rentals/page.tsx` + `page-content.tsx`
- `app/app/tasks/page.tsx` + `page-content.tsx`
- `app/app/underwriting/page.tsx` + `page-content.tsx`

**Result**: Build succeeded, but runtime errors continued

### 6. Next.js Configuration
**Issue**: Potential bundling issues with Clerk packages

**Fix Attempted**:
```javascript
transpilePackages: ['@clerk/nextjs', '@clerk/clerk-react'],
experimental: {
  optimizePackageImports: ['@clerk/nextjs'],
},
```

**File Modified**: `next.config.js`

**Result**: No change

### 7. CRITICAL DISCOVERY - Wrong Railway Project
**Discovery**: Railway CLI was linked to `flipops-api` project, not `beautiful-enjoyment`

**Evidence**:
```bash
railway status
# Output: Project: flipops-api
```

**Fix**:
```bash
railway link -p ee1e9bf0-7dd7-4aa4-a59f-e8651734384b -s flipops-site
# Output: Project beautiful-enjoyment linked successfully!
```

**Verification**:
```bash
railway variables | grep CLERK
# Now showed all 6 Clerk variables correctly set
```

**Result**: Variables confirmed on correct project

### 8. Railway Deployment Method Issue
**Discovery**: `railway up` does NOT inject environment variables during build

**Problem**:
- `railway up` builds locally and uploads artifact
- Build happens BEFORE Railway environment variables are available
- Environment variables only injected during **GitHub-triggered builds**

**Attempted Deployments**:
1. `railway up --detach` (x3) - Variables not injected
2. `railway redeploy` - Prompted for confirmation, wasn't actually GitHub build
3. Git push to trigger auto-deployment - SUCCESS

**Verification via API Endpoint**:
Created `/api/debug/env/route.ts` to check variables server-side:
```json
{
  "serverSide": {
    "allNextPublicVars": [
      "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL",
      "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
      "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL",
      "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    ]
  },
  "buildTime": {
    "clerkPublishableKey": "pk_test_...",
    "signInUrl": "/sign-in",
    "signUpUrl": "/sign-up",
    "afterSignInUrl": "/app",
    "afterSignUpUrl": "/app"
  }
}
```

**Result**: ✅ Environment variables ARE being injected correctly!

### 9. Client-Side Debug Page
**Issue**: Original debug page showed `allEnvVars: []` incorrectly

**Problem**: `Object.keys(process.env)` doesn't work in client components (Next.js replaces values at build time)

**Fix**: Updated to check individual variables:
```typescript
const envVars = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  // ... etc
};
```

**File Modified**: `app/debug-clerk/page.tsx`

## Current Status

### ✅ CONFIRMED WORKING
1. Railway CLI linked to correct project (beautiful-enjoyment)
2. All 6 Clerk environment variables set correctly:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app`
3. Environment variables injected at build time (verified via API)
4. Build completes successfully (72 pages generated)

### ❌ REMAINING ISSUES
1. **CSS Not Loading**: Pages display content but without Tailwind CSS styling
2. **Clerk Errors in Console**: Still seeing Clerk-related errors in browser console
3. **Pages Showing Unstyled HTML**: All pages affected, including homepage and sign-in

## Key Files Modified (Summary)

### Configuration
- `next.config.js` - transpilePackages, experimental optimizations
- `middleware.ts` - Updated matcher pattern
- `nixpacks.toml` - Node 22 configuration
- `.node-version` - Updated to 22.17.1

### Core Components
- `app/layout.tsx` - Wrapped with ClerkProviderWrapper
- `app/components/clerk-provider-wrapper.tsx` - Client-side Clerk wrapper

### Pages (12+ files)
- All app pages converted to dynamic import pattern
- All pages with Clerk hooks split into page.tsx + page-content.tsx

### Debug/Documentation
- `app/debug-clerk/page.tsx` - Client-side env var checker
- `app/api/debug/env/route.ts` - Server-side env var API
- `RAILWAY_PROJECT_INFO.md` - Project documentation
- `CLERK_DEBUGGING_HISTORY.md` - This file

## Critical Learnings

1. **Always verify Railway project linkage**: `railway status` before any operations
2. **`railway up` limitations**: Does NOT inject environment variables during build
3. **Use GitHub deployments**: Only GitHub-triggered builds inject Railway env vars properly
4. **Client-side `process.env`**: Cannot enumerate keys, only access individual values
5. **Next.js SSR + Clerk**: Requires careful handling with dynamic imports and force-dynamic

## Next Steps for Resolution

1. **Investigate CSS Loading Issue**:
   - Check browser Network tab for 404s on CSS files
   - Verify Tailwind is generating CSS during build
   - Check if static assets are being served correctly

2. **Check Browser Console**:
   - Document exact Clerk errors appearing
   - Check for JavaScript bundle loading errors
   - Verify if Clerk SDK is loading at all

3. **Verify Build Output**:
   - Check Railway build logs for CSS generation
   - Verify .next directory structure is correct
   - Confirm static assets are in build output

## Environment Variable Verification Commands

```bash
# Check current project
railway status

# Verify variables on Railway
railway variables | grep CLERK

# Test via API (after deployment)
curl https://flipops-site-production.up.railway.app/api/debug/env

# Trigger GitHub deployment (correct method)
git push origin main
```

## Important URLs

- **Production**: https://flipops-site-production.up.railway.app
- **Railway Dashboard**: https://railway.app/project/ee1e9bf0-7dd7-4aa4-a59f-e8651734384b
- **Debug API**: https://flipops-site-production.up.railway.app/api/debug/env
- **Debug Page**: https://flipops-site-production.up.railway.app/debug-clerk
- **Project ID**: ee1e9bf0-7dd7-4aa4-a59f-e8651734384b
- **Service**: flipops-site
