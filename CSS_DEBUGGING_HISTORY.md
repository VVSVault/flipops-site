# CSS Not Loading on Railway - Debugging History

## Problem Statement
CSS files are not loading on Railway production deployment for Next.js 15.5.2 + Tailwind CSS v4.1.17 application. Pages show unstyled HTML despite working perfectly locally.

## Environment
- **Framework**: Next.js 15.5.2 (App Router)
- **Styling**: Tailwind CSS v4.1.17 with `@tailwindcss/postcss`
- **Deployment**: Railway with Docker
- **Build Mode**: Standalone (`output: 'standalone'`)
- **Node Version**: 22.21.1

## Initial Symptoms
1. Production site shows unstyled HTML
2. CSS file requests return 404
3. No `<link rel="stylesheet">` tags in production HTML
4. Local development and production builds work perfectly

## Debugging Steps Chronology

### Phase 1: Package Dependencies Investigation
**Issue**: Suspected Tailwind packages in wrong dependency section
**Action**: Moved `tailwindcss`, `@tailwindcss/postcss`, `postcss`, `tw-animate-css` from devDependencies to dependencies
**Files Modified**: `package.json`
**Result**: ❌ No change - CSS still not loading
**Commit**: `61de48a` - "Fix CSS generation by moving Tailwind/PostCSS to dependencies"

### Phase 2: Nixpacks Static File Handling
**Issue**: Suspected standalone mode not copying static files correctly with Nixpacks
**Action**:
- Enabled `output: 'standalone'` in `next.config.js`
- Updated `nixpacks.toml` to manually copy `.next/static` and `public` folders
**Files Modified**: `next.config.js`, `nixpacks.toml`
**Result**: ❌ No change - CSS files still returning 404
**Commit**: `fdf7224` - "Enable Next.js standalone mode with proper static file handling"

### Phase 3: Switch to Custom Dockerfile
**Issue**: Nixpacks not providing enough control over build process
**Action**: Created custom multi-stage Dockerfile with explicit verification steps
**Files Created**: `Dockerfile`, `.dockerignore`
**Key Features**:
- Multi-stage build (deps, builder, runner)
- Verification steps at each stage
- Manual static file copying
- Security best practices (non-root user)
**Result**: ❌ Build succeeds but CSS files not generated
**Commit**: `b93c124` - "Switch to custom Dockerfile for proper CSS handling in production"

### Phase 4: Dockerfile Path Corrections
**Issue**: Directory structure mismatch in standalone build
**Action**: Fixed paths for copying static files in Dockerfile
**Files Modified**: `Dockerfile`
**Result**: ❌ Copy commands work but still no CSS files
**Commits**:
- `64455d7` - "Fix Dockerfile: create .next directory before copying static files"
- `b5ae20f` - "Update Dockerfile verification to check actual static directory structure"

### Phase 5: Critical Discovery - No CSS Generation
**Finding**: Build logs showed **NO CSS files being generated at all** during Docker build
**Evidence**:
```bash
builder: Checking for CSS files...
builder: WARNING: No CSS files found!
```
**Observation**: `.next/static/` only contained JS chunks, no CSS directory
**Local Comparison**: Local builds generate CSS files correctly:
```bash
.next/static/css/ba365596f7e4383e.css (107KB)
.next/static/css/de70bee13400563f.css (2.4KB)
```

### Phase 6: Dynamic vs Static Rendering Investigation
**Finding**: Routes showing as `ƒ (Dynamic)` instead of `○ (Static)` in Docker builds
**Root Cause**: `ClerkProvider` in root layout causing all routes to be dynamic
**Key Insight**: Next.js with standalone mode doesn't extract CSS to separate files for dynamic routes
**Action**: Added `export const dynamic = 'force-static'` to landing page
**Files Modified**: `app/page.tsx`
**Result**: ✅ Homepage now shows `○ (Static)` - but still no CSS files
**Commit**: `2867ea3` - "Force static generation for landing page to enable CSS extraction"

### Phase 7: Server.js Missing Discovery
**Finding**: Docker build not generating `server.js` in standalone output
**Evidence**: Build verification shows:
```bash
Contents of /app/:
drwxr-xr-x    1 nextjs   nodejs      4.0K .next
drwxr-xr-x    1 nextjs   nodejs      4.0K public
Checking for server.js...
ls: /app/server.js: No such file or directory
```
**Local Comparison**: `server.js` exists at `.next/standalone/flipops-site/server.js` locally
**Current Status**: ⏳ Investigating where server.js is generated in Docker build

## Current State Analysis

### What Works
✅ Local development (`npm run dev`)
✅ Local production build (`npm run build` + `npm start`)
✅ CSS files generated locally (107KB + 2.4KB)
✅ Tailwind configuration correct (`globals.css`, `postcss.config.mjs`)
✅ All source files copied to Docker build context
✅ Docker build completes successfully
✅ Homepage now marked as static (`○`)

### What Doesn't Work
❌ CSS files not generated in Docker build
❌ No CSS files in `.next/static/css/` directory
❌ `server.js` missing from standalone output
❌ Production deployment fails with "Cannot find module '/app/server.js'"

## Technical Deep Dive

### Tailwind v4 Configuration
```css
/* app/globals.css */
@import "tailwindcss";
/* ... additional config ... */
```

```javascript
/* postcss.config.mjs */
export default {
  plugins: {
    "@tailwindcss/postcss": {}
  }
};
```

### Next.js Configuration
```javascript
/* next.config.js */
const nextConfig = {
  output: 'standalone',  // ← Critical for Docker deployment
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ['@clerk/nextjs', '@clerk/clerk-react'],
};
```

### Dockerfile Strategy
```dockerfile
# Stage 1: Install dependencies (including build-time packages)
# Stage 2: Build application + copy static files
# Stage 3: Run standalone server
```

## Hypotheses Under Investigation

### Hypothesis 1: CSS Extraction Disabled for Standalone Mode
**Theory**: Next.js 15 with App Router + standalone mode may not extract CSS to separate files
**Evidence**: No `.next/static/css/` directory created in Docker builds
**Status**: ⏳ Investigating

### Hypothesis 2: Tailwind v4 + Next.js 15 Compatibility
**Theory**: Tailwind v4 with Next.js 15 standalone mode has undocumented behavior differences
**Evidence**:
- Works locally with `next start`
- Fails in Docker standalone build
- Same code, same packages, different environments
**Status**: ⏳ Investigating

### Hypothesis 3: Standalone Build Structure Mismatch
**Theory**: `server.js` generated in different location than expected
**Evidence**: File exists locally but not in Docker build at expected path
**Next Step**: Check all possible locations in `.next/standalone/` structure
**Status**: ⏳ Debugging in progress

## Key Files Modified

### Configuration Files
- `package.json` - Moved Tailwind packages to dependencies
- `next.config.js` - Added standalone output mode
- `nixpacks.toml` - Renamed to `.backup` (disabled)
- `app/page.tsx` - Added `force-static` export

### Docker Files
- `Dockerfile` - Custom multi-stage build
- `.dockerignore` - Optimized build context

### Tailwind Files (verified present and correct)
- `app/globals.css` - Tailwind v4 imports
- `postcss.config.mjs` - PostCSS config
- `app/layout.tsx` - Imports globals.css

### Phase 8: ROOT CAUSE IDENTIFIED - .gitignore Missing from Docker Build
**Finding**: `.dockerignore` was excluding `.gitignore` from Docker build context
**Root Cause**: Tailwind v4 automatic content discovery requires `.gitignore` to work correctly
**Evidence**:
- GitHub Issue #16364: "Angular compilation errors in Docker preventing TailwindCSS from working"
- When `.gitignore` is absent, Tailwind scans ALL folders including `node_modules/`
- Scanning `node_modules/` picks up malformed HTML from test files (e.g., `needle` package)
- This generates invalid CSS with unbalanced braces or NO CSS at all
**Action**:
- Removed `.gitignore` from `.dockerignore` exclusions
- Added verification step in Dockerfile to confirm `.gitignore` exists
**Files Modified**: `.dockerignore`, `Dockerfile`
**Result**: ⏳ Deploying - expecting CSS files to generate correctly
**Commit**: `d7eaf8f` - "CRITICAL FIX: Include .gitignore in Docker build for Tailwind v4"

## Resolution

### Root Cause Summary
**Primary Issue**: `.dockerignore` was excluding `.gitignore`, preventing Tailwind v4 from respecting ignore patterns
**Secondary Issue**: Incorrect Dockerfile paths for standalone build structure

### Technical Explanation
Tailwind v4 introduced automatic content discovery that scans project files for CSS class names. This process relies on `.gitignore` to know which directories to skip. When `.gitignore` is missing in Docker:

1. Tailwind scans `node_modules/` directory
2. Finds malformed HTML in package test files
3. Generates invalid CSS or fails silently
4. No `.next/static/css/` files created

This is a **known issue** with Tailwind v4 in Docker environments, specifically documented in GitHub Issue #16364.

## Important Notes

- ⚠️ **Do NOT use `railway up` CLI command** - Railway auto-deploys on git push
- ✅ CSS works perfectly in local production mode
- ✅ All Tailwind packages verified at correct versions (4.1.17)
- ✅ Configuration files confirmed present in Docker build
- ❌ Issue is specific to Docker standalone build environment

## Related Documentation
- [CLERK_DEBUGGING_HISTORY.md](./CLERK_DEBUGGING_HISTORY.md) - Previous authentication issues
- Next.js Standalone Mode: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
- Tailwind CSS v4 Alpha: https://tailwindcss.com/docs/v4-alpha

---
**Last Updated**: December 2, 2025
**Status**: 🔴 Critical - Blocking production deployment
**Priority**: P0 - No CSS = Unusable site
