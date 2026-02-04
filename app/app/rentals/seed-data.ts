// Seed data for Rentals page demo/development
// Covers all statuses: leased, vacant, listed, maintenance

export interface SeedTenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  leaseStart: string;
  leaseEnd: string;
  rentAmount: number;
  depositPaid: number;
  paymentStatus: "current" | "late" | "delinquent";
  moveInDate: string;
}

export interface SeedMaintenance {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
  completedAt: string | null;
  cost: number | null;
  vendor: string | null;
}

export interface SeedPayment {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "late" | "partial";
  method: string;
}

export interface SeedRental {
  id: string;
  propertyId: string;
  contractId: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  monthlyRent: number;
  deposit: number | null;
  leaseStart: string | null;
  leaseEnd: string | null;
  status: "vacant" | "leased" | "maintenance" | "listed";
  purchasePrice: number;
  mortgagePayment: number | null;
  propertyTax: number | null;
  insurance: number | null;
  hoa: number | null;
  utilities: number | null;
  maintenanceReserve: number | null;
  currentMarketValue: number;
  occupancyRate: number;
  createdAt: string;
  tenants: SeedTenant[];
  maintenanceRequests: SeedMaintenance[];
  paymentHistory: SeedPayment[];
}

export const seedTenants: Record<string, SeedTenant[]> = {
  "rental-001": [
    {
      id: "tenant-001",
      name: "Michael Chen",
      email: "m.chen@email.com",
      phone: "(904) 555-0123",
      leaseStart: "2025-03-01",
      leaseEnd: "2026-02-28",
      rentAmount: 1850,
      depositPaid: 1850,
      paymentStatus: "current",
      moveInDate: "2025-03-01",
    },
    {
      id: "tenant-002",
      name: "Sarah Chen",
      email: "s.chen@email.com",
      phone: "(904) 555-0124",
      leaseStart: "2025-03-01",
      leaseEnd: "2026-02-28",
      rentAmount: 0,
      depositPaid: 0,
      paymentStatus: "current",
      moveInDate: "2025-03-01",
    },
  ],
  "rental-002": [
    {
      id: "tenant-003",
      name: "James Wilson",
      email: "j.wilson@email.com",
      phone: "(904) 555-0234",
      leaseStart: "2024-08-15",
      leaseEnd: "2026-08-14",
      rentAmount: 2200,
      depositPaid: 2200,
      paymentStatus: "current",
      moveInDate: "2024-08-15",
    },
  ],
  "rental-003": [
    {
      id: "tenant-004",
      name: "Emily Rodriguez",
      email: "e.rodriguez@email.com",
      phone: "(904) 555-0345",
      leaseStart: "2025-06-01",
      leaseEnd: "2026-05-31",
      rentAmount: 1650,
      depositPaid: 1650,
      paymentStatus: "late",
      moveInDate: "2025-06-01",
    },
  ],
  "rental-006": [
    {
      id: "tenant-005",
      name: "David Thompson",
      email: "d.thompson@email.com",
      phone: "(813) 555-0456",
      leaseStart: "2025-01-15",
      leaseEnd: "2026-03-14",
      rentAmount: 2400,
      depositPaid: 2400,
      paymentStatus: "current",
      moveInDate: "2025-01-15",
    },
    {
      id: "tenant-006",
      name: "Lisa Thompson",
      email: "l.thompson@email.com",
      phone: "(813) 555-0457",
      leaseStart: "2025-01-15",
      leaseEnd: "2026-03-14",
      rentAmount: 0,
      depositPaid: 0,
      paymentStatus: "current",
      moveInDate: "2025-01-15",
    },
  ],
  "rental-007": [
    {
      id: "tenant-007",
      name: "Robert Martinez",
      email: "r.martinez@email.com",
      phone: "(407) 555-0567",
      leaseStart: "2024-11-01",
      leaseEnd: "2025-10-31",
      rentAmount: 1950,
      depositPaid: 1950,
      paymentStatus: "delinquent",
      moveInDate: "2024-11-01",
    },
  ],
  "rental-009": [
    {
      id: "tenant-008",
      name: "Jennifer Lee",
      email: "j.lee@email.com",
      phone: "(305) 555-0678",
      leaseStart: "2025-09-01",
      leaseEnd: "2026-08-31",
      rentAmount: 3200,
      depositPaid: 6400,
      paymentStatus: "current",
      moveInDate: "2025-09-01",
    },
  ],
};

export const seedMaintenanceRequests: Record<string, SeedMaintenance[]> = {
  "rental-003": [
    {
      id: "maint-001",
      title: "HVAC Not Cooling",
      description: "Tenant reports AC unit not cooling properly. Blowing warm air even at lowest setting.",
      priority: "high",
      status: "in_progress",
      createdAt: "2026-01-25",
      completedAt: null,
      cost: null,
      vendor: "Cool Air Services",
    },
  ],
  "rental-004": [
    {
      id: "maint-002",
      title: "Roof Leak",
      description: "Water damage discovered in master bedroom ceiling. Likely roof leak from recent storms.",
      priority: "urgent",
      status: "open",
      createdAt: "2026-01-28",
      completedAt: null,
      cost: null,
      vendor: null,
    },
    {
      id: "maint-003",
      title: "Water Heater Replacement",
      description: "Water heater failed. Unit is 15 years old. Full replacement recommended.",
      priority: "high",
      status: "completed",
      createdAt: "2026-01-10",
      completedAt: "2026-01-15",
      cost: 1850,
      vendor: "Jacksonville Plumbing",
    },
  ],
  "rental-007": [
    {
      id: "maint-004",
      title: "Garbage Disposal Jammed",
      description: "Kitchen garbage disposal is jammed and making grinding noise.",
      priority: "low",
      status: "open",
      createdAt: "2026-01-27",
      completedAt: null,
      cost: null,
      vendor: null,
    },
  ],
  "rental-009": [
    {
      id: "maint-005",
      title: "Pool Pump Repair",
      description: "Pool pump making loud noise. May need bearing replacement.",
      priority: "medium",
      status: "in_progress",
      createdAt: "2026-01-20",
      completedAt: null,
      cost: 450,
      vendor: "Pool Pros Miami",
    },
  ],
};

const generatePaymentHistory = (monthlyRent: number, months: number, paymentStatus: "current" | "late" | "delinquent"): SeedPayment[] => {
  const payments: SeedPayment[] = [];
  const today = new Date();

  for (let i = 0; i < months; i++) {
    const paymentDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    let status: "paid" | "pending" | "late" | "partial" = "paid";

    if (i === 0) {
      // Current month
      if (paymentStatus === "late") status = "late";
      else if (paymentStatus === "delinquent") status = "pending";
      else status = "paid";
    } else if (i === 1 && paymentStatus === "delinquent") {
      status = "late";
    }

    payments.push({
      id: `payment-${Date.now()}-${i}`,
      date: paymentDate.toISOString().split("T")[0],
      amount: monthlyRent,
      status,
      method: "ACH",
    });
  }

  return payments;
};

export const seedRentals: SeedRental[] = [
  // Leased Properties (5)
  {
    id: "rental-001",
    propertyId: "prop-r001",
    contractId: "contract-001",
    address: "4521 Riverside Ave",
    city: "Jacksonville",
    state: "FL",
    zip: "32205",
    beds: 3,
    baths: 2,
    sqft: 1650,
    yearBuilt: 1985,
    monthlyRent: 1850,
    deposit: 1850,
    leaseStart: "2025-03-01",
    leaseEnd: "2026-02-28",
    status: "leased",
    purchasePrice: 185000,
    mortgagePayment: 980,
    propertyTax: 185,
    insurance: 145,
    hoa: null,
    utilities: null,
    maintenanceReserve: 100,
    currentMarketValue: 215000,
    occupancyRate: 100,
    createdAt: "2024-06-15",
    tenants: seedTenants["rental-001"],
    maintenanceRequests: [],
    paymentHistory: generatePaymentHistory(1850, 6, "current"),
  },
  {
    id: "rental-002",
    propertyId: "prop-r002",
    contractId: "contract-002",
    address: "892 Mandarin Point Dr",
    city: "Jacksonville",
    state: "FL",
    zip: "32257",
    beds: 4,
    baths: 3,
    sqft: 2400,
    yearBuilt: 2002,
    monthlyRent: 2200,
    deposit: 2200,
    leaseStart: "2024-08-15",
    leaseEnd: "2026-08-14",
    status: "leased",
    purchasePrice: 320000,
    mortgagePayment: 1650,
    propertyTax: 310,
    insurance: 195,
    hoa: 75,
    utilities: null,
    maintenanceReserve: 150,
    currentMarketValue: 365000,
    occupancyRate: 100,
    createdAt: "2024-07-01",
    tenants: seedTenants["rental-002"],
    maintenanceRequests: [],
    paymentHistory: generatePaymentHistory(2200, 6, "current"),
  },
  {
    id: "rental-003",
    propertyId: "prop-r003",
    contractId: "contract-003",
    address: "1156 San Jose Blvd",
    city: "Jacksonville",
    state: "FL",
    zip: "32207",
    beds: 2,
    baths: 2,
    sqft: 1200,
    yearBuilt: 1978,
    monthlyRent: 1650,
    deposit: 1650,
    leaseStart: "2025-06-01",
    leaseEnd: "2026-05-31",
    status: "leased",
    purchasePrice: 145000,
    mortgagePayment: 780,
    propertyTax: 145,
    insurance: 120,
    hoa: null,
    utilities: null,
    maintenanceReserve: 100,
    currentMarketValue: 168000,
    occupancyRate: 92,
    createdAt: "2025-04-20",
    tenants: seedTenants["rental-003"],
    maintenanceRequests: seedMaintenanceRequests["rental-003"],
    paymentHistory: generatePaymentHistory(1650, 4, "late"),
  },
  {
    id: "rental-006",
    propertyId: "prop-r006",
    contractId: "contract-006",
    address: "7845 Bay Vista Dr",
    city: "Tampa",
    state: "FL",
    zip: "33615",
    beds: 4,
    baths: 2.5,
    sqft: 2100,
    yearBuilt: 2010,
    monthlyRent: 2400,
    deposit: 2400,
    leaseStart: "2025-01-15",
    leaseEnd: "2026-03-14",
    status: "leased",
    purchasePrice: 295000,
    mortgagePayment: 1520,
    propertyTax: 285,
    insurance: 175,
    hoa: 95,
    utilities: null,
    maintenanceReserve: 125,
    currentMarketValue: 340000,
    occupancyRate: 100,
    createdAt: "2024-12-01",
    tenants: seedTenants["rental-006"],
    maintenanceRequests: [],
    paymentHistory: generatePaymentHistory(2400, 6, "current"),
  },
  {
    id: "rental-007",
    propertyId: "prop-r007",
    contractId: "contract-007",
    address: "2234 Colonial Dr",
    city: "Orlando",
    state: "FL",
    zip: "32803",
    beds: 3,
    baths: 2,
    sqft: 1550,
    yearBuilt: 1995,
    monthlyRent: 1950,
    deposit: 1950,
    leaseStart: "2024-11-01",
    leaseEnd: "2025-10-31",
    status: "leased",
    purchasePrice: 225000,
    mortgagePayment: 1180,
    propertyTax: 220,
    insurance: 165,
    hoa: null,
    utilities: null,
    maintenanceReserve: 100,
    currentMarketValue: 255000,
    occupancyRate: 85,
    createdAt: "2024-09-15",
    tenants: seedTenants["rental-007"],
    maintenanceRequests: seedMaintenanceRequests["rental-007"],
    paymentHistory: generatePaymentHistory(1950, 6, "delinquent"),
  },

  // Vacant Properties (2)
  {
    id: "rental-004",
    propertyId: "prop-r004",
    contractId: "contract-004",
    address: "3345 Beach Blvd",
    city: "Jacksonville Beach",
    state: "FL",
    zip: "32250",
    beds: 3,
    baths: 2,
    sqft: 1450,
    yearBuilt: 1992,
    monthlyRent: 2100,
    deposit: null,
    leaseStart: null,
    leaseEnd: null,
    status: "vacant",
    purchasePrice: 265000,
    mortgagePayment: 1380,
    propertyTax: 265,
    insurance: 210,
    hoa: null,
    utilities: 85,
    maintenanceReserve: 100,
    currentMarketValue: 295000,
    occupancyRate: 0,
    createdAt: "2024-03-10",
    tenants: [],
    maintenanceRequests: seedMaintenanceRequests["rental-004"],
    paymentHistory: [],
  },
  {
    id: "rental-008",
    propertyId: "prop-r008",
    contractId: "contract-008",
    address: "456 Palm Coast Pkwy",
    city: "Palm Coast",
    state: "FL",
    zip: "32137",
    beds: 3,
    baths: 2,
    sqft: 1680,
    yearBuilt: 2005,
    monthlyRent: 1800,
    deposit: null,
    leaseStart: null,
    leaseEnd: null,
    status: "vacant",
    purchasePrice: 195000,
    mortgagePayment: 1020,
    propertyTax: 195,
    insurance: 155,
    hoa: 65,
    utilities: 70,
    maintenanceReserve: 100,
    currentMarketValue: 228000,
    occupancyRate: 0,
    createdAt: "2025-08-20",
    tenants: [],
    maintenanceRequests: [],
    paymentHistory: [],
  },

  // Listed Property (1)
  {
    id: "rental-005",
    propertyId: "prop-r005",
    contractId: "contract-005",
    address: "1789 Lakewood Dr",
    city: "Jacksonville",
    state: "FL",
    zip: "32210",
    beds: 4,
    baths: 2,
    sqft: 1850,
    yearBuilt: 1988,
    monthlyRent: 1950,
    deposit: null,
    leaseStart: null,
    leaseEnd: null,
    status: "listed",
    purchasePrice: 210000,
    mortgagePayment: 1100,
    propertyTax: 210,
    insurance: 160,
    hoa: null,
    utilities: null,
    maintenanceReserve: 100,
    currentMarketValue: 245000,
    occupancyRate: 0,
    createdAt: "2024-11-05",
    tenants: [],
    maintenanceRequests: [],
    paymentHistory: [],
  },

  // Maintenance Property (1)
  {
    id: "rental-010",
    propertyId: "prop-r010",
    contractId: "contract-010",
    address: "623 Ortega Blvd",
    city: "Jacksonville",
    state: "FL",
    zip: "32210",
    beds: 3,
    baths: 2,
    sqft: 1720,
    yearBuilt: 1975,
    monthlyRent: 1750,
    deposit: null,
    leaseStart: null,
    leaseEnd: null,
    status: "maintenance",
    purchasePrice: 165000,
    mortgagePayment: 865,
    propertyTax: 165,
    insurance: 140,
    hoa: null,
    utilities: 75,
    maintenanceReserve: 100,
    currentMarketValue: 198000,
    occupancyRate: 0,
    createdAt: "2024-05-12",
    tenants: [],
    maintenanceRequests: [
      {
        id: "maint-006",
        title: "Full Kitchen Renovation",
        description: "Complete kitchen remodel including new cabinets, countertops, appliances, and flooring.",
        priority: "medium",
        status: "in_progress",
        createdAt: "2026-01-05",
        completedAt: null,
        cost: 18500,
        vendor: "Premier Renovations",
      },
      {
        id: "maint-007",
        title: "Bathroom Updates",
        description: "Replace vanities, toilets, and fixtures in both bathrooms.",
        priority: "medium",
        status: "open",
        createdAt: "2026-01-05",
        completedAt: null,
        cost: 4200,
        vendor: null,
      },
    ],
    paymentHistory: [],
  },

  // Premium Property (Leased)
  {
    id: "rental-009",
    propertyId: "prop-r009",
    contractId: "contract-009",
    address: "1450 Brickell Bay Dr #1802",
    city: "Miami",
    state: "FL",
    zip: "33131",
    beds: 2,
    baths: 2,
    sqft: 1350,
    yearBuilt: 2018,
    monthlyRent: 3200,
    deposit: 6400,
    leaseStart: "2025-09-01",
    leaseEnd: "2026-08-31",
    status: "leased",
    purchasePrice: 485000,
    mortgagePayment: 2450,
    propertyTax: 580,
    insurance: 320,
    hoa: 650,
    utilities: null,
    maintenanceReserve: 150,
    currentMarketValue: 525000,
    occupancyRate: 100,
    createdAt: "2025-07-15",
    tenants: seedTenants["rental-009"],
    maintenanceRequests: seedMaintenanceRequests["rental-009"],
    paymentHistory: generatePaymentHistory(3200, 5, "current"),
  },
];
