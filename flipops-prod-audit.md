# FlipOps Production Build Audit Report

## Discovery

### Environment & Versions
- **Framework**: Next.js 15.5.2 (App Router)
- **CSS**: Tailwind CSS v4.1.12 (alpha/beta)
- **Node Version**: 20.11.0 (from .node-version)
- **Package Manager**: npm

### Project Structure
- **Main directories**:
  - `app/` - Next.js App Router root
  - `app/app/` - Application pages and layouts
  - `app/components/` - Shared components
  - `components/` - UI components directory
- **CSS Entry**: `app/globals.css`
- **Config Files**:
  - `next.config.js` - Next.js configuration
  - `postcss.config.mjs` - PostCSS with Tailwind v4 plugin
  - `tailwind.config.ts` - Tailwind configuration (v3 legacy, needs review)

### Dependencies
- `tailwindcss`: ^4
- `@tailwindcss/postcss`: ^4
- `tw-animate-css`: ^1.3.7

---

## Issues & Fixes

### 1. Tailwind v4 Wiring & CSS Order

**Status**: ⚠️ Needs fixing

**Current State**:
- `postcss.config.mjs` uses array syntax instead of object syntax
- `app/globals.css` correctly imports Tailwind v4 with `@import "tailwindcss"`
- Has v4-specific `@theme` directive but missing explicit `@source` directives

**Fix Applied**: