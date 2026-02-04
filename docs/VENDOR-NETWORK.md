# FlipOps Vendor Network System

## Overview

The Vendor Network System provides a two-tier vendor management architecture:

1. **Platform Vendors** - Pre-populated vendors sourced from public data (Google Places API), shared across all users in a market
2. **User Vendors** - Private vendors manually added by individual users

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MARKET                                   │
│                   (Jacksonville, FL)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ PlatformVendor 1 │  │ PlatformVendor 2 │  │ PlatformVendor│  │
│  │ (Acme Roofing)   │  │ (Best Plumbing)  │  │ (Pro Electric)│  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                      │                    │          │
│           └──────────────────────┼────────────────────┘          │
│                                  │                               │
│                    ┌─────────────┴─────────────┐                 │
│                    │  UserVendorRelationship   │                 │
│                    │  (User-specific data:     │                 │
│                    │   notes, personal rating, │                 │
│                    │   favorite, tags)         │                 │
│                    └─────────────┬─────────────┘                 │
│                                  │                               │
└──────────────────────────────────┼───────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │            USER             │
                    │                             │
                    │  ┌───────────────────────┐  │
                    │  │      UserVendor       │  │
                    │  │  (Private vendor:     │  │
                    │  │   "My buddy Joe's     │  │
                    │  │    Handyman Service") │  │
                    │  └───────────────────────┘  │
                    │                             │
                    │  ┌───────────────────────┐  │
                    │  │      VendorJob        │  │
                    │  │  (Job history with    │  │
                    │  │   any vendor type)    │  │
                    │  └───────────────────────┘  │
                    └─────────────────────────────┘
```

## Data Models

### Market
Geographic area for vendor grouping. Platform vendors belong to markets.

```typescript
{
  id: string
  name: "Jacksonville, FL"     // Display name
  city: "Jacksonville"
  state: "FL"
  country: "US"
  latitude: 30.3322
  longitude: -81.6557
  radiusMiles: 50              // Default search radius
  isActive: true               // Actively sourcing vendors here
}
```

### PlatformVendor
Shared vendor from public data sources (Google Places, Yelp).

```typescript
{
  id: string
  marketId: string             // Which market this vendor is in

  // Business info
  name: "Acme Roofing Solutions"
  description: "Family-owned roofing company since 1985"

  // Location
  address: "123 Main St"
  city: "Jacksonville"
  state: "FL"
  zip: "32256"
  latitude: 30.2849
  longitude: -81.5553

  // Contact
  phone: "(904) 555-1234"
  email: "contact@acmeroofing.com"
  website: "https://acmeroofing.com"

  // Categories (can have multiple)
  categories: ["ROOFER", "GENERAL_CONTRACTOR"]

  // Source tracking
  source: "GOOGLE_PLACES"
  googlePlaceId: "ChIJ..."
  sourceRating: 4.7
  sourceReviewCount: 127

  // Status
  status: "ACTIVE"
  isVerified: false            // FlipOps manual verification
  isPartner: false             // Future partner program

  // Data freshness
  lastRefreshedAt: "2026-01-15T..."
}
```

### UserVendor
Private vendor created by a user (not shared).

```typescript
{
  id: string
  userId: string               // Owner

  // Business info
  name: "Joe's Handyman Service"
  contactName: "Joe Smith"

  // Location (optional)
  city: "Jacksonville"
  state: "FL"

  // Contact
  phone: "(904) 555-9999"
  email: "joe@gmail.com"

  // Categories
  categories: ["GENERAL_CONTRACTOR", "PAINTER"]
  tags: ["reliable", "cheap", "friend"]

  // User's assessment
  personalRating: 5.0
  notes: "Known him for 10 years, always does great work"
  isFavorite: true
  isPreferred: true

  availabilityStatus: "available"
}
```

### UserVendorRelationship
Junction table linking a user to a platform vendor with user-specific data.

```typescript
{
  id: string
  userId: string
  platformVendorId: string

  // User-specific data (doesn't affect platform vendor)
  personalRating: 4.5          // User's rating (vs Google's rating)
  notes: "Used them for 3 projects, very professional"
  tags: ["go-to", "quick response"]
  isFavorite: true
  isPreferred: false

  // Contact override (if user has better contact info)
  contactName: "Mike (project manager)"
  contactPhone: "(904) 555-1234 ext. 5"
  contactEmail: "mike@acmeroofing.com"

  // Tracking
  addedAt: "2025-06-15T..."
  lastContactedAt: "2026-01-10T..."
  lastUsedAt: "2025-12-20T..."
}
```

### VendorJob
Track job history with any vendor (platform or user-created).

```typescript
{
  id: string
  userId: string

  // Vendor link (one of these is set)
  userVendorId?: string
  userVendorRelationshipId?: string

  // Optional link to renovation
  dealId?: string

  // Job details
  title: "Roof replacement - 123 Oak St"
  description: "Full tear-off and replacement, architectural shingles"
  category: "ROOFER"

  // Financials
  quotedAmount: 12500
  finalAmount: 12800

  // Timeline
  scheduledDate: "2025-11-01"
  startDate: "2025-11-01"
  completedDate: "2025-11-05"

  // Assessment
  qualityRating: 5
  timelinessRating: 4
  communicationRating: 5
  wouldRecommend: true
  reviewNotes: "Excellent work, slightly delayed due to weather"

  status: "completed"
}
```

## Vendor Categories

Full list of supported trade categories:

| Category | Description |
|----------|-------------|
| `GENERAL_CONTRACTOR` | GC, project management |
| `ROOFER` | Roofing installation/repair |
| `PLUMBER` | Plumbing systems |
| `ELECTRICIAN` | Electrical systems |
| `HVAC` | Heating, ventilation, AC |
| `FLOORING` | Hardwood, tile, carpet, LVP |
| `PAINTER` | Interior/exterior painting |
| `LANDSCAPER` | Lawn, trees, outdoor work |
| `DUMPSTER_RENTAL` | Debris removal |
| `LOCKSMITH` | Lock/key services |
| `CLEANING_SERVICE` | Property cleaning |
| `HOME_INSPECTOR` | Property inspections |
| `APPRAISER` | Property valuations |
| `DEMOLITION` | Demo work |
| `FRAMING` | Structural framing |
| `SIDING` | Exterior siding |
| `WINDOWS` | Window installation |
| `INSULATION` | Insulation work |
| `DRYWALL` | Drywall/sheetrock |
| `KITCHEN` | Kitchen remodeling |
| `BATHROOM` | Bathroom remodeling |
| `FENCING` | Fence installation |
| `CONCRETE` | Concrete/flatwork |
| `POOL` | Pool services |
| `PEST_CONTROL` | Pest extermination |
| `GARAGE_DOOR` | Garage door services |
| `APPLIANCE_REPAIR` | Appliance repair |
| `OTHER` | Miscellaneous |

## API Design (Future Implementation)

### Platform Vendors

```
GET /api/vendors/platform?marketId=xxx&category=ROOFER
- List platform vendors in a market (filtered by category)

GET /api/vendors/platform/:id
- Get platform vendor details
```

### User's Vendor List

```
GET /api/vendors/my
- List user's vendors (both UserVendor and UserVendorRelationship)

POST /api/vendors/my/private
- Create a private UserVendor

POST /api/vendors/my/add/:platformVendorId
- Create UserVendorRelationship (add platform vendor to user's list)

PATCH /api/vendors/my/:id
- Update user's notes, rating, tags, favorite status

DELETE /api/vendors/my/:id
- Soft delete (remove from user's list)
```

### Job History

```
GET /api/vendors/:id/jobs
- List jobs with a specific vendor

POST /api/vendors/:id/jobs
- Record a new job

PATCH /api/vendors/jobs/:jobId
- Update job (add completion, assessment)
```

## Migration Strategy

### Phase 1: Schema Migration (Current)
- [x] Add new models to Prisma schema
- [x] Keep legacy `Vendor` model for Bid/Invoice relations
- [ ] Run `prisma migrate dev` to create tables

### Phase 2: Data Migration
- [ ] Create migration script to move existing `Vendor` records to `UserVendor`
- [ ] Preserve Bid/Invoice relations by updating foreign keys
- [ ] Mark legacy vendors with appropriate categories

### Phase 3: API Updates
- [ ] Create new API endpoints for vendor network
- [ ] Update vendors page to use new data models
- [ ] Update renovation bid workflow to use new system

### Phase 4: Platform Vendor Sourcing
- [ ] Implement Google Places API integration
- [ ] Create market seeding script
- [ ] Set up periodic refresh job (cron)

### Phase 5: Legacy Cleanup
- [ ] Remove legacy `Vendor` model
- [ ] Update all references

## Google Places Integration (Future)

### Onboarding Flow
1. User enters target market during onboarding
2. System creates/finds Market record
3. System queries Google Places for vendors:
   - Contractors
   - Roofers
   - Plumbers
   - Electricians
   - etc.
4. Results saved as PlatformVendors

### Search Query Examples
```
"general contractor in Jacksonville FL"
"roofing company near 32256"
"plumber Jacksonville Florida"
```

### Data Refresh
- Daily cron job checks for stale data (>30 days old)
- Re-queries Google Places for updates
- Updates ratings, review counts, business status
- Marks closed businesses as CLOSED status

## UI Integration

### Vendors Page Tabs
1. **My Vendors** - Combined view of UserVendor + UserVendorRelationship
2. **Find Vendors** - Browse PlatformVendors in user's market
3. **Import** - Bulk import from CSV/spreadsheet

### Vendor Card Display
- Show source badge (Google, Yelp, Manual)
- Show both source rating AND user's personal rating
- Show "Added to My Vendors" badge if relationship exists
- Trade-colored badges from TRADE_CONFIG

### Add to My Vendors Flow
1. User browses platform vendors
2. Clicks "Add to My Vendors"
3. Creates UserVendorRelationship
4. Optional: Add notes, tags, personal rating
5. Vendor appears in "My Vendors" tab
