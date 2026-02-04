// Seed data for Renovations page demo/development
// Used as fallback when API returns empty or fails

export interface SeedRenovation {
  id: string;
  contractId: string | null;
  propertyId: string | null;
  address: string;
  city: string;
  state: string;
  type: string;
  status: string;
  maxExposureUsd: number;
  targetRoiPct: number;
  arv: number | null;
  region: string | null;
  grade: string | null;
  startAt: string | null;
  completedAt: string | null;
  dailyBurnUsd: number | null;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    address: string;
    city: string;
    state: string;
    beds: number;
    baths: number;
    sqft: number;
  };
  budgetLedger?: {
    baseline: number;
    committed: number;
    actuals: number;
    contingencyRemaining: number;
  };
  scopeNodes: SeedScopeNode[];
  bids: SeedBid[];
  changeOrders: SeedChangeOrder[];
  _count: {
    scopeNodes: number;
    bids: number;
    changeOrders: number;
    tasks: number;
  };
}

export interface SeedScopeNode {
  id: string;
  trade: string;
  task: string;
  quantity: { value: number; unit: string };
  finishLvl: string;
  estimatedCost: number;
}

export interface SeedBid {
  id: string;
  vendorId: string;
  vendorName: string;
  subtotal: number;
  status: string;
  trade: string;
  createdAt: string;
}

export interface SeedChangeOrder {
  id: string;
  trade: string;
  deltaUsd: number;
  impactDays: number;
  status: string;
  rationale: string | null;
  createdAt: string;
}

// Trade categories with icons and colors
export const TRADE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  demolition: { label: "Demo", color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-800" },
  hvac: { label: "HVAC", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  plumbing: { label: "Plumbing", color: "text-cyan-600", bgColor: "bg-cyan-100 dark:bg-cyan-900/30" },
  electrical: { label: "Electrical", color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  roofing: { label: "Roof", color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  flooring: { label: "Flooring", color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  kitchen: { label: "Kitchen", color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" },
  bathroom: { label: "Bath", color: "text-teal-600", bgColor: "bg-teal-100 dark:bg-teal-900/30" },
  painting: { label: "Paint", color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  landscaping: { label: "Landscape", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  windows: { label: "Windows", color: "text-sky-600", bgColor: "bg-sky-100 dark:bg-sky-900/30" },
  foundation: { label: "Foundation", color: "text-stone-600", bgColor: "bg-stone-100 dark:bg-stone-900/30" },
  drywall: { label: "Drywall", color: "text-slate-600", bgColor: "bg-slate-100 dark:bg-slate-900/30" },
  siding: { label: "Siding", color: "text-indigo-600", bgColor: "bg-indigo-100 dark:bg-indigo-900/30" },
};

export const seedRenovations: SeedRenovation[] = [
  {
    id: "reno-001",
    contractId: "contract-001",
    propertyId: "prop-001",
    address: "1234 Oak Street",
    city: "Jacksonville",
    state: "FL",
    type: "single_family",
    status: "active",
    maxExposureUsd: 65000,
    targetRoiPct: 25,
    arv: 285000,
    region: "Jacksonville, FL",
    grade: "Standard",
    startAt: "2026-01-15",
    completedAt: null,
    dailyBurnUsd: 850,
    createdAt: "2026-01-10T10:00:00Z",
    updatedAt: "2026-01-28T14:30:00Z",
    property: {
      id: "prop-001",
      address: "1234 Oak Street",
      city: "Jacksonville",
      state: "FL",
      beds: 3,
      baths: 2,
      sqft: 1650,
    },
    budgetLedger: {
      baseline: 65000,
      committed: 52000,
      actuals: 28500,
      contingencyRemaining: 6500,
    },
    scopeNodes: [
      { id: "scope-001", trade: "kitchen", task: "Full kitchen remodel", quantity: { value: 1, unit: "lot" }, finishLvl: "Standard", estimatedCost: 18000 },
      { id: "scope-002", trade: "bathroom", task: "Master bath renovation", quantity: { value: 1, unit: "lot" }, finishLvl: "Standard", estimatedCost: 12000 },
      { id: "scope-003", trade: "flooring", task: "LVP throughout", quantity: { value: 1650, unit: "sqft" }, finishLvl: "Standard", estimatedCost: 8250 },
      { id: "scope-004", trade: "painting", task: "Interior paint", quantity: { value: 1650, unit: "sqft" }, finishLvl: "Standard", estimatedCost: 4500 },
      { id: "scope-005", trade: "hvac", task: "AC replacement", quantity: { value: 1, unit: "unit" }, finishLvl: "Standard", estimatedCost: 6500 },
      { id: "scope-006", trade: "roofing", task: "Shingle repair", quantity: { value: 200, unit: "sqft" }, finishLvl: "Standard", estimatedCost: 3200 },
    ],
    bids: [
      { id: "bid-001", vendorId: "vendor-001", vendorName: "Premier Kitchens", subtotal: 17500, status: "awarded", trade: "kitchen", createdAt: "2026-01-12T09:00:00Z" },
      { id: "bid-002", vendorId: "vendor-002", vendorName: "Quality Bath Co", subtotal: 11800, status: "awarded", trade: "bathroom", createdAt: "2026-01-12T10:00:00Z" },
      { id: "bid-003", vendorId: "vendor-003", vendorName: "FloorPro LLC", subtotal: 8100, status: "awarded", trade: "flooring", createdAt: "2026-01-13T11:00:00Z" },
      { id: "bid-004", vendorId: "vendor-004", vendorName: "Budget Flooring", subtotal: 9200, status: "rejected", trade: "flooring", createdAt: "2026-01-13T14:00:00Z" },
    ],
    changeOrders: [
      { id: "co-001", trade: "plumbing", deltaUsd: 2800, impactDays: 3, status: "approved", rationale: "Discovered galvanized pipes behind wall, full replacement required", createdAt: "2026-01-22T08:00:00Z" },
    ],
    _count: { scopeNodes: 6, bids: 4, changeOrders: 1, tasks: 8 },
  },
  {
    id: "reno-002",
    contractId: "contract-002",
    propertyId: "prop-002",
    address: "567 Palm Avenue",
    city: "Tampa",
    state: "FL",
    type: "single_family",
    status: "planning",
    maxExposureUsd: 45000,
    targetRoiPct: 22,
    arv: 245000,
    region: "Tampa, FL",
    grade: "Standard",
    startAt: null,
    completedAt: null,
    dailyBurnUsd: 0,
    createdAt: "2026-01-25T14:00:00Z",
    updatedAt: "2026-01-29T09:00:00Z",
    property: {
      id: "prop-002",
      address: "567 Palm Avenue",
      city: "Tampa",
      state: "FL",
      beds: 3,
      baths: 2,
      sqft: 1450,
    },
    budgetLedger: {
      baseline: 45000,
      committed: 0,
      actuals: 0,
      contingencyRemaining: 4500,
    },
    scopeNodes: [
      { id: "scope-010", trade: "kitchen", task: "Cabinet refacing", quantity: { value: 1, unit: "lot" }, finishLvl: "Standard", estimatedCost: 8500 },
      { id: "scope-011", trade: "flooring", task: "Tile replacement", quantity: { value: 800, unit: "sqft" }, finishLvl: "Standard", estimatedCost: 6400 },
      { id: "scope-012", trade: "painting", task: "Full interior repaint", quantity: { value: 1450, unit: "sqft" }, finishLvl: "Standard", estimatedCost: 4200 },
      { id: "scope-013", trade: "landscaping", task: "Front yard cleanup", quantity: { value: 1, unit: "lot" }, finishLvl: "Standard", estimatedCost: 2500 },
    ],
    bids: [
      { id: "bid-010", vendorId: "vendor-005", vendorName: "Tampa Kitchen Works", subtotal: 8200, status: "pending", trade: "kitchen", createdAt: "2026-01-28T10:00:00Z" },
      { id: "bid-011", vendorId: "vendor-006", vendorName: "Cabinet Masters", subtotal: 9100, status: "pending", trade: "kitchen", createdAt: "2026-01-28T11:00:00Z" },
    ],
    changeOrders: [],
    _count: { scopeNodes: 4, bids: 2, changeOrders: 0, tasks: 3 },
  },
  {
    id: "reno-003",
    contractId: "contract-003",
    propertyId: "prop-003",
    address: "890 Sunset Boulevard",
    city: "Orlando",
    state: "FL",
    type: "single_family",
    status: "active",
    maxExposureUsd: 85000,
    targetRoiPct: 28,
    arv: 365000,
    region: "Orlando, FL",
    grade: "Premium",
    startAt: "2026-01-08",
    completedAt: null,
    dailyBurnUsd: 1200,
    createdAt: "2026-01-05T09:00:00Z",
    updatedAt: "2026-01-30T08:00:00Z",
    property: {
      id: "prop-003",
      address: "890 Sunset Boulevard",
      city: "Orlando",
      state: "FL",
      beds: 4,
      baths: 3,
      sqft: 2200,
    },
    budgetLedger: {
      baseline: 85000,
      committed: 78000,
      actuals: 62400,
      contingencyRemaining: 8500,
    },
    scopeNodes: [
      { id: "scope-020", trade: "kitchen", task: "Full kitchen gut & remodel", quantity: { value: 1, unit: "lot" }, finishLvl: "Premium", estimatedCost: 28000 },
      { id: "scope-021", trade: "bathroom", task: "Master bath expansion", quantity: { value: 1, unit: "lot" }, finishLvl: "Premium", estimatedCost: 18000 },
      { id: "scope-022", trade: "bathroom", task: "Guest bath update", quantity: { value: 2, unit: "each" }, finishLvl: "Standard", estimatedCost: 8000 },
      { id: "scope-023", trade: "flooring", task: "Hardwood throughout", quantity: { value: 2200, unit: "sqft" }, finishLvl: "Premium", estimatedCost: 15400 },
      { id: "scope-024", trade: "electrical", task: "Panel upgrade + fixtures", quantity: { value: 1, unit: "lot" }, finishLvl: "Standard", estimatedCost: 6500 },
      { id: "scope-025", trade: "painting", task: "Interior & exterior", quantity: { value: 1, unit: "lot" }, finishLvl: "Premium", estimatedCost: 9100 },
    ],
    bids: [
      { id: "bid-020", vendorId: "vendor-007", vendorName: "Luxury Kitchen Studio", subtotal: 27500, status: "awarded", trade: "kitchen", createdAt: "2026-01-06T09:00:00Z" },
      { id: "bid-021", vendorId: "vendor-008", vendorName: "Elite Bath Design", subtotal: 25800, status: "awarded", trade: "bathroom", createdAt: "2026-01-06T10:00:00Z" },
      { id: "bid-022", vendorId: "vendor-009", vendorName: "Hardwood Specialists", subtotal: 15200, status: "awarded", trade: "flooring", createdAt: "2026-01-07T09:00:00Z" },
    ],
    changeOrders: [
      { id: "co-010", trade: "electrical", deltaUsd: 3500, impactDays: 2, status: "approved", rationale: "Added recessed lighting per buyer request", createdAt: "2026-01-18T14:00:00Z" },
      { id: "co-011", trade: "kitchen", deltaUsd: 4200, impactDays: 4, status: "proposed", rationale: "Upgrade to quartz countertops", createdAt: "2026-01-28T10:00:00Z" },
    ],
    _count: { scopeNodes: 6, bids: 3, changeOrders: 2, tasks: 12 },
  },
  {
    id: "reno-004",
    contractId: "contract-004",
    propertyId: "prop-004",
    address: "432 Maple Drive",
    city: "Jacksonville",
    state: "FL",
    type: "single_family",
    status: "on_hold",
    maxExposureUsd: 55000,
    targetRoiPct: 20,
    arv: 275000,
    region: "Jacksonville, FL",
    grade: "Standard",
    startAt: "2026-01-10",
    completedAt: null,
    dailyBurnUsd: 0,
    createdAt: "2026-01-08T11:00:00Z",
    updatedAt: "2026-01-20T16:00:00Z",
    property: {
      id: "prop-004",
      address: "432 Maple Drive",
      city: "Jacksonville",
      state: "FL",
      beds: 3,
      baths: 2,
      sqft: 1550,
    },
    budgetLedger: {
      baseline: 55000,
      committed: 32000,
      actuals: 18500,
      contingencyRemaining: 5500,
    },
    scopeNodes: [
      { id: "scope-030", trade: "roofing", task: "Full roof replacement", quantity: { value: 1800, unit: "sqft" }, finishLvl: "Standard", estimatedCost: 14500 },
      { id: "scope-031", trade: "hvac", task: "AC + ductwork", quantity: { value: 1, unit: "lot" }, finishLvl: "Standard", estimatedCost: 8500 },
      { id: "scope-032", trade: "flooring", task: "Carpet to LVP", quantity: { value: 1200, unit: "sqft" }, finishLvl: "Standard", estimatedCost: 6000 },
    ],
    bids: [
      { id: "bid-030", vendorId: "vendor-010", vendorName: "TopRoof Inc", subtotal: 14200, status: "awarded", trade: "roofing", createdAt: "2026-01-09T09:00:00Z" },
      { id: "bid-031", vendorId: "vendor-011", vendorName: "Cool Air HVAC", subtotal: 8200, status: "awarded", trade: "hvac", createdAt: "2026-01-09T10:00:00Z" },
    ],
    changeOrders: [
      { id: "co-020", trade: "roofing", deltaUsd: 6800, impactDays: 7, status: "proposed", rationale: "Discovered extensive sheathing damage requiring replacement", createdAt: "2026-01-18T09:00:00Z" },
    ],
    _count: { scopeNodes: 3, bids: 2, changeOrders: 1, tasks: 5 },
  },
  {
    id: "reno-005",
    contractId: "contract-005",
    propertyId: "prop-005",
    address: "789 Beach Road",
    city: "St. Augustine",
    state: "FL",
    type: "single_family",
    status: "completed",
    maxExposureUsd: 72000,
    targetRoiPct: 30,
    arv: 340000,
    region: "St. Augustine, FL",
    grade: "Premium",
    startAt: "2025-11-15",
    completedAt: "2026-01-20",
    dailyBurnUsd: 0,
    createdAt: "2025-11-10T10:00:00Z",
    updatedAt: "2026-01-20T17:00:00Z",
    property: {
      id: "prop-005",
      address: "789 Beach Road",
      city: "St. Augustine",
      state: "FL",
      beds: 4,
      baths: 2,
      sqft: 1850,
    },
    budgetLedger: {
      baseline: 72000,
      committed: 72000,
      actuals: 69800,
      contingencyRemaining: 2200,
    },
    scopeNodes: [
      { id: "scope-040", trade: "kitchen", task: "Modern kitchen remodel", quantity: { value: 1, unit: "lot" }, finishLvl: "Premium", estimatedCost: 22000 },
      { id: "scope-041", trade: "bathroom", task: "Both baths updated", quantity: { value: 2, unit: "each" }, finishLvl: "Premium", estimatedCost: 16000 },
      { id: "scope-042", trade: "flooring", task: "Tile throughout", quantity: { value: 1850, unit: "sqft" }, finishLvl: "Premium", estimatedCost: 12950 },
      { id: "scope-043", trade: "painting", task: "Full interior", quantity: { value: 1850, unit: "sqft" }, finishLvl: "Premium", estimatedCost: 5550 },
      { id: "scope-044", trade: "landscaping", task: "Coastal landscaping", quantity: { value: 1, unit: "lot" }, finishLvl: "Premium", estimatedCost: 8500 },
    ],
    bids: [
      { id: "bid-040", vendorId: "vendor-012", vendorName: "Coastal Kitchen Co", subtotal: 21500, status: "awarded", trade: "kitchen", createdAt: "2025-11-12T09:00:00Z" },
      { id: "bid-041", vendorId: "vendor-013", vendorName: "Beach Bath Design", subtotal: 15800, status: "awarded", trade: "bathroom", createdAt: "2025-11-12T10:00:00Z" },
      { id: "bid-042", vendorId: "vendor-014", vendorName: "Tile Masters FL", subtotal: 12500, status: "awarded", trade: "flooring", createdAt: "2025-11-13T09:00:00Z" },
    ],
    changeOrders: [
      { id: "co-030", trade: "electrical", deltaUsd: 1800, impactDays: 1, status: "approved", rationale: "Added outdoor lighting per scope extension", createdAt: "2025-12-10T11:00:00Z" },
    ],
    _count: { scopeNodes: 5, bids: 3, changeOrders: 1, tasks: 0 },
  },
  {
    id: "reno-006",
    contractId: "contract-006",
    propertyId: "prop-006",
    address: "156 Riverside Lane",
    city: "Miami",
    state: "FL",
    type: "single_family",
    status: "completed",
    maxExposureUsd: 95000,
    targetRoiPct: 32,
    arv: 425000,
    region: "Miami, FL",
    grade: "Luxury",
    startAt: "2025-10-01",
    completedAt: "2025-12-15",
    dailyBurnUsd: 0,
    createdAt: "2025-09-25T08:00:00Z",
    updatedAt: "2025-12-15T16:00:00Z",
    property: {
      id: "prop-006",
      address: "156 Riverside Lane",
      city: "Miami",
      state: "FL",
      beds: 4,
      baths: 3,
      sqft: 2400,
    },
    budgetLedger: {
      baseline: 95000,
      committed: 95000,
      actuals: 92400,
      contingencyRemaining: 2600,
    },
    scopeNodes: [
      { id: "scope-050", trade: "kitchen", task: "Luxury chef kitchen", quantity: { value: 1, unit: "lot" }, finishLvl: "Luxury", estimatedCost: 35000 },
      { id: "scope-051", trade: "bathroom", task: "Spa master bath", quantity: { value: 1, unit: "lot" }, finishLvl: "Luxury", estimatedCost: 22000 },
      { id: "scope-052", trade: "flooring", task: "Porcelain tile", quantity: { value: 2400, unit: "sqft" }, finishLvl: "Luxury", estimatedCost: 19200 },
      { id: "scope-053", trade: "landscaping", task: "Pool area update", quantity: { value: 1, unit: "lot" }, finishLvl: "Luxury", estimatedCost: 12000 },
    ],
    bids: [
      { id: "bid-050", vendorId: "vendor-015", vendorName: "Miami Luxury Renovations", subtotal: 76000, status: "awarded", trade: "kitchen", createdAt: "2025-09-28T09:00:00Z" },
    ],
    changeOrders: [],
    _count: { scopeNodes: 4, bids: 1, changeOrders: 0, tasks: 0 },
  },
  {
    id: "reno-007",
    contractId: "contract-007",
    propertyId: "prop-007",
    address: "2401 Cypress Way",
    city: "Fort Lauderdale",
    state: "FL",
    type: "single_family",
    status: "cancelled",
    maxExposureUsd: 48000,
    targetRoiPct: 18,
    arv: 220000,
    region: "Fort Lauderdale, FL",
    grade: "Standard",
    startAt: "2025-12-01",
    completedAt: null,
    dailyBurnUsd: 0,
    createdAt: "2025-11-20T09:00:00Z",
    updatedAt: "2025-12-18T14:00:00Z",
    property: {
      id: "prop-007",
      address: "2401 Cypress Way",
      city: "Fort Lauderdale",
      state: "FL",
      beds: 2,
      baths: 1,
      sqft: 1100,
    },
    budgetLedger: {
      baseline: 48000,
      committed: 12000,
      actuals: 8200,
      contingencyRemaining: 4800,
    },
    scopeNodes: [
      { id: "scope-060", trade: "foundation", task: "Foundation repair", quantity: { value: 1, unit: "lot" }, finishLvl: "Standard", estimatedCost: 18000 },
      { id: "scope-061", trade: "plumbing", task: "Re-pipe entire house", quantity: { value: 1, unit: "lot" }, finishLvl: "Standard", estimatedCost: 9500 },
      { id: "scope-062", trade: "electrical", task: "Panel upgrade", quantity: { value: 1, unit: "lot" }, finishLvl: "Standard", estimatedCost: 4500 },
    ],
    bids: [
      { id: "bid-060", vendorId: "vendor-016", vendorName: "Foundation First LLC", subtotal: 22000, status: "rejected", trade: "foundation", createdAt: "2025-11-25T09:00:00Z" },
    ],
    changeOrders: [
      { id: "co-040", trade: "foundation", deltaUsd: 28000, impactDays: 21, status: "denied", rationale: "Structural engineer found sinkhole risk - project not viable", createdAt: "2025-12-15T10:00:00Z" },
    ],
    _count: { scopeNodes: 3, bids: 1, changeOrders: 1, tasks: 0 },
  },
  {
    id: "reno-008",
    contractId: "contract-008",
    propertyId: "prop-008",
    address: "1822 Magnolia Court",
    city: "Gainesville",
    state: "FL",
    type: "single_family",
    status: "planning",
    maxExposureUsd: 38000,
    targetRoiPct: 24,
    arv: 195000,
    region: "Gainesville, FL",
    grade: "Standard",
    startAt: null,
    completedAt: null,
    dailyBurnUsd: 0,
    createdAt: "2026-01-28T11:00:00Z",
    updatedAt: "2026-01-30T09:00:00Z",
    property: {
      id: "prop-008",
      address: "1822 Magnolia Court",
      city: "Gainesville",
      state: "FL",
      beds: 3,
      baths: 1,
      sqft: 1280,
    },
    budgetLedger: {
      baseline: 38000,
      committed: 0,
      actuals: 0,
      contingencyRemaining: 3800,
    },
    scopeNodes: [
      { id: "scope-070", trade: "bathroom", task: "Add second bathroom", quantity: { value: 1, unit: "lot" }, finishLvl: "Standard", estimatedCost: 12000 },
      { id: "scope-071", trade: "kitchen", task: "Counters & appliances", quantity: { value: 1, unit: "lot" }, finishLvl: "Standard", estimatedCost: 8500 },
      { id: "scope-072", trade: "flooring", task: "LVP main areas", quantity: { value: 900, unit: "sqft" }, finishLvl: "Standard", estimatedCost: 4500 },
      { id: "scope-073", trade: "painting", task: "Interior paint", quantity: { value: 1280, unit: "sqft" }, finishLvl: "Standard", estimatedCost: 3800 },
      { id: "scope-074", trade: "windows", task: "Replace 6 windows", quantity: { value: 6, unit: "each" }, finishLvl: "Standard", estimatedCost: 4200 },
    ],
    bids: [],
    changeOrders: [],
    _count: { scopeNodes: 5, bids: 0, changeOrders: 0, tasks: 2 },
  },
  {
    id: "reno-009",
    contractId: "contract-009",
    propertyId: "prop-009",
    address: "3456 Harbor View Drive",
    city: "Pensacola",
    state: "FL",
    type: "single_family",
    status: "active",
    maxExposureUsd: 78000,
    targetRoiPct: 26,
    arv: 335000,
    region: "Pensacola, FL",
    grade: "Premium",
    startAt: "2026-01-20",
    completedAt: null,
    dailyBurnUsd: 950,
    createdAt: "2026-01-15T14:00:00Z",
    updatedAt: "2026-01-30T10:00:00Z",
    property: {
      id: "prop-009",
      address: "3456 Harbor View Drive",
      city: "Pensacola",
      state: "FL",
      beds: 4,
      baths: 2,
      sqft: 1950,
    },
    budgetLedger: {
      baseline: 78000,
      committed: 45000,
      actuals: 18200,
      contingencyRemaining: 7800,
    },
    scopeNodes: [
      { id: "scope-080", trade: "kitchen", task: "Full kitchen renovation", quantity: { value: 1, unit: "lot" }, finishLvl: "Premium", estimatedCost: 24000 },
      { id: "scope-081", trade: "bathroom", task: "Master bath remodel", quantity: { value: 1, unit: "lot" }, finishLvl: "Premium", estimatedCost: 14000 },
      { id: "scope-082", trade: "flooring", task: "Engineered hardwood", quantity: { value: 1400, unit: "sqft" }, finishLvl: "Premium", estimatedCost: 11200 },
      { id: "scope-083", trade: "siding", task: "Hardie board siding", quantity: { value: 1800, unit: "sqft" }, finishLvl: "Premium", estimatedCost: 14400 },
      { id: "scope-084", trade: "windows", task: "Impact windows", quantity: { value: 12, unit: "each" }, finishLvl: "Premium", estimatedCost: 9600 },
    ],
    bids: [
      { id: "bid-080", vendorId: "vendor-017", vendorName: "Gulf Coast Kitchens", subtotal: 23500, status: "awarded", trade: "kitchen", createdAt: "2026-01-17T09:00:00Z" },
      { id: "bid-081", vendorId: "vendor-018", vendorName: "Panhandle Baths", subtotal: 13800, status: "awarded", trade: "bathroom", createdAt: "2026-01-17T10:00:00Z" },
      { id: "bid-082", vendorId: "vendor-019", vendorName: "Emerald Flooring", subtotal: 10800, status: "pending", trade: "flooring", createdAt: "2026-01-25T11:00:00Z" },
      { id: "bid-083", vendorId: "vendor-020", vendorName: "Wood Works Inc", subtotal: 12100, status: "pending", trade: "flooring", createdAt: "2026-01-26T09:00:00Z" },
    ],
    changeOrders: [],
    _count: { scopeNodes: 5, bids: 4, changeOrders: 0, tasks: 6 },
  },
];

// Calculate stats from renovations
export function calculateRenovationStats(renovations: SeedRenovation[]) {
  const total = renovations.length;
  const planning = renovations.filter(r => r.status === "planning").length;
  const active = renovations.filter(r => r.status === "active").length;
  const onHold = renovations.filter(r => r.status === "on_hold").length;
  const completed = renovations.filter(r => r.status === "completed").length;

  const totalBudget = renovations.reduce((sum, r) => sum + r.maxExposureUsd, 0);
  const totalSpent = renovations.reduce((sum, r) => sum + (r.budgetLedger?.actuals || 0), 0);
  const avgTargetRoi = renovations.length > 0
    ? renovations.reduce((sum, r) => sum + r.targetRoiPct, 0) / renovations.length
    : 0;

  const pendingChangeOrders = renovations.reduce((sum, r) =>
    sum + r.changeOrders.filter(co => co.status === "proposed").length, 0);

  const pendingBids = renovations.reduce((sum, r) =>
    sum + r.bids.filter(b => b.status === "pending").length, 0);

  // Calculate total projected profit
  const totalArv = renovations.reduce((sum, r) => sum + (r.arv || 0), 0);
  const projectedProfit = totalArv - totalBudget;

  return {
    total,
    planning,
    active,
    onHold,
    completed,
    totalBudget,
    totalSpent,
    avgTargetRoi,
    pendingChangeOrders,
    pendingBids,
    projectedProfit,
  };
}
