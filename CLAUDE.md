# CLAUDE.md - Project Guidelines for Claude

## Project Overview

FlipOps is a real estate investment automation platform built with Next.js 16, React 19, and Tailwind CSS v4. It helps investors manage property discovery, deal analysis, and project management.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **React**: v19
- **Styling**: Tailwind CSS v4 (not v3 - syntax differs)
- **UI Components**: Radix UI primitives + shadcn/ui patterns
- **Database**: Prisma ORM with PostgreSQL (Railway)
- **Auth**: Clerk
- **Automation**: TypeScript cron jobs (lib/cron/)

## Project Structure

```
app/                    # Next.js App Router
  app/                  # Authenticated app pages (/app/*)
  api/                  # API routes
  (marketing)/          # Public marketing pages
components/             # React components
  ui/                   # Base UI components (shadcn/ui style)
lib/                    # Core business logic
  prisma.ts             # Prisma client singleton (IMPORTANT: use this, don't create new instances)
  reapi/                # RealEstateAPI integration
  cron/                 # TypeScript cron automation
    guardrails/         # G1-G4 guardrail jobs
    monitoring/         # Data refresh, pipeline monitoring
    discovery/          # Property discovery jobs
    worker.ts           # Main cron worker entry point
prisma/                 # Database schema
scripts/                # Utility scripts
docs/                   # Documentation
```

## Critical Patterns

### Database Access

**ALWAYS** use the shared Prisma singleton:
```typescript
import { prisma } from '@/lib/prisma';
```

**NEVER** do this in API routes:
```typescript
// BAD - creates connection leak
const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

// BAD - disconnects shared client, breaks concurrent requests
finally {
  await prisma.$disconnect();
}
```

### Authentication

Routes are protected via Clerk middleware. Check `middleware.ts` for the public route list.

For API routes requiring auth:
```typescript
import { auth } from '@clerk/nextjs/server';

const { userId: clerkId } = await auth();
if (!clerkId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

For API routes using service keys (webhooks, cron):
```typescript
const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
const expectedKey = process.env.FO_API_KEY || process.env.FLIPOPS_API_KEY;

// IMPORTANT: Check BOTH that expectedKey exists AND matches
if (!expectedKey || apiKey !== expectedKey) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### API Route Structure

Standard pattern for API routes:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const Schema = z.object({ /* ... */ });

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    // 2. Parse & validate body with Zod
    // 3. Business logic
    // 4. Return JSON response
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
  // NO finally { prisma.$disconnect() }
}
```

### Component Patterns

UI components use shadcn/ui conventions:
- Located in `components/ui/`
- Use `class-variance-authority` for variants
- Use `cn()` helper from `lib/utils` for class merging

```typescript
import { cn } from '@/lib/utils';

<div className={cn('base-classes', conditional && 'conditional-classes', className)} />
```

### Tailwind CSS v4

This project uses Tailwind v4, which has different syntax from v3:
- Config is in `app/globals.css` using `@theme` directive, not `tailwind.config.js`
- Some class names differ from v3

## Environment Variables

Required variables (see `env.sample`):
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` - Clerk auth
- `FO_API_KEY` or `FLIPOPS_API_KEY` - Internal API authentication
- `REAPI_API_KEY` - RealEstateAPI for property data (currently expired, plan to reactivate)
- `ATTOM_API_KEY` - ATTOM API for property discovery (used by cron)
- `BATCHDATA_API_KEY` - BatchData API for skip tracing ($0.20/record)

## Guardrails System (G1-G4)

The app implements 4 automated guardrails:
- **G1**: Deal approval (maximum exposure protection)
- **G2**: Bid spread control
- **G3**: Invoice/budget guardian
- **G4**: Change order gatekeeper

See `docs/guardrails/` for implementation details.

## Feature Status (Last Reviewed: 2026-01-28)

### ✅ FULLY IMPLEMENTED & WORKING

#### Cron/Automation System (lib/cron/)
All 9 scheduled workflows are implemented and production-ready:

| Workflow | Schedule | Status |
|----------|----------|--------|
| G1 - Deal Approval Alert | Every 15 min | ✅ Full |
| G2 - Bid Spread Alert | Every 15 min | ✅ Full |
| G3 - Invoice Budget Alert | Every 15 min | ✅ Full |
| G4 - Change Order Alert | Every 15 min | ✅ Full |
| Pipeline Monitoring | Daily 9:00 AM | ✅ Full |
| Contractor Performance | Daily 10:00 AM | ✅ Full |
| ATTOM Property Discovery | Daily 6:00 AM | ✅ Full |
| Skip Tracing (BatchData) | Weekly Sunday 7:00 AM | ✅ Full |
| Data Refresh Sync | Daily 8:00 AM | ✅ Full |

Run with: `npm run worker` or individual: `npm run cron:g1`

#### Guardrails API (G1-G4)
All guardrail endpoints have full implementation with auth:
- **G1** `/api/deals/approve` - Monte Carlo estimation, P80 exposure checks
- **G2** `/api/bids/award` - Bid spread analysis, vendor comparison
- **G3** `/api/invoices/ingest` - Budget variance tiers (GREEN/TIER1/TIER2)
- **G4** `/api/change-orders/submit` - CO evaluation with simulation

#### Distress Scoring Algorithm
Location: `lib/reapi/utils/distress-scorer.ts` (v2.0)
- 0-100 scale with weighted signals
- HIGH signals: Pre-foreclosure (25), Auction (25), Liens (20)
- MEDIUM signals: Vacant (15), Out-of-state owner (15), Inherited (15)
- LOW signals: High equity (10), Long-term owner (15), Portfolio owner (10)
- Integrated with REAPI search (scoring on-the-fly)
- Grade thresholds: A (65+), B (50-64), C (35-49), D (20-34), F (0-19)

#### Skip Trace Integration (BatchData)
- Auto-enrichment for properties scoring 70+
- $0.20/property cost tracking
- Auto-creates "Make first contact" task after enrichment
- Slack notifications with results

#### Notifications System (`/api/notifications`)
- POST: Create notification (from cron jobs, webhooks)
- GET: Retrieve with filters (type, dealId, processed, limit)
- PATCH: Mark notifications as processed
- Stored in Prisma `Notification` model (persists across restarts)
- Dashboard widget displays recent notifications

#### Database Schema
Complete 24-model schema covering:
- Properties, Deals, Vendors, Bids, Invoices, ChangeOrders
- Buyers, ContractAssignments, BuyerOffers, Campaigns (wholesale)
- Rentals, Tenants, RentalIncome, RentalExpense (buy-and-hold)
- Events (audit trail), Tasks, Policies, CostModels

#### UI Pages (app/app/)
18 authenticated pages: Dashboard, Leads, Tasks, Contracts, Renovations, Rentals, Offers, Underwriting, Campaigns, Inbox, Documents, Data Sources, Analytics, Settings, Vendors, Buyers, Onboarding

### ⚠️ NOTES / CONSIDERATIONS

1. **ATTOM API Scope**
   - Currently uses `/sale/snapshot` for property discovery + AVM
   - Does NOT include foreclosure/preforeclosure data (requires Premium tier)
   - Best used for: sales comps, AVM valuations, property characteristics
   - REAPI (when reactivated) provides better distress signals

2. **Properties Ingest Scoring**
   - `/api/properties/ingest` is generic endpoint (manual imports)
   - REAPI path scores correctly with full distress algorithm
   - BatchData is skip-trace only (not property import)

### 🔴 NOT WORKING / BLOCKED

1. **REAPI Key Expired**
   - Property search on leads page fails
   - Plan: Reactivate when going live ($599/mo for 30K credits)
   - Alternative: Switch to ATTOM (already have integration code)

### 📋 NOT STARTED (From Roadmap)

- Outreach: Built-in dialer, SMS/text campaigns, email campaigns (Twilio)
- Direct mail integration (Lob/PostGrid)
- ARV calculator, repair cost estimator, 70% rule calculator
- Role-based permissions
- Zapier/Make integration
- Native mobile app

## Frontend Redesign Status (2026-01-28)

Goal: Apple-like quality - seamless, intuitive for older users, impressive for younger users.

### ✅ COMPLETED

#### Dashboard (`app/app/page.tsx`)
Completely redesigned with:
- **No dynamic import flicker** - Direct render, proper skeleton loading
- **KPI Cards** - Clickable with hover effects, sparklines, trend badges, semantic colors
- **Pipeline Funnel** - Visual bar chart (Leads → Contacted → Qualified → Offers → Closed)
- **Notifications Widget** - Pulls from `/api/notifications`, shows recent activity
- **Refresh Button** - Manual data refresh with loading state
- **Dynamic Greeting** - "Good morning/afternoon/evening" based on time
- **Investor Stats** - Wholesaler/Flipper/Buy-and-Hold specific sections
- **Responsive Grid** - 2→3→6 columns based on screen size

New component: `components/ui/skeleton.tsx` for loading states.

#### Leads (`app/app/leads/page.tsx`)
Completely redesigned with:
- **No dynamic import flicker** - Merged page.tsx and page-content.tsx
- **Stats Cards** - Total Leads, Not Contacted, Hot Leads (70+), Follow-ups Due
- **Bulk Selection** - Checkbox selection with select all, bulk actions toolbar
- **Bulk Actions** - Update status, export selected, delete selected
- **Score Visualization** - Visual gauge bars with color coding (emerald 70+, amber 50+, orange 30+)
- **StatusBadge Component** - Semantic colors for each status
- **Table Skeleton** - Proper loading state with skeleton rows
- **Polished Property Drawer** - Cleaner layout, better score badge, contact info cards
- **Row Actions Dropdown** - View Details, Mark Contacted, Delete

#### Inbox (`app/app/inbox/page.tsx`)
Completely redesigned with "Editorial Precision" aesthetic:
- **No Stats Cards** - Clean viewport-fitting layout without top cards
- **Gmail-like Sorting** - Unread messages sorted to top, then by date
- **Read/Unread Styling** - Read messages grayed out (opacity-60), unread bold with blue dot
- **Avatar Initials** - Circle avatars with lead initials, blue when selected
- **Rounded Cards** - All panels use `rounded-2xl` with subtle shadows
- **Score Ring** - SVG circular progress indicator for lead score
- **Sentiment Pills** - Colored background pills for sentiment indicators
- **Message Bubbles** - Gradient backgrounds, date dividers, delivery status icons
- **Contact Info Cards** - Color-coded icon containers (blue/purple/emerald)
- **Quick Actions** - Semantic hover colors per action type
- **Skeleton Loading** - ThreadListSkeleton with staggered animation
- **Auto-scroll** - Messages scroll to bottom on new message

#### Layout Changes (`app/app/layout.tsx`)
- **Footer Removed** - No footer in app layout (info available on homepage/onboarding)
- **Viewport Fitting** - Main content uses `h-[calc(100dvh-4rem)] overflow-hidden`
- **Internal Scrolling** - Pages use ScrollArea with `min-h-0` flex children

#### Campaigns (`app/app/campaigns/page.tsx`)
Completely redesigned with "Command Center Elegance" aesthetic:
- **Card-Based Layout** - Visual campaign cards instead of table, with hover lift effects
- **Status Bar Indicators** - Color-coded gradient bars at top of each card (emerald=running, amber=paused, blue=draft)
- **Animated Progress Rings** - SVG circular progress indicator with smooth transitions
- **Sparkline Charts** - Mini trend visualizations for reply rate performance
- **Metrics Grid** - Sent/Replies/Deals displayed with icons and tabular-nums
- **Channel Badges** - Color-coded icons for SMS/Email/Voicemail/Letter
- **Status Pulse Animation** - Pulsing dot for active/running campaigns
- **Premium Stat Cards** - Gradient backgrounds with trend indicators and ROI display
- **Grid/List Toggle** - Switch between card grid and list views
- **Skeleton Loading** - Proper loading state with card skeletons
- **Empty State** - Sparkles icon with helpful CTA when no campaigns

New components: `Sparkline`, `ProgressRing`, `StatusIndicator`, `ChannelBadges`, `CampaignCard`, `StatCard`

### 📋 PAGES TO REDESIGN (Priority Order)

#### 1. Underwriting (`app/app/underwriting/page.tsx`)
Current: Form-based calculator
Planned:
- **Deal Analyzer Card** - Property photo, address, key metrics at glance
- **ARV Calculator** - Comp selection with map view, adjustment sliders
- **Repair Estimator** - Category-based cost breakdown with line items
- **70% Rule Widget** - Visual gauge showing max offer vs asking price
- **Scenario Comparison** - Side-by-side flip vs hold vs wholesale analysis

#### 2. Contracts (`app/app/contracts/page.tsx`)
Current: Basic table
Planned:
- **Contract Timeline** - Visual status flow (Draft → Sent → Signed → Closed)
- **Document Preview** - Inline PDF viewer with signature highlights
- **E-Sign Integration** - Send for signature, track status, view history
- **Assignment UI** - Buyer assignment flow with fee calculator
- **Closing Checklist** - Task list with due dates and completion tracking

#### 3. Renovations (`app/app/renovations/page.tsx`)
Current: 40% stub
Planned:
- **Project Cards** - Property photo, progress bar, budget vs actual
- **Scope Builder** - Room-by-room checklist with cost estimates
- **Bid Management** - Vendor comparison table, award/reject actions
- **Timeline View** - Gantt-style chart with milestones
- **Photo Documentation** - Before/during/after gallery with timestamps
- **Change Order Workflow** - Request → Approve → Execute flow

#### 4. Rentals (`app/app/rentals/page.tsx`)
Current: 40% stub
Planned:
- **Property Cards** - Occupancy status, rent roll, lease expiration countdown
- **Tenant Management** - Contact info, payment history, lease documents
- **Rent Collection** - Payment tracking, late fee automation, receipt generation
- **Maintenance Requests** - Ticket system with vendor assignment
- **Financial Dashboard** - Cash flow, NOI, cap rate calculations

#### 5. Analytics (`app/app/analytics/page.tsx`)
Current: Already polished
Planned additions:
- **Drill-down Capability** - Click charts to see underlying data
- **Custom Date Ranges** - Date picker for all metrics
- **Export Options** - PDF reports, CSV data download
- **Saved Views** - User-defined dashboard configurations

#### 6. Settings (`app/app/settings/page.tsx`)
Current: localStorage only
Planned:
- **Server Persistence** - Save settings to database via API
- **Profile Section** - Photo upload, company info, investor type
- **Notification Preferences** - Email/SMS toggle per event type
- **Integration Status** - Connected services with test/reconnect buttons
- **Team Management** - User invites, role assignment (future)

### Frontend Design Patterns

- **Loading**: Use `<Skeleton />` component, not "Loading..." text
- **Cards**: Always include hover states (`hover:shadow-lg hover:-translate-y-0.5`)
- **Colors**: Use semantic colors (emerald=positive, red=negative, amber=warning)
- **Spacing**: Consistent scale - `space-y-8` for sections, `gap-4` for grids
- **Typography**: `tracking-tight` on headlines, `text-muted-foreground` for secondary
- **Icons**: Use colored icons in rounded containers (`w-8 h-8 rounded-lg bg-blue-50`)

### Pre-existing TypeScript Errors (Not from redesign)

These errors exist in `.next/dev/types/` and need separate fix:
- Next.js 16 requires `Promise<params>` pattern in dynamic routes
- Old debug routes still in cache (run `rm -rf .next` to clear)
- Some Prisma type issues with `BidItem` and nullable fields

## Security Status (Fixed 2026-01-28)

All critical security issues have been addressed:
- ✅ All API routes now have proper auth (API key or Clerk)
- ✅ Removed all `prisma.$disconnect()` calls from routes
- ✅ Fixed auth bypass patterns (`!expectedKey || apiKey !== expectedKey`)
- ✅ Deleted `/api/debug/` endpoints
- ✅ Added auth to webhooks, guardrails, and data endpoints

## Testing

```bash
npm run test              # Run Vitest tests
npm run test:ui           # Vitest with UI
npm run typecheck         # TypeScript check
```

## Common Tasks

### Start dev server
```bash
npm run dev               # Default port 3000
PORT=3007 npm run dev     # Custom port
```

### Database operations
```bash
npm run prisma:generate   # Regenerate Prisma client
npm run prisma:migrate    # Run migrations
npm run prisma:studio     # Open database GUI
```

### Run cron jobs
```bash
npm run worker              # Start cron worker (runs all scheduled jobs)
npm run worker:dev          # Start with file watching

# Individual cron jobs
npm run cron:g1             # G1 - Deal Approval monitoring
npm run cron:g2             # G2 - Bid Spread monitoring
npm run cron:g3             # G3 - Invoice/Budget monitoring
npm run cron:g4             # G4 - Change Order monitoring
npm run cron:data-refresh   # Data Refresh & Sync
npm run cron:pipeline       # Pipeline Monitoring
npm run cron:contractors    # Contractor Performance
npm run cron:attom          # ATTOM Property Discovery
npm run cron:skip-trace     # Skip Tracing & Enrichment
npm run cron:all            # Run all cron jobs sequentially
```

## Don't Do

- Don't create new PrismaClient instances in API routes
- Don't call `prisma.$disconnect()` in API routes
- Don't commit credential files (*.json with oauth/credentials in name)
- Don't bypass auth by only checking `if (expectedKey && key !== expectedKey)` - always verify key exists
- Don't add files to root - use appropriate directories (scripts/, docs/, tests/)
