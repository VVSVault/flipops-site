# Offers & Contracts System

This document describes the offers and contracts management system in FlipOps.

## Overview

The offers/contracts flow allows users to:
1. Create offers from the Underwriting page
2. Track offer status (draft, sent, accepted, rejected, countered, expired)
3. Convert accepted offers into contracts
4. Manage contract lifecycle through closing

## Database Models

### Offer Model
```prisma
model Offer {
  id              String    @id @default(cuid())
  userId          String
  propertyId      String
  analysisId      String?   // Optional link to deal analysis
  amount          Float
  terms           String?   // cash, conventional, fha, etc.
  contingencies   String?   // JSON array of contingencies
  closingDate     DateTime?
  expiresAt       DateTime?
  earnestMoney    Float?
  dueDate         DateTime?
  status          String    @default("draft")
  sentAt          DateTime?
  responseAt      DateTime?
  responseNotes   String?
  counterAmount   Float?
  counterTerms    String?   // JSON object
  counterDate     DateTime?
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### Contract Model
```prisma
model Contract {
  id              String    @id @default(cuid())
  userId          String
  propertyId      String
  offerId         String    @unique
  purchasePrice   Float
  status          String    @default("pending")
  signedAt        DateTime?
  escrowOpenedAt  DateTime?
  closingDate     DateTime?
  closedAt        DateTime?
  documentUrls    String?   // JSON array
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

## API Endpoints

### Offers API

#### `POST /api/offers`
Create a new offer.

**Request Body:**
```json
{
  "propertyId": "string (required)",
  "amount": "number (required)",
  "terms": "string (optional)",
  "contingencies": ["string array (optional)"],
  "closingDate": "ISO date string (optional)",
  "expiresAt": "ISO date string (optional)",
  "earnestMoney": "number (optional)",
  "notes": "string (optional)"
}
```

**Response:** `201 Created` with the created offer object.

#### `GET /api/offers`
Get all offers for the authenticated user.

**Query Parameters:**
- `status`: Filter by status (draft, sent, countered, accepted, rejected, expired)
- `propertyId`: Filter by property ID

**Response:** `200 OK` with array of offers.

#### `GET /api/offers/[id]`
Get a single offer by ID.

#### `PATCH /api/offers/[id]`
Update an offer (status, counter-offer, etc.).

**Request Body:** Any fields to update:
```json
{
  "status": "string",
  "amount": "number",
  "counterAmount": "number",
  "counterTerms": "object",
  "responseNotes": "string"
}
```

Auto-sets timestamps:
- `sentAt` when status changes to "sent"
- `responseAt` when status changes to "accepted", "rejected", or "countered"
- `counterDate` when counter offer is recorded

#### `DELETE /api/offers/[id]`
Delete an offer.

### Contracts API

#### `POST /api/contracts`
Create a contract from an accepted offer.

**Request Body:**
```json
{
  "offerId": "string (required)",
  "closingDate": "ISO date string (optional)",
  "notes": "string (optional)"
}
```

**Validation:**
- Offer must exist and belong to the user
- Offer status must be "accepted"
- No existing contract for this offer

**Side Effects:**
- If `closingDate` is provided, automatically creates closing tasks:
  - Schedule home inspection (21 days before)
  - Order appraisal (21 days before)
  - Apply for financing (30 days before)
  - Review title report (14 days before)
  - Schedule final walkthrough (2 days before)
  - Prepare closing documents (3 days before)
  - Wire closing funds (1 day before)

#### `GET /api/contracts`
Get all contracts for the authenticated user.

**Response:** Includes related property, offer, assignment, renovation, and rental data.

## UI Components

### Offers Page (`/app/offers/page.tsx`)

Completely redesigned with "Command Center Elegance" aesthetic (2026-01):

**Layout:**
- Premium stat chips bar (Total, Pending, Countered, Won, Needs Contract, Conversion Rate)
- Grid/List toggle for card vs compact list views
- Search and status filter dropdown
- Bulk export to CSV

**OfferCard Component:**
- Status-colored gradient top bar (blue=sent, amber=countered, emerald=accepted, red=rejected, gray=expired)
- Property info with owner avatar initials
- Offer amount vs ARV side-by-side display
- Counter offer highlighting in amber when status is "countered"
- 4-step status timeline (Draft → Sent → Response → Outcome)
- Contract integration badge (shows "Needs Contract" warning for accepted offers)
- Expiration badges with urgency indicators (red=urgent, amber=days left)
- Terms badge (Cash/Financing) and closing date in footer

**Embedded Components:**
- `StatChip` - Horizontal stat display with icons and trends
- `StatusTimeline` - 4-step visual progress with state indicators
- `StatusIndicator` - Pill badges with icons and pulse animation
- `ExpirationBadge` - Color-coded urgency indicators
- `OfferCard` / `OfferCardSkeleton` - Main card and loading state

**Dialogs:**
- Details Dialog - Full offer information display
- Update Status Dialog - Change status with response notes
- Create Contract Dialog - Convert accepted offers to contracts

**Seed Data:**
- `app/app/offers/seed-data.ts` - 12 sample offers covering all statuses

### Contracts Page (`/app/contracts/page.tsx`)

Redesigned with "Command Center Elegance" aesthetic (2026-01):

**Layout:**
- Compact metrics bar with 8 stat chips (Total, Pending, Signed, Escrow, Closed, Total Value, Avg Days, This Month)
- Status pipeline visualization showing contract flow
- Dual view modes: List View (table) and Board View (kanban)
- Slide-out detail panel (Sheet) instead of modal

**ContractCard Component (Board View):**
- Status-colored left border
- Property address and city/state
- Purchase price
- Days in stage indicator
- Closing date (if set)
- Buyer assignment info (if assigned)
- Workflow icons (renovation/rental if linked)

**Detail Panel (Sheet):**
- Tabbed interface: Overview | Timeline | Documents | Actions
- Overview tab: Property info, key dates, notes
- Timeline tab: Visual status progression
- Documents tab: Placeholder for uploads
- Actions tab: Update status, assign buyer, start renovation/rental

**Embedded Components:**
- `StatChip` - Compact stat display with icon
- `StatusPipeline` - Visual pipeline with counts
- `ContractCard` - Kanban card component
- `StatusBadge` - Color-coded status pills

### Create Contract Dialog

When creating a contract from an accepted offer:
- Shows property address and purchase price
- **Date Picker** for expected closing date (custom shadcn component)
- Optional notes field

### Date Picker Component

Custom date picker using `react-day-picker` v9 with Popover:

**Files:**
- `components/ui/calendar.tsx` - Calendar component
- `components/ui/date-picker.tsx` - DatePicker wrapper

**Features:**
- Clean popover-based UI (no browser native date input flash)
- Navigation arrows positioned beside month/year header
- Dark mode support
- Displays selected date as "January 27th, 2026" format

## Authentication

All API endpoints use Clerk authentication:

```typescript
const { userId: clerkId } = await auth();

if (!clerkId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Get internal user ID from Clerk ID
const user = await prisma.user.findUnique({
  where: { clerkId },
  select: { id: true },
});
```

This pattern:
1. Gets the Clerk user ID from the session
2. Looks up the internal database user ID
3. Uses the internal ID for all database queries

## Offer Status Flow

```
draft → sent → accepted → [Create Contract]
            → rejected
            → countered → accepted/rejected
            → expired
```

## Contract Status Flow

```
pending → signed → escrow_opened → closed
                                 → cancelled
```

## Dependencies

- `react-day-picker` v9 - Calendar/date picker
- `date-fns` - Date formatting utilities
- `@clerk/nextjs` - Authentication
- `@prisma/client` - Database ORM

## Files Modified/Created

### API Routes
- `app/api/offers/route.ts` - Create/list offers (POST, GET)
- `app/api/offers/[id]/route.ts` - Get/update/delete single offer (GET, PATCH, DELETE)
- `app/api/contracts/route.ts` - Create/list contracts

### UI Components
- `app/app/offers/page.tsx` - Offers page (redesigned 2026-01, ~1,260 lines)
- `app/app/offers/seed-data.ts` - 12 sample offers for demo/development
- `app/app/contracts/page-content.tsx` - Contracts page (redesigned 2026-01, ~1,800 lines)
- `components/ui/calendar.tsx` - Calendar component
- `components/ui/date-picker.tsx` - DatePicker component
- `components/ui/sheet.tsx` - Slide-out panel component
- `scripts/seed-contracts.ts` - Demo contract data seeding

### Navigation
- `app/app/layout.tsx` - Added "Offers" and "Contracts" to sidebar navigation
