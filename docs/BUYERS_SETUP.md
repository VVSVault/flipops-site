# Buyers & Disposition System

This document describes the buyers and disposition management system in FlipOps.

## Overview

The Buyers & Disposition page allows users to:
1. Manage a network of buyers for wholesale deals
2. Track buyer preferences (buy box criteria)
3. Assign contracts to buyers
4. Match deals with appropriate buyers using AI-powered matching
5. Run marketing campaigns to buyers
6. Track buyer offers on contracts

## Database Models

### Buyer Model
```prisma
model Buyer {
  id              String    @id @default(cuid())
  userId          String    // Multi-tenant: wholesaler owner
  name            String
  email           String?
  phone           String?
  company         String?
  propertyTypes   String?   // JSON array
  minPrice        Float?
  maxPrice        Float?
  targetMarkets   String?   // JSON array
  cashBuyer       Boolean   @default(false)
  dealsClosed     Int       @default(0)
  totalRevenue    Float     @default(0)
  reliability     String    @default("unknown")  // "unknown", "reliable", "unreliable"
  notes           String?
  assignments     ContractAssignment[]
  buyerOffers     BuyerOffer[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### ContractAssignment Model
```prisma
model ContractAssignment {
  id              String    @id @default(cuid())
  contractId      String    @unique  // One-to-one with contract
  buyerId         String    // Which buyer
  assignmentFee   Float
  assignmentDate  DateTime?
  status          String    @default("pending")  // "pending", "signed", "closed", "cancelled"
  feeReceived     Boolean   @default(false)
  feeReceivedDate DateTime?
  documentUrls    String?   // JSON array
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### BuyerOffer Model
```prisma
model BuyerOffer {
  id              String    @id @default(cuid())
  userId          String    // Multi-tenant
  contractId      String    // Contract being offered on
  buyerId         String    // Buyer making the offer
  offerPrice      Float
  terms           String?
  earnestMoney    Float?
  closingDays     Int?
  contingencies   String?   // JSON array
  expiresAt       DateTime?
  status          String    @default("submitted")  // "submitted", "countered", "accepted", "rejected", "expired"
  submittedAt     DateTime  @default(now())
  responseAt      DateTime?
  responseNotes   String?
  counterAmount   Float?
  counterTerms    String?   // JSON object
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### Campaign Model
```prisma
model Campaign {
  id              String    @id @default(cuid())
  userId          String    // Multi-tenant
  contractId      String?   // Optional link to a specific contract
  name            String
  subject         String?   // Email subject line
  message         String    // Campaign message content
  method          String    @default("email")  // "email", "sms", "both"
  buyerIds        String?   // JSON array of buyer IDs
  recipientCount  Int       @default(0)
  status          String    @default("draft")  // "draft", "scheduled", "sent", "cancelled"
  scheduledAt     DateTime?
  sentAt          DateTime?
  openCount       Int       @default(0)
  clickCount      Int       @default(0)
  replyCount      Int       @default(0)
  offerCount      Int       @default(0)
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

## API Endpoints

### Buyers API

#### `POST /api/buyers`
Create a new buyer.

#### `GET /api/buyers`
Get all buyers for the authenticated user.

#### `GET /api/buyers/[id]`
Get a single buyer by ID with recent assignments.

#### `PATCH /api/buyers/[id]`
Update a buyer.

#### `DELETE /api/buyers/[id]`
Delete a buyer.

### Contract Assignment API

#### `POST /api/contracts/[id]/assign`
Assign a contract to a buyer.

#### `GET /api/contracts/[id]/assign`
Get assignment details for a contract.

### Buyer Offers API

#### `POST /api/buyer-offers`
Create a new buyer offer on a contract.

**Request Body:**
```json
{
  "contractId": "string (required)",
  "buyerId": "string (required)",
  "offerPrice": "number (required)",
  "terms": "string (optional)",
  "earnestMoney": "number (optional)",
  "closingDays": "number (optional)",
  "contingencies": ["array of strings (optional)"],
  "expiresAt": "ISO date string (optional)",
  "notes": "string (optional)"
}
```

#### `GET /api/buyer-offers`
Get all buyer offers for the authenticated user.

**Query Parameters:**
- `contractId`: Filter by contract
- `buyerId`: Filter by buyer
- `status`: Filter by status (submitted, countered, accepted, rejected, expired)

#### `GET /api/buyer-offers/[id]`
Get a single buyer offer.

#### `PATCH /api/buyer-offers/[id]`
Update a buyer offer (status, counter-offer, etc.).

#### `DELETE /api/buyer-offers/[id]`
Delete a buyer offer. Cannot delete accepted offers.

### Smart Matching API

#### `GET /api/smart-matching`
Get AI-powered buyer matches for a contract.

**Query Parameters:**
- `contractId`: Required - the contract to match buyers for
- `limit`: Optional - max number of matches to return (default 10)

**Response:**
```json
{
  "matches": [
    {
      "buyerId": "string",
      "buyerName": "string",
      "buyerCompany": "string | null",
      "buyerEmail": "string | null",
      "buyerPhone": "string | null",
      "score": "number (0-100)",
      "reasons": ["string array of match reasons"],
      "priceMatch": "boolean",
      "marketMatch": "boolean",
      "cashBuyer": "boolean",
      "reliability": "string",
      "dealsClosed": "number"
    }
  ],
  "contract": { ... },
  "totalBuyers": "number",
  "matchedBuyers": "number"
}
```

**Matching Algorithm:**
- **Price Match (30 pts)** - Contract price within buyer's min/max range
- **Market Match (25 pts)** - Contract property location matches buyer's target markets
- **Property Type Match (15 pts)** - Contract property type matches buyer's preferences
- **Cash Buyer Bonus (10 pts)** - Buyer is a cash buyer for fast close
- **Reliability Bonus (10 pts)** - Buyer has "reliable" status
- **Deal History Bonus (10 pts max)** - Based on buyer's dealsClosed count

### Campaigns API

#### `POST /api/campaigns`
Create a new marketing campaign.

**Request Body:**
```json
{
  "name": "string (required)",
  "contractId": "string (optional)",
  "subject": "string (optional)",
  "message": "string (required)",
  "method": "string (optional, default 'email')",
  "buyerIds": ["array of strings (optional)"],
  "scheduledAt": "ISO date string (optional)",
  "notes": "string (optional)"
}
```

#### `GET /api/campaigns`
Get all campaigns for the authenticated user.

**Query Parameters:**
- `status`: Filter by status (draft, scheduled, sent, cancelled)
- `contractId`: Filter by contract

#### `GET /api/campaigns/[id]`
Get a single campaign.

#### `PATCH /api/campaigns/[id]`
Update a campaign.

#### `DELETE /api/campaigns/[id]`
Delete a campaign. Cannot delete sent campaigns.

## UI Components

### Buyers Page (`/app/buyers`)

**Tabs:**
- **Overview** - Dashboard with key metrics and recent activity
- **Buyers** - Full buyer list with search, filters, grid/list view toggle
- **Active Listings** - Properties available for assignment (connects to contracts)
- **Smart Matching** - AI-powered buyer-to-property matching
- **Blast Campaigns** - Email/SMS campaign management
- **Offers** - Buyer offers on contracts

**Header Stats (Horizontal Stat Chips):**
- Active Buyers (blue)
- VIP Buyers (amber)
- Active Listings (purple)
- Pending Offers (emerald)
- Avg Assignment (emerald)
- Cash Buyers (rose)

## Fully Implemented Features

### 1. Buyer CRUD Operations
- Add Buyer Dialog with all fields
- Edit Buyer Dialog with pre-populated data
- View Buyer Details Dialog
- Delete with confirmation

### 2. Search & Filters
- Search by name, entity, markets
- Filter by status, score range, market, performance level
- Grid/List view toggle

### 3. Buyers Grid View (NEW - Jan 30, 2026)
- Card-based layout with status-colored top borders
- VIP=amber, Active=emerald, Inactive=gray, Blacklisted=rose
- Avatar with initials, badges, market tags
- Metrics: Score, Deals, POF status
- Contact buttons (Email, Call)
- Hover shadow effect

### 4. Active Listings Tab
- Fetches contracts from `/api/contracts`
- Shows loading and empty states
- "Assign to Buyer" button for unassigned contracts
- Assignment Dialog for buyer selection and fee input
- Status-colored top borders on cards (active=emerald, assigned=blue, pending=amber, closed=gray)
- ScrollArea for long lists (Jan 30, 2026)

### 5. CSV Import
- File upload or paste data
- Parses common header variations
- Budget parsing supports "200k-400k" format

### 6. Contract Assignment
- Assignment Dialog with buyer dropdown
- Fee input and notes field
- Creates ContractAssignment record

### 7. Smart Matching Tab
- Select a contract from Active Listings
- Click "Run AI Matching" to call `/api/smart-matching`
- Shows ranked buyer matches with scores and reasons
- Call/Email buttons for matched buyers
- Loading state during API call

### 8. Buyer Offers Tab
- Fetches offers from `/api/buyer-offers`
- Shows loading and empty states
- Displays offers with property, buyer, price, terms, status
- Accept/Counter/Decline buttons with API integration
- Counter offer prompts for new amount

### 9. Blast Campaigns Tab
- Campaign Builder form with:
  - Listing selection
  - Audience selection (AI Matched, VIP, All buyers)
  - Subject and message fields
  - Email/SMS checkboxes
- Fetches campaigns from `/api/campaigns`
- Recent Campaigns list with:
  - Status badge
  - Recipient count
  - Open/Click/Reply/Offer metrics
  - Method badge (Email, SMS, Email + SMS)

## Authentication

All API endpoints use Clerk authentication with the `getAuthenticatedUserId()` helper pattern.

## Files

### API Routes
- `app/api/buyers/route.ts` - Create/list buyers
- `app/api/buyers/[id]/route.ts` - Get/update/delete single buyer
- `app/api/contracts/[id]/assign/route.ts` - Contract assignments
- `app/api/buyer-offers/route.ts` - Create/list buyer offers (NEW)
- `app/api/buyer-offers/[id]/route.ts` - Get/update/delete buyer offers (NEW)
- `app/api/smart-matching/route.ts` - Smart matching algorithm (NEW)
- `app/api/campaigns/route.ts` - Create/list campaigns (NEW)
- `app/api/campaigns/[id]/route.ts` - Get/update/delete campaigns (NEW)

### UI Components
- `app/app/buyers/page.tsx` - Main buyers page with all dialogs and handlers

### Type Definitions
- `app/app/buyers/seed-data.ts` - Type definitions

## What's Still UI-Only (Not Implemented)

1. **Buy Box column** - Shows "Not set" (no buy box API)
2. **Performance column** - Shows "No history" (no performance tracking API)
3. **Documents column** - Shows "No POF" (no documents API)
4. **CRM Integration** - UI buttons only, no actual integrations
5. **Actual email/SMS sending** - Campaigns are created but not sent

## Setup Required

After pulling the latest code with the new `BuyerOffer` and `Campaign` models, you need to run:

```bash
# Push schema changes to database
npx prisma db push

# Regenerate Prisma client
npx prisma generate
```

**Note:** The dev server must be stopped before running `prisma generate` to avoid file lock issues on Windows.

## Dependencies

- `@clerk/nextjs` - Authentication
- `@prisma/client` - Database ORM
- `sonner` - Toast notifications
- shadcn/ui components - Dialog, Button, Input, Table, Badge, etc.

## UI Improvements (January 30, 2026)

### Theme Consistency Updates
The Buyers page was updated to match the established UI patterns from Campaigns and Offers pages:

1. **Horizontal Stat Chips** - Replaced vertical stat cards with horizontal scrolling chips
2. **Grid/List View Toggle** - Added view mode toggle for Buyers list
3. **Status-Colored Borders** - Added gradient top borders to buyer cards and listing cards
4. **Enhanced Empty States** - Gradient icon containers with action buttons
5. **Improved Table Styling** - Better hover states, muted text for empty values
6. **ScrollArea for Active Listings** - Long lists now scroll properly

See `docs/development/UI-DECISIONS.md` for detailed implementation notes.
