// Comprehensive seed data for the underwriting workspace

export interface Deal {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  owner: string;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  listPrice?: number;
  dom?: number;
  status: "hot" | "warm" | "cold" | "review";
  signals: string[];
  photos?: string[];
}

export interface UnderwritingSession {
  id: string;
  leadId: string;
  propertyId: string;
  status: "draft" | "review" | "approved";
  arv: number;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comp {
  id: string;
  leadId: string;
  address: string;
  soldDate: string;
  soldPrice: number;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  distance: number; // miles
  pricePerSqft: number;
  similarity: number; // 0-100
  selected: boolean;
  weight: number;
  lat: number;
  lng: number;
}

export interface RepairItem {
  id: string;
  sessionId: string;
  category: string;
  description: string;
  qty: number;
  uom: string;
  unitCost: number;
  totalCost: number;
  note?: string;
  photoUrl?: string;
  confidence: "high" | "medium" | "low";
}

export interface CostBook {
  region: string;
  category: string;
  defaultUnitCost: number;
  uom: string;
  multiplier: number;
}

export interface Assumptions {
  realtorPct: number;
  closingPct: number;
  holdingPerDay: number;
  assignmentFee: number;
  rehabDays: number;
  arvDiscountPct: number;
  vacancyPct: number;
  pmPct: number;
  maintenancePct: number;
  dscrTarget: number;
  profitTargetPct: number;
}

export interface Scenario {
  id: string;
  sessionId: string;
  strategy: "wholesale" | "wholetail" | "flip" | "rental";
  purchasePrice: number;
  totalInvestment: number;
  netProfit: number;
  roi: number;
  cashFlow?: number;
  capRate?: number;
  dscr?: number;
}

export interface Risk {
  type: "flood" | "permit" | "violation" | "hoa" | "title" | "age";
  severity: "high" | "medium" | "low";
  description: string;
  source?: string;
  dateFound: string;
}

// Seed Data
export const underwritingSeedData = {
  deals: [
    {
      id: "LEAD-001",
      address: "123 Oak Street",
      city: "Jacksonville",
      state: "FL",
      zip: "32204",
      owner: "John Smith",
      beds: 3,
      baths: 2,
      sqft: 1450,
      yearBuilt: 1965,
      listPrice: 185000,
      dom: 45,
      status: "hot",
      signals: ["probate", "roof_damage", "aging_kitchen", "high_equity"],
      photos: ["front.jpg", "kitchen.jpg", "roof.jpg"]
    },
    {
      id: "LEAD-002",
      address: "456 Pine Avenue",
      city: "Jacksonville",
      state: "FL",
      zip: "32205",
      owner: "Mary Johnson",
      beds: 4,
      baths: 2.5,
      sqft: 2100,
      yearBuilt: 1978,
      status: "warm",
      signals: ["tax_delinquent", "boarded", "foundation_issues"],
      photos: ["front.jpg", "interior.jpg"]
    },
    {
      id: "LEAD-003",
      address: "789 Elm Court",
      city: "Jacksonville",
      state: "FL",
      zip: "32207",
      owner: "Robert Davis",
      beds: 3,
      baths: 1.5,
      sqft: 1200,
      yearBuilt: 1955,
      status: "hot",
      signals: ["code_violation", "aging_hvac", "outdated_electrical"],
      photos: ["front.jpg"]
    },
    {
      id: "LEAD-004",
      address: "321 Maple Drive",
      city: "Jacksonville",
      state: "FL",
      zip: "32208",
      owner: "Linda Wilson",
      beds: 5,
      baths: 3,
      sqft: 2800,
      yearBuilt: 1990,
      listPrice: 425000,
      dom: 120,
      status: "review",
      signals: ["high_dom", "luxury_features", "pool_maintenance"],
      photos: ["front.jpg", "pool.jpg", "interior.jpg"]
    },
    {
      id: "LEAD-005",
      address: "654 Cedar Lane",
      city: "Jacksonville",
      state: "FL",
      zip: "32210",
      owner: "James Martinez",
      beds: 2,
      baths: 1,
      sqft: 950,
      yearBuilt: 1948,
      status: "warm",
      signals: ["lead_paint_risk", "aging_plumbing", "small_lot"],
      photos: ["front.jpg"]
    }
  ] as Deal[],

  sessions: [
    {
      id: "SESSION-001",
      leadId: "LEAD-001",
      propertyId: "PROP-001",
      status: "review",
      arv: 285000,
      confidence: 85,
      createdAt: "2025-02-07T10:00:00Z",
      updatedAt: "2025-02-08T14:30:00Z"
    },
    {
      id: "SESSION-002",
      leadId: "LEAD-002",
      propertyId: "PROP-002",
      status: "draft",
      arv: 325000,
      confidence: 75,
      createdAt: "2025-02-08T09:00:00Z",
      updatedAt: "2025-02-08T11:00:00Z"
    },
    {
      id: "SESSION-003",
      leadId: "LEAD-003",
      propertyId: "PROP-003",
      status: "approved",
      arv: 195000,
      confidence: 90,
      createdAt: "2025-02-06T14:00:00Z",
      updatedAt: "2025-02-07T16:00:00Z"
    },
    {
      id: "SESSION-004",
      leadId: "LEAD-004",
      propertyId: "PROP-004",
      status: "review",
      arv: 625000,
      confidence: 80,
      createdAt: "2025-02-07T12:00:00Z",
      updatedAt: "2025-02-08T10:00:00Z"
    },
    {
      id: "SESSION-005",
      leadId: "LEAD-005",
      propertyId: "PROP-005",
      status: "draft",
      arv: 145000,
      confidence: 75,
      createdAt: "2025-02-08T08:00:00Z",
      updatedAt: "2025-02-08T09:30:00Z"
    }
  ] as UnderwritingSession[],

  comps: [
    // Comps for LEAD-001
    {
      id: "COMP-001-1",
      leadId: "LEAD-001",
      address: "145 Oak Street",
      soldDate: "2024-12-15",
      soldPrice: 275000,
      beds: 3,
      baths: 2,
      sqft: 1425,
      yearBuilt: 1968,
      distance: 0.1,
      pricePerSqft: 193,
      similarity: 95,
      selected: true,
      weight: 0.3,
      lat: 30.3322,
      lng: -81.6557
    },
    {
      id: "COMP-001-2",
      leadId: "LEAD-001",
      address: "210 Birch Lane",
      soldDate: "2024-11-20",
      soldPrice: 289000,
      beds: 3,
      baths: 2,
      sqft: 1500,
      yearBuilt: 1970,
      distance: 0.3,
      pricePerSqft: 193,
      similarity: 88,
      selected: true,
      weight: 0.25,
      lat: 30.3345,
      lng: -81.6523
    },
    {
      id: "COMP-001-3",
      leadId: "LEAD-001",
      address: "55 Oak Court",
      soldDate: "2024-10-30",
      soldPrice: 295000,
      beds: 3,
      baths: 2.5,
      sqft: 1525,
      yearBuilt: 1965,
      distance: 0.2,
      pricePerSqft: 193,
      similarity: 92,
      selected: true,
      weight: 0.25,
      lat: 30.3310,
      lng: -81.6540
    },
    {
      id: "COMP-001-4",
      leadId: "LEAD-001",
      address: "380 Pine Street",
      soldDate: "2024-09-15",
      soldPrice: 265000,
      beds: 3,
      baths: 2,
      sqft: 1400,
      yearBuilt: 1962,
      distance: 0.5,
      pricePerSqft: 189,
      similarity: 82,
      selected: false,
      weight: 0.2,
      lat: 30.3355,
      lng: -81.6590
    },
    {
      id: "COMP-001-5",
      leadId: "LEAD-001",
      address: "420 Elm Avenue",
      soldDate: "2024-08-10",
      soldPrice: 310000,
      beds: 4,
      baths: 2,
      sqft: 1600,
      yearBuilt: 1972,
      distance: 0.6,
      pricePerSqft: 194,
      similarity: 75,
      selected: false,
      weight: 0,
      lat: 30.3290,
      lng: -81.6510
    },
    // Comps for LEAD-002
    {
      id: "COMP-002-1",
      leadId: "LEAD-002",
      address: "490 Pine Avenue",
      soldDate: "2024-11-28",
      soldPrice: 315000,
      beds: 4,
      baths: 2.5,
      sqft: 2050,
      yearBuilt: 1980,
      distance: 0.05,
      pricePerSqft: 154,
      similarity: 96,
      selected: true,
      weight: 0.35,
      lat: 30.3422,
      lng: -81.6457
    },
    {
      id: "COMP-002-2",
      leadId: "LEAD-002",
      address: "512 Pine Court",
      soldDate: "2024-10-15",
      soldPrice: 328000,
      beds: 4,
      baths: 2.5,
      sqft: 2150,
      yearBuilt: 1975,
      distance: 0.2,
      pricePerSqft: 153,
      similarity: 90,
      selected: true,
      weight: 0.3,
      lat: 30.3445,
      lng: -81.6423
    },
    {
      id: "COMP-002-3",
      leadId: "LEAD-002",
      address: "600 Oak Boulevard",
      soldDate: "2024-09-20",
      soldPrice: 335000,
      beds: 4,
      baths: 3,
      sqft: 2200,
      yearBuilt: 1982,
      distance: 0.4,
      pricePerSqft: 152,
      similarity: 85,
      selected: true,
      weight: 0.35,
      lat: 30.3410,
      lng: -81.6490
    },
    // Comps for LEAD-003
    {
      id: "COMP-003-1",
      leadId: "LEAD-003",
      address: "800 Elm Court",
      soldDate: "2024-12-01",
      soldPrice: 189000,
      beds: 3,
      baths: 1.5,
      sqft: 1150,
      yearBuilt: 1958,
      distance: 0.02,
      pricePerSqft: 164,
      similarity: 98,
      selected: true,
      weight: 0.4,
      lat: 30.3522,
      lng: -81.6357
    },
    {
      id: "COMP-003-2",
      leadId: "LEAD-003",
      address: "765 Elm Drive",
      soldDate: "2024-10-10",
      soldPrice: 195000,
      beds: 3,
      baths: 2,
      sqft: 1225,
      yearBuilt: 1952,
      distance: 0.15,
      pricePerSqft: 159,
      similarity: 88,
      selected: true,
      weight: 0.3,
      lat: 30.3545,
      lng: -81.6323
    },
    {
      id: "COMP-003-3",
      leadId: "LEAD-003",
      address: "820 Oak Street",
      soldDate: "2024-09-05",
      soldPrice: 205000,
      beds: 3,
      baths: 2,
      sqft: 1300,
      yearBuilt: 1960,
      distance: 0.3,
      pricePerSqft: 158,
      similarity: 82,
      selected: true,
      weight: 0.3,
      lat: 30.3510,
      lng: -81.6390
    },
    // Comps for LEAD-004 (321 Maple Drive - Luxury)
    {
      id: "COMP-004-1",
      leadId: "LEAD-004",
      address: "350 Maple Drive",
      soldDate: "2024-12-20",
      soldPrice: 615000,
      beds: 5,
      baths: 3,
      sqft: 2750,
      yearBuilt: 1992,
      distance: 0.08,
      pricePerSqft: 224,
      similarity: 94,
      selected: true,
      weight: 0.35,
      lat: 30.3622,
      lng: -81.6257
    },
    {
      id: "COMP-004-2",
      leadId: "LEAD-004",
      address: "290 Maple Court",
      soldDate: "2024-11-15",
      soldPrice: 635000,
      beds: 5,
      baths: 3.5,
      sqft: 2850,
      yearBuilt: 1988,
      distance: 0.15,
      pricePerSqft: 223,
      similarity: 90,
      selected: true,
      weight: 0.3,
      lat: 30.3645,
      lng: -81.6223
    },
    {
      id: "COMP-004-3",
      leadId: "LEAD-004",
      address: "410 Oak Ridge",
      soldDate: "2024-10-05",
      soldPrice: 625000,
      beds: 5,
      baths: 3,
      sqft: 2900,
      yearBuilt: 1995,
      distance: 0.25,
      pricePerSqft: 216,
      similarity: 86,
      selected: true,
      weight: 0.35,
      lat: 30.3610,
      lng: -81.6290
    },
    // Comps for LEAD-005 (654 Cedar Lane - Small/Old)
    {
      id: "COMP-005-1",
      leadId: "LEAD-005",
      address: "680 Cedar Lane",
      soldDate: "2024-12-10",
      soldPrice: 138000,
      beds: 2,
      baths: 1,
      sqft: 925,
      yearBuilt: 1950,
      distance: 0.03,
      pricePerSqft: 149,
      similarity: 96,
      selected: true,
      weight: 0.4,
      lat: 30.3722,
      lng: -81.6157
    },
    {
      id: "COMP-005-2",
      leadId: "LEAD-005",
      address: "625 Cedar Court",
      soldDate: "2024-11-01",
      soldPrice: 145000,
      beds: 2,
      baths: 1,
      sqft: 975,
      yearBuilt: 1945,
      distance: 0.1,
      pricePerSqft: 149,
      similarity: 88,
      selected: true,
      weight: 0.3,
      lat: 30.3745,
      lng: -81.6123
    },
    {
      id: "COMP-005-3",
      leadId: "LEAD-005",
      address: "700 Pine Street",
      soldDate: "2024-09-25",
      soldPrice: 152000,
      beds: 2,
      baths: 1.5,
      sqft: 1000,
      yearBuilt: 1952,
      distance: 0.2,
      pricePerSqft: 152,
      similarity: 82,
      selected: true,
      weight: 0.3,
      lat: 30.3710,
      lng: -81.6190
    }
  ] as Comp[],

  repairItems: [
    // Repairs for SESSION-001 (LEAD-001)
    {
      id: "REPAIR-001-1",
      sessionId: "SESSION-001",
      category: "roof",
      description: "Complete roof replacement - shingles",
      qty: 1500,
      uom: "sqft",
      unitCost: 8,
      totalCost: 12000,
      note: "Visible damage, 20+ years old",
      photoUrl: "roof.jpg",
      confidence: "high"
    },
    {
      id: "REPAIR-001-2",
      sessionId: "SESSION-001",
      category: "kitchen",
      description: "Full kitchen renovation",
      qty: 1,
      uom: "complete",
      unitCost: 25000,
      totalCost: 25000,
      note: "Outdated cabinets, appliances from 1980s",
      photoUrl: "kitchen.jpg",
      confidence: "high"
    },
    {
      id: "REPAIR-001-3",
      sessionId: "SESSION-001",
      category: "paint",
      description: "Interior and exterior paint",
      qty: 2200,
      uom: "sqft",
      unitCost: 3,
      totalCost: 6600,
      note: "Full repaint needed",
      confidence: "medium"
    },
    {
      id: "REPAIR-001-4",
      sessionId: "SESSION-001",
      category: "flooring",
      description: "LVP flooring throughout",
      qty: 1450,
      uom: "sqft",
      unitCost: 5,
      totalCost: 7250,
      note: "Replace old carpet and damaged hardwood",
      confidence: "high"
    },
    {
      id: "REPAIR-001-5",
      sessionId: "SESSION-001",
      category: "bath",
      description: "Update both bathrooms",
      qty: 2,
      uom: "each",
      unitCost: 4500,
      totalCost: 9000,
      note: "New fixtures, vanities, tile",
      confidence: "medium"
    },
    {
      id: "REPAIR-001-6",
      sessionId: "SESSION-001",
      category: "hvac",
      description: "HVAC system replacement",
      qty: 1,
      uom: "system",
      unitCost: 6500,
      totalCost: 6500,
      note: "System is 25+ years old",
      confidence: "high"
    },
    // Repairs for SESSION-002 (LEAD-002)
    {
      id: "REPAIR-002-1",
      sessionId: "SESSION-002",
      category: "windows",
      description: "Board-up removal and window replacement",
      qty: 8,
      uom: "each",
      unitCost: 450,
      totalCost: 3600,
      note: "Boarded windows need replacement",
      photoUrl: "windows.jpg",
      confidence: "high"
    },
    {
      id: "REPAIR-002-2",
      sessionId: "SESSION-002",
      category: "foundation",
      description: "Foundation repair - pier and beam",
      qty: 1,
      uom: "job",
      unitCost: 15000,
      totalCost: 15000,
      note: "Visible cracks, settling issues",
      confidence: "medium"
    },
    {
      id: "REPAIR-002-3",
      sessionId: "SESSION-002",
      category: "exterior",
      description: "Siding repair and paint",
      qty: 2100,
      uom: "sqft",
      unitCost: 4,
      totalCost: 8400,
      note: "Weather damage, needs full exterior refresh",
      confidence: "medium"
    },
    {
      id: "REPAIR-002-4",
      sessionId: "SESSION-002",
      category: "landscaping",
      description: "Complete landscaping overhaul",
      qty: 1,
      uom: "lot",
      unitCost: 5000,
      totalCost: 5000,
      note: "Overgrown, needs complete cleanup",
      confidence: "low"
    },
    // Repairs for SESSION-003 (LEAD-003)
    {
      id: "REPAIR-003-1",
      sessionId: "SESSION-003",
      category: "electrical",
      description: "Complete electrical rewiring",
      qty: 1200,
      uom: "sqft",
      unitCost: 8,
      totalCost: 9600,
      note: "Outdated wiring, not to code",
      confidence: "high"
    },
    {
      id: "REPAIR-003-2",
      sessionId: "SESSION-003",
      category: "hvac",
      description: "New HVAC system",
      qty: 1,
      uom: "system",
      unitCost: 5500,
      totalCost: 5500,
      note: "Non-functional, needs replacement",
      confidence: "high"
    },
    {
      id: "REPAIR-003-3",
      sessionId: "SESSION-003",
      category: "plumbing",
      description: "Replumb entire house",
      qty: 1,
      uom: "complete",
      unitCost: 8000,
      totalCost: 8000,
      note: "Galvanized pipes, multiple leaks",
      confidence: "high"
    }
  ] as RepairItem[],

  costBooks: [
    { region: "FL-DUVAL", category: "roof", defaultUnitCost: 8, uom: "sqft", multiplier: 1.0 },
    { region: "FL-DUVAL", category: "kitchen", defaultUnitCost: 25000, uom: "complete", multiplier: 1.0 },
    { region: "FL-DUVAL", category: "bath", defaultUnitCost: 4500, uom: "each", multiplier: 1.0 },
    { region: "FL-DUVAL", category: "flooring", defaultUnitCost: 5, uom: "sqft", multiplier: 1.0 },
    { region: "FL-DUVAL", category: "paint", defaultUnitCost: 3, uom: "sqft", multiplier: 1.0 },
    { region: "FL-DUVAL", category: "hvac", defaultUnitCost: 6000, uom: "system", multiplier: 1.0 },
    { region: "FL-DUVAL", category: "electrical", defaultUnitCost: 8, uom: "sqft", multiplier: 1.0 },
    { region: "FL-DUVAL", category: "plumbing", defaultUnitCost: 8000, uom: "complete", multiplier: 1.0 },
    { region: "FL-DUVAL", category: "windows", defaultUnitCost: 450, uom: "each", multiplier: 1.0 },
    { region: "FL-DUVAL", category: "exterior", defaultUnitCost: 4, uom: "sqft", multiplier: 1.0 },
    { region: "FL-DUVAL", category: "foundation", defaultUnitCost: 15000, uom: "job", multiplier: 1.0 },
    { region: "FL-DUVAL", category: "landscaping", defaultUnitCost: 5000, uom: "lot", multiplier: 1.0 }
  ] as CostBook[],

  assumptions: {
    realtorPct: 0.06,      // 6% realtor fees
    closingPct: 0.02,      // 2% closing costs
    holdingPerDay: 50,     // $50/day holding costs
    assignmentFee: 10000,  // $10k assignment fee for wholesale
    rehabDays: 90,         // 90 days typical rehab
    arvDiscountPct: 0.03,  // 3% discount from ARV
    vacancyPct: 0.05,      // 5% vacancy for rentals
    pmPct: 0.08,           // 8% property management
    maintenancePct: 0.05,  // 5% maintenance
    dscrTarget: 1.25,      // 1.25 DSCR target
    profitTargetPct: 0.15  // 15% profit target
  } as Assumptions,

  scenarios: [
    {
      id: "SCENARIO-001-WHOLESALE",
      sessionId: "SESSION-001",
      strategy: "wholesale",
      purchasePrice: 165000,
      totalInvestment: 165000,
      netProfit: 10000,
      roi: 0.061
    },
    {
      id: "SCENARIO-001-FLIP",
      sessionId: "SESSION-001",
      strategy: "flip",
      purchasePrice: 165000,
      totalInvestment: 231350, // Purchase + repairs + holding
      netProfit: 38150,
      roi: 0.165
    },
    {
      id: "SCENARIO-001-RENTAL",
      sessionId: "SESSION-001",
      strategy: "rental",
      purchasePrice: 165000,
      totalInvestment: 231350,
      netProfit: 0,
      roi: 0,
      cashFlow: 450,
      capRate: 0.082,
      dscr: 1.35
    }
  ] as Scenario[],

  risks: [
    {
      type: "age",
      severity: "medium",
      description: "Built in 1965 - potential lead paint and asbestos",
      source: "Property records",
      dateFound: "2025-02-07"
    },
    {
      type: "flood",
      severity: "low",
      description: "Property in Zone X - minimal flood risk",
      source: "FEMA",
      dateFound: "2025-02-07"
    },
    {
      type: "permit",
      severity: "high",
      description: "Unpermitted addition found - 200 sqft sunroom",
      source: "City records",
      dateFound: "2025-02-08"
    }
  ] as Risk[],

  history: [
    {
      id: "HISTORY-001",
      sessionId: "SESSION-001",
      timestamp: "2025-02-07T10:00:00Z",
      user: "John Analyst",
      action: "Created initial analysis",
      changes: {
        arv: 285000,
        repairs: 66350,
        mao: 175000
      }
    },
    {
      id: "HISTORY-002",
      sessionId: "SESSION-001",
      timestamp: "2025-02-08T14:30:00Z",
      user: "Jane Manager",
      action: "Adjusted repair estimates",
      changes: {
        arv: 285000,
        repairs: 71350,
        mao: 170000
      }
    }
  ]
};