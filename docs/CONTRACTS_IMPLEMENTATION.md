# Contracts Implementation Status

> Documentation of the Contracts feature and the Lead → Offer → Contract pipeline.
> Last Updated: 2026-01-29

## Table of Contents

1. [Current State Overview](#current-state-overview)
2. [Data Flow](#data-flow)
3. [What Exists](#what-exists)
4. [File Reference](#file-reference)
5. [API Reference](#api-reference)

---

## Current State Overview

The contracts feature is **fully implemented** with both backend API and frontend UI complete.

### Pipeline Status

```
✅ LEADS PAGE (Complete)
   • Import properties from REAPI/ATTOM
   • Properties stored with distress scores
   • Filter by distress signals and minimum score

✅ UNDERWRITING PAGE (Complete)
   • Select a property
   • Run deal analysis (ARV, comps, MAO)
   • "Create Offer" button opens offer dialog
   • Creates offer with status = "draft"

✅ OFFERS PAGE (Complete)
   • List all offers with status badges
   • Filter by status (draft, sent, countered, accepted, rejected, expired)
   • Update status via dropdown actions
   • "Create Contract" button for accepted offers
   • View offer details, delete offers
   • CSV export

✅ CONTRACTS PAGE (Complete)
   • Lists all contracts with property info
   • Update status: pending → signed → escrow → closed → cancelled
   • Assign Contract (wholesaler path)
   • Start Renovation (flipper path)
   • Start Rental (landlord path)
   • CSV export
```

---

## Data Flow

### Complete Pipeline

```
Property (Lead)
    ↓
    ├── [User creates offer on underwriting page]
    ↓
Offer (status: draft)
    ↓
    ├── [User marks as sent] → Offer (status: sent)
    ├── [Seller counters] → Offer (status: countered)
    ├── [User accepts counter or seller accepts] → Offer (status: accepted)
    ↓
    ├── [User clicks "Create Contract" on offers page]
    ↓
Contract (status: pending)
    ↓
    ├── Auto-creates 7 closing tasks
    ├── signed → escrow → closed
    ↓
Post-Closing Options:
    ├── Assign (Wholesale) → ContractAssignment
    ├── Renovate (Flip) → DealSpec/Renovation
    └── Rent (Hold) → Rental
```

---

## What Exists

### Navigation

The sidebar includes:
- Leads → Underwriting → **Offers** → Contracts

### API Routes (All Working)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/offers` | POST | Create offer from underwriting |
| `/api/offers` | GET | List all offers (with status filter) |
| `/api/offers/[id]` | GET | Get single offer |
| `/api/offers/[id]` | PATCH | Update offer status/details |
| `/api/offers/[id]` | DELETE | Delete offer |
| `/api/contracts` | POST | Create contract from accepted offer |
| `/api/contracts` | GET | List all contracts |
| `/api/contracts/[id]` | GET | Get single contract |
| `/api/contracts/[id]` | PATCH | Update contract status |
| `/api/contracts/[id]/assign` | POST | Assign contract to buyer |
| `/api/documents/generate-contract` | POST | Generate PDF |
| `/api/documents/send-contract` | POST | Email contract PDF |

### Database Schema (Complete)

**Offer Model:**
- id, userId, propertyId, analysisId
- amount, terms, contingencies (JSON)
- closingDate, expiresAt, earnestMoney
- status: draft | sent | countered | accepted | rejected | expired
- sentAt, responseAt, counterDate
- counterAmount, counterTerms (JSON)
- notes, responseNotes

**Contract Model:**
- id, userId, propertyId, offerId (1:1 with Offer)
- purchasePrice, status, closingDate
- signedAt, escrowOpenedAt, closedAt
- documentUrls (JSON), notes
- Relations: assignment, renovation, rental

**ContractAssignment Model:**
- id, contractId (1:1), buyerId
- assignmentFee, assignmentDate, status
- feeReceived, feeReceivedDate, documentUrls, notes

### UI Pages

**Offers Page (`app/app/offers/page-content.tsx`):**
- Stats: Total Offers, Draft, Sent, Accepted, Total Value
- Table: Property, Owner, Amount, Terms, Status, Contract, Created, Expires
- Filter by status, search by address/city/owner
- Actions per offer:
  - View Details (modal with full offer info)
  - Update Status (change status, add response notes)
  - Create Contract (for accepted offers without contract)
  - View Contract (for offers with contract)
  - Delete
- CSV Export

**Contracts Page (`app/app/contracts/page-content.tsx`):**

Redesigned with "Command Center Elegance" aesthetic (2026-01):

**Compact Metrics Bar:**
- 8 stat chips in horizontal grid: Total, Pending, Signed, Escrow, Closed, Total Value, Avg Days, This Month
- Clickable chips filter the view by status
- Active filter indicated with ring highlight

**Status Pipeline Visualization:**
- Horizontal pipeline showing contract flow: Pending → Signed → Escrow → Closed
- Shows count per status with connecting arrows
- Click stage to filter to that status

**Dual View Modes:**
- **List View**: Enhanced table with better row layout
  - Property address with city/state
  - Purchase price formatted as currency
  - Status badge with status-specific colors
  - Timeline info (days in stage, closing countdown)
  - Assignment indicator if assigned to buyer
  - Workflow badges (renovation/rental icons if linked)
  - Row click opens detail panel

- **Board View (Kanban)**: Pipeline columns
  - 4 columns: Pending, Signed, Escrow, Closed
  - Cards show address, price, days in stage, closing date
  - Buyer assignment shown on cards
  - Visual workflow matching list view

**Slide-Out Detail Panel (Sheet):**
- Replaces modal with right-side slide-out panel (540px max width)
- Tabbed interface:
  - **Overview**: Property info, key dates, notes
  - **Timeline**: Visual timeline of status changes
  - **Documents**: Placeholder for document uploads
  - **Actions**: Update status, assign buyer, start renovation/rental
- Header shows address, status badge, purchase price

**Actions:**
- Update Status (pending → signed → escrow → closed)
- Assign Contract (select buyer, set assignment fee)
- Start Renovation (set budget, target ROI, ARV)
- Start Rental (set monthly rent, mortgage, taxes, insurance)
- CSV Export

---

## File Reference

### Existing Files

| File | Purpose |
|------|---------|
| `app/app/offers/page.tsx` | Offers page wrapper |
| `app/app/offers/page-content.tsx` | Offers management UI (~820 lines) |
| `app/app/contracts/page.tsx` | Contracts page wrapper |
| `app/app/contracts/page-content.tsx` | Contracts UI with visual overhaul (~1800 lines) |
| `app/api/offers/route.ts` | Create/list offers |
| `app/api/offers/[id]/route.ts` | Get/update/delete offer |
| `app/api/contracts/route.ts` | Create/list contracts (includes demo data logic) |
| `app/api/contracts/[id]/route.ts` | Get/update/delete contract |
| `app/api/contracts/[id]/assign/route.ts` | Assign to buyer |
| `app/api/documents/generate-contract/route.ts` | PDF generation |
| `app/api/documents/send-contract/route.ts` | Email sending |
| `lib/pdf-templates/contract-template.tsx` | PDF template |
| `lib/email.ts` | Email service (Postmark) |
| `prisma/schema.prisma` | Database schema |
| `scripts/seed-contracts.ts` | Seed demo contract data |
| `components/ui/sheet.tsx` | Slide-out panel component |

---

## API Reference

### Create Offer (from Underwriting)
```typescript
POST /api/offers
{
  propertyId: string,      // Required
  amount: number,          // Required
  terms?: string,
  contingencies?: string[],
  closingDate?: string,
  expiresAt?: string,
  earnestMoney?: number,
  notes?: string
}
// Returns: { offer: Offer }
// Initial status: "draft"
```

### Update Offer Status
```typescript
PATCH /api/offers/[id]
{
  status: "draft" | "sent" | "countered" | "accepted" | "rejected" | "expired",
  counterAmount?: number,    // If countered
  counterTerms?: object,     // If countered
  responseNotes?: string
}
// Returns: { offer: Offer }
// Auto-sets: sentAt, responseAt, counterDate based on status
```

### Create Contract from Accepted Offer
```typescript
POST /api/contracts
{
  offerId: string,         // Required - must have status "accepted"
  closingDate?: string,
  notes?: string
}
// Returns: { contract: Contract }
// Auto-creates: 7 closing tasks with due dates
// Sets: purchasePrice from offer.amount, status = "pending"
```

### Update Contract Status
```typescript
PATCH /api/contracts/[id]
{
  status: "pending" | "signed" | "escrow" | "closed" | "cancelled",
  closingDate?: string,
  notes?: string
}
// Returns: { contract: Contract }
// Auto-sets: signedAt, escrowOpenedAt, closedAt based on status
```

### Assign Contract (Wholesale)
```typescript
POST /api/contracts/[id]/assign
{
  buyerId: string,         // Required
  assignmentFee: number,   // Required
  assignmentDate?: string,
  notes?: string
}
// Returns: { assignment: ContractAssignment }
```

---

## Notes

1. **Authentication:** Both offers and contracts APIs use Clerk authentication properly.

2. **Validation:** Contract creation validates offer is "accepted" - this is correct behavior.

3. **Auto-Tasks:** When contract is created, 7 closing tasks are auto-generated with smart due dates relative to closing date.

4. **Status Flow:**
   - Offers: draft → sent → (countered ↔) → accepted/rejected/expired
   - Contracts: pending → signed → escrow → closed (or cancelled at any point)

5. **Post-Closing:** After contract status = "closed", user can:
   - Assign (wholesale path)
   - Start Renovation (flip path)
   - Start Rental (hold path)

6. **Demo Data System:** The contracts API includes demo data logic for pre-beta preview:
   - Admin account (`tannercarlson@vvsvault.com`) sees only their own data
   - Demo user account (`tanner@claritydigital.dev`) sees their own data
   - All other users see demo data (marked with `isDemo: true`) + their own data
   - Demo contracts can be seeded using `npx tsx scripts/seed-contracts.ts`

7. **UI Components Used:**
   - `Sheet` (Radix Dialog) for slide-out detail panel
   - `Tabs` for view switching (List/Board) and detail panel sections
   - `ScrollArea` for scrollable content areas
   - `Badge` for status indicators
   - `Card` for stat chips and kanban cards

---

## Seeding Demo Data

To populate demo contracts for testing:

```bash
cd flipops-site
npx tsx scripts/seed-contracts.ts
```

This creates:
- 12 contracts (3 pending, 2 signed, 3 escrow, 4 closed)
- 2 buyer assignments on closed contracts
- 1 renovation project
- 1 rental property
- 2 buyers for assignments

The script cleans up existing seeded data before re-seeding (identified by `dataSource: 'seed-script'` on properties).

---

## Status Color Palette

```typescript
const STATUS_CONFIG = {
  pending: {
    bg: "bg-amber-100 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-400",
    iconColor: "text-amber-500"
  },
  signed: {
    bg: "bg-blue-100 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-400",
    iconColor: "text-blue-500"
  },
  escrow: {
    bg: "bg-purple-100 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-400",
    iconColor: "text-purple-500"
  },
  closed: {
    bg: "bg-emerald-100 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-400",
    iconColor: "text-emerald-500"
  },
  cancelled: {
    bg: "bg-red-100 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-400",
    iconColor: "text-red-500"
  }
};
```
