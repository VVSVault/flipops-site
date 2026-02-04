# Campaigns System

This document describes the campaigns management system in FlipOps for outreach automation.

## Overview

The campaigns system allows users to:
1. Create multi-step outreach campaigns (SMS, Email, Voicemail, Letter)
2. Target specific audience segments with filters
3. Track campaign performance (sends, replies, sentiment, conversions)
4. A/B test messaging variations
5. View detailed analytics and delivery logs

## Database Models

### Campaign Model
```prisma
model Campaign {
  id            String    @id @default(cuid())
  userId        String
  name          String
  message       String
  subject       String?
  method        String?   // sms, email, voicemail, letter
  status        String    @default("draft")  // draft, running, paused, completed
  scheduledAt   DateTime?
  sentAt        DateTime?
  notes         String?
  contractId    String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

## Data Structures

### Frontend Campaign Object
```typescript
interface Campaign {
  id: string;
  name: string;
  status: "running" | "paused" | "completed" | "draft";
  objective: "inbound" | "reengage" | "disposition";
  channels: string[];  // ["sms", "email", "voicemail", "letter"]
  audience: {
    size: number;
    filters: string[];  // ["Probate", "High Equity", "Miami-Dade"]
  };
  metrics: {
    sends: number;
    delivered: number;
    replies: number;
    positive: number;
    contracts: number;
    cost: number;
    revenue?: number;
  };
  progress: number;  // 0-100
  abTest: boolean;
  lastRun: Date | null;
  createdAt: Date;
}
```

### Campaign Analytics
```typescript
interface CampaignAnalytics {
  stepFunnel: Array<{
    step: string;      // "Step 1 - Initial SMS"
    sent: number;
    delivered: number;
    replied: number;
    positive: number;
  }>;
  channelPerformance: Array<{
    channel: string;   // "SMS", "Email", "Voicemail"
    sends: number;
    replyRate: number;
    cost: number;
  }>;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
    unclassified: number;
  };
  geographicPerformance: Array<{
    location: string;
    sends: number;
    replies: number;
    contracts: number;
  }>;
}
```

## API Endpoints

### Campaigns API

#### `POST /api/campaigns`
Create a new campaign.

**Request Body:**
```json
{
  "name": "string (required)",
  "message": "string (required)",
  "subject": "string (optional)",
  "method": "string (optional)",
  "contractId": "string (optional)",
  "buyerIds": ["string array (optional)"],
  "scheduledAt": "ISO date string (optional)",
  "notes": "string (optional)"
}
```

**Response:** `201 Created` with the created campaign object.

#### `GET /api/campaigns`
Get all campaigns for the authenticated user.

**Query Parameters:**
- `status`: Filter by status (draft, running, paused, completed)
- `contractId`: Filter by contract ID

**Response:** `200 OK` with array of campaigns including contract and property details.

#### `GET /api/campaigns/[id]`
Get a single campaign by ID.

#### `PATCH /api/campaigns/[id]`
Update a campaign (status, settings, etc.).

**Request Body:** Any fields to update:
```json
{
  "name": "string",
  "status": "string",
  "message": "string",
  "scheduledAt": "ISO date string"
}
```

#### `DELETE /api/campaigns/[id]`
Delete a campaign.

## UI Components

### Campaigns List Page (`/app/campaigns/page.tsx`)

Completely redesigned with "Command Center Elegance" aesthetic (2026-01):

**Layout:**
- Premium stat chips bar (Active, Sent, Reply Rate, Contracts, Cost, ROI)
- Grid/List toggle for card vs compact list views
- Search, status filter, and objective filter dropdowns
- Campaign wizard dialog for creation

**CampaignCard Component:**
- Status-colored gradient top bar (emerald=running, amber=paused, blue=draft, gray=completed)
- Animated SVG progress ring showing campaign completion
- Sparkline chart for reply rate trend visualization
- 3-column metrics grid (Sent, Replies, Deals)
- Channel badges with icons (SMS, Email, Voicemail, Letter)
- Cost per deal calculation
- Last run date display
- Status indicator with pulse animation for running campaigns

**Embedded Components:**
- `Sparkline` - SVG mini trend chart with gradient fill
- `ProgressRing` - SVG circular progress indicator
- `StatusIndicator` - Pill badges with pulse animation
- `ChannelBadges` - Multi-channel visual indicators
- `CampaignCard` / `CampaignCardSkeleton` - Main card and loading state
- `StatChip` - Horizontal stats bar

**Actions Dropdown:**
- View Details → Opens CampaignDetail view
- Pause/Resume/Launch → Status changes
- Duplicate → Copy campaign
- Archive → Remove from active list

### Campaign Detail View (`/app/app/components/campaign-detail.tsx`)

Detailed analytics view when clicking a campaign card:

**Header Section:**
- Back button to campaigns list
- Campaign name and status badge
- Action buttons (Pause/Resume, Edit Settings, Export)

**Key Metrics Bar (7 stat chips):**
- Audience size
- Messages sent
- Delivery rate (%)
- Replies (with %)
- Positive replies (with %)
- Contracts closed
- Total cost (with $/msg)

**Progress Bar:**
- Inline progress indicator with percentage
- Spinning refresh icon when simulating

**5 Tabbed Views:**

1. **Overview Tab**
   - Step Funnel (vertical stacked progress bars per step)
   - Channel Performance (visual cards with gradient bars)
   - Sentiment Analysis (2x2 grid with icons)

2. **Analytics Tab**
   - Time range selector (24h, 7d, 30d, All Time)
   - Geographic Performance table
   - A/B Test Results (if enabled)

3. **Deliveries Tab**
   - Individual message delivery log
   - Lead name, property, step, channel, status, sentiment, timestamp, cost

4. **Audience Tab**
   - Filter badges showing targeting criteria
   - Total matched leads count
   - Sample lead preview list

5. **Settings Tab**
   - Compliance settings (DNC check, consent, quiet hours, opt-out)
   - Throttle settings (max per day/hour, current rate)

**Step Funnel Card:**
- Vertical stacked rows per campaign step
- Each row shows: step name | progress bar with stats | sent count
- Progress bar displays: delivered • replied • positive

**Channel Performance Card:**
- Visual card per channel (SMS, Email, Voicemail)
- Color-coded backgrounds (blue, purple, orange)
- Lucide icons (MessageSquare, Mail, Phone)
- Gradient progress bar for reply rate
- Summary row with totals

**Sentiment Analysis Card:**
- 2x2 grid layout with cards per sentiment
- Lucide icons (TrendingUp, Minus, TrendingDown, HelpCircle)
- Percentage display and count
- Mini progress bars per sentiment
- Stacked gradient bar at bottom
- Total replies and actionable percentage

### Campaign Wizard

Multi-step campaign creation flow:
1. Campaign name and objective selection
2. Audience targeting (filters, size preview)
3. Channel selection (multi-select)
4. Message composition (templates, A/B variants)
5. Schedule and review

**Seed Data:**
- `app/app/campaigns/seed-data.ts` - Campaign templates and sample data

## Campaign Status Flow

```
draft → running → paused → running → completed
                         ↓
                    completed
```

## Authentication

All API endpoints use Clerk authentication:

```typescript
const { userId: clerkId } = await auth();

if (!clerkId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const user = await prisma.user.findUnique({
  where: { clerkId },
  select: { id: true },
});
```

## Files

### API Routes
- `app/api/campaigns/route.ts` - Create/list campaigns (POST, GET)
- `app/api/campaigns/[id]/route.ts` - Get/update/delete single campaign

### UI Components
- `app/app/campaigns/page.tsx` - Campaigns list page (~971 lines)
- `app/app/campaigns/seed-data.ts` - Sample campaigns and templates
- `app/app/components/campaign-detail.tsx` - Campaign detail view (~796 lines)
- `components/campaigns/` - Campaign-specific components (wizard, etc.)

### Shared Components Used
- `components/ui/card.tsx` - Card containers
- `components/ui/progress.tsx` - Progress bars
- `components/ui/badge.tsx` - Status badges
- `components/ui/tabs.tsx` - Tab navigation
- `components/ui/table.tsx` - Data tables
- `components/ui/scroll-area.tsx` - Scrollable containers
- `components/ui/select.tsx` - Dropdown selects

## Dependencies

- `lucide-react` - Icons (MessageSquare, Mail, Phone, TrendingUp, etc.)
- `@clerk/nextjs` - Authentication
- `@prisma/client` - Database ORM
- `class-variance-authority` - Component variants
- `tailwind-merge` - Class name merging
