// Seed data for Offers page demo/development

export interface SeedOffer {
  id: string;
  amount: number;
  terms: string | null;
  contingencies: string[];
  closingDate: string | null;
  expiresAt: string | null;
  earnestMoney: number | null;
  status: "draft" | "sent" | "countered" | "accepted" | "rejected" | "expired";
  sentAt: string | null;
  responseAt: string | null;
  responseNotes: string | null;
  counterAmount: number | null;
  notes: string | null;
  createdAt: string;
  property: {
    id: string;
    address: string;
    city: string;
    state: string;
    zip: string | null;
    ownerName: string | null;
    beds?: number;
    baths?: number;
    sqft?: number;
    arv?: number;
  };
  contract?: {
    id: string;
    status: string;
  };
}

// Generate dates relative to now
const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
const daysFromNow = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

export const seedOffers: SeedOffer[] = [
  {
    id: "offer-001",
    amount: 285000,
    terms: "cash",
    contingencies: ["inspection"],
    closingDate: daysFromNow(30),
    expiresAt: daysFromNow(3),
    earnestMoney: 5000,
    status: "sent",
    sentAt: daysAgo(1),
    responseAt: null,
    responseNotes: null,
    counterAmount: null,
    notes: "Strong lead, motivated seller due to relocation",
    createdAt: daysAgo(2),
    property: {
      id: "prop-001",
      address: "1234 Oak Street",
      city: "Jacksonville",
      state: "FL",
      zip: "32205",
      ownerName: "John Smith",
      beds: 3,
      baths: 2,
      sqft: 1650,
      arv: 365000
    }
  },
  {
    id: "offer-002",
    amount: 175000,
    terms: "cash",
    contingencies: ["inspection", "title"],
    closingDate: daysFromNow(21),
    expiresAt: daysFromNow(5),
    earnestMoney: 3000,
    status: "countered",
    sentAt: daysAgo(3),
    responseAt: daysAgo(1),
    responseNotes: "Seller wants higher price, willing to negotiate on closing timeline",
    counterAmount: 195000,
    notes: "Pre-foreclosure property, needs quick resolution",
    createdAt: daysAgo(4),
    property: {
      id: "prop-002",
      address: "567 Maple Avenue",
      city: "Orange Park",
      state: "FL",
      zip: "32073",
      ownerName: "Maria Garcia",
      beds: 4,
      baths: 2,
      sqft: 1890,
      arv: 245000
    }
  },
  {
    id: "offer-003",
    amount: 320000,
    terms: "cash",
    contingencies: [],
    closingDate: daysFromNow(14),
    expiresAt: null,
    earnestMoney: 10000,
    status: "accepted",
    sentAt: daysAgo(5),
    responseAt: daysAgo(3),
    responseNotes: "Accepted as-is, ready to proceed to contract",
    counterAmount: null,
    notes: "Absentee owner eager to sell",
    createdAt: daysAgo(6),
    property: {
      id: "prop-003",
      address: "890 Pine Road",
      city: "Jacksonville Beach",
      state: "FL",
      zip: "32250",
      ownerName: "Robert Johnson",
      beds: 4,
      baths: 3,
      sqft: 2200,
      arv: 425000
    },
    contract: {
      id: "contract-001",
      status: "pending"
    }
  },
  {
    id: "offer-004",
    amount: 145000,
    terms: "cash",
    contingencies: ["inspection"],
    closingDate: daysFromNow(45),
    expiresAt: daysAgo(2),
    earnestMoney: 2500,
    status: "expired",
    sentAt: daysAgo(10),
    responseAt: null,
    responseNotes: null,
    counterAmount: null,
    notes: "No response from seller",
    createdAt: daysAgo(12),
    property: {
      id: "prop-004",
      address: "234 Elm Drive",
      city: "Middleburg",
      state: "FL",
      zip: "32068",
      ownerName: "Susan Williams",
      beds: 3,
      baths: 1,
      sqft: 1200,
      arv: 185000
    }
  },
  {
    id: "offer-005",
    amount: 210000,
    terms: "cash",
    contingencies: ["inspection", "appraisal"],
    closingDate: daysFromNow(30),
    expiresAt: daysFromNow(7),
    earnestMoney: 5000,
    status: "rejected",
    sentAt: daysAgo(4),
    responseAt: daysAgo(2),
    responseNotes: "Seller decided to list with a realtor instead",
    counterAmount: null,
    notes: "Lost to traditional sale",
    createdAt: daysAgo(5),
    property: {
      id: "prop-005",
      address: "456 Cedar Lane",
      city: "Fleming Island",
      state: "FL",
      zip: "32003",
      ownerName: "David Brown",
      beds: 3,
      baths: 2,
      sqft: 1750,
      arv: 295000
    }
  },
  {
    id: "offer-006",
    amount: 195000,
    terms: "financing",
    contingencies: ["inspection", "financing"],
    closingDate: daysFromNow(60),
    expiresAt: null,
    earnestMoney: 3500,
    status: "draft",
    sentAt: null,
    responseAt: null,
    responseNotes: null,
    counterAmount: null,
    notes: "Need to verify property condition before sending",
    createdAt: daysAgo(1),
    property: {
      id: "prop-006",
      address: "789 Birch Court",
      city: "Green Cove Springs",
      state: "FL",
      zip: "32043",
      ownerName: "Jennifer Davis",
      beds: 3,
      baths: 2,
      sqft: 1550,
      arv: 265000
    }
  },
  {
    id: "offer-007",
    amount: 425000,
    terms: "cash",
    contingencies: [],
    closingDate: daysFromNow(21),
    expiresAt: daysFromNow(2),
    earnestMoney: 15000,
    status: "sent",
    sentAt: daysAgo(1),
    responseAt: null,
    responseNotes: null,
    counterAmount: null,
    notes: "High-value flip opportunity",
    createdAt: daysAgo(2),
    property: {
      id: "prop-007",
      address: "1010 Oceanfront Drive",
      city: "Atlantic Beach",
      state: "FL",
      zip: "32233",
      ownerName: "Michael Thompson",
      beds: 5,
      baths: 4,
      sqft: 3200,
      arv: 575000
    }
  },
  {
    id: "offer-008",
    amount: 165000,
    terms: "cash",
    contingencies: ["inspection"],
    closingDate: daysFromNow(14),
    expiresAt: null,
    earnestMoney: 2500,
    status: "accepted",
    sentAt: daysAgo(7),
    responseAt: daysAgo(5),
    responseNotes: "Accepted, waiting on contract drafting",
    counterAmount: null,
    notes: "Tax delinquent property, seller motivated",
    createdAt: daysAgo(8),
    property: {
      id: "prop-008",
      address: "333 Willow Way",
      city: "Callahan",
      state: "FL",
      zip: "32011",
      ownerName: "Patricia Martinez",
      beds: 2,
      baths: 1,
      sqft: 980,
      arv: 215000
    }
  },
  {
    id: "offer-009",
    amount: 275000,
    terms: "cash",
    contingencies: ["inspection", "title"],
    closingDate: daysFromNow(30),
    expiresAt: daysFromNow(4),
    earnestMoney: 7500,
    status: "countered",
    sentAt: daysAgo(2),
    responseAt: daysAgo(1),
    responseNotes: "Counter at $295k, firm on price",
    counterAmount: 295000,
    notes: "Inherited property, multiple heirs involved",
    createdAt: daysAgo(3),
    property: {
      id: "prop-009",
      address: "555 Heritage Place",
      city: "St. Augustine",
      state: "FL",
      zip: "32084",
      ownerName: "Estate of Thomas Anderson",
      beds: 4,
      baths: 2,
      sqft: 2100,
      arv: 385000
    }
  },
  {
    id: "offer-010",
    amount: 135000,
    terms: "cash",
    contingencies: [],
    closingDate: daysFromNow(10),
    expiresAt: null,
    earnestMoney: 2000,
    status: "draft",
    sentAt: null,
    responseAt: null,
    responseNotes: null,
    counterAmount: null,
    notes: "Pending property inspection results",
    createdAt: daysAgo(0),
    property: {
      id: "prop-010",
      address: "777 River Road",
      city: "Palatka",
      state: "FL",
      zip: "32177",
      ownerName: "Barbara Wilson",
      beds: 2,
      baths: 1,
      sqft: 850,
      arv: 175000
    }
  },
  {
    id: "offer-011",
    amount: 380000,
    terms: "cash",
    contingencies: ["inspection"],
    closingDate: daysFromNow(28),
    expiresAt: daysAgo(1),
    earnestMoney: 10000,
    status: "expired",
    sentAt: daysAgo(8),
    responseAt: null,
    responseNotes: null,
    counterAmount: null,
    notes: "Seller unresponsive, marked as cold lead",
    createdAt: daysAgo(10),
    property: {
      id: "prop-011",
      address: "999 Palm Boulevard",
      city: "Ponte Vedra Beach",
      state: "FL",
      zip: "32082",
      ownerName: "William Lee",
      beds: 4,
      baths: 3,
      sqft: 2800,
      arv: 525000
    }
  },
  {
    id: "offer-012",
    amount: 225000,
    terms: "cash",
    contingencies: [],
    closingDate: daysFromNow(21),
    expiresAt: null,
    earnestMoney: 5000,
    status: "accepted",
    sentAt: daysAgo(6),
    responseAt: daysAgo(4),
    responseNotes: "Deal closed successfully",
    counterAmount: null,
    notes: "Smooth transaction, good for future referrals",
    createdAt: daysAgo(7),
    property: {
      id: "prop-012",
      address: "444 Magnolia Street",
      city: "Fernandina Beach",
      state: "FL",
      zip: "32034",
      ownerName: "Elizabeth Taylor",
      beds: 3,
      baths: 2,
      sqft: 1650,
      arv: 310000
    },
    contract: {
      id: "contract-002",
      status: "signed"
    }
  }
];

// Export stats calculation helper
export function calculateOfferStats(offers: SeedOffer[]) {
  return {
    total: offers.length,
    draft: offers.filter(o => o.status === "draft").length,
    sent: offers.filter(o => o.status === "sent").length,
    countered: offers.filter(o => o.status === "countered").length,
    accepted: offers.filter(o => o.status === "accepted").length,
    rejected: offers.filter(o => o.status === "rejected").length,
    expired: offers.filter(o => o.status === "expired").length,
    totalValue: offers.reduce((sum, o) => sum + o.amount, 0),
    avgOffer: offers.length > 0 ? offers.reduce((sum, o) => sum + o.amount, 0) / offers.length : 0,
    pendingValue: offers.filter(o => o.status === "sent" || o.status === "countered").reduce((sum, o) => sum + o.amount, 0),
    acceptedValue: offers.filter(o => o.status === "accepted").reduce((sum, o) => sum + o.amount, 0),
    conversionRate: offers.length > 0 ? (offers.filter(o => o.status === "accepted").length / offers.length) * 100 : 0,
    withContracts: offers.filter(o => o.contract).length,
    needsContract: offers.filter(o => o.status === "accepted" && !o.contract).length
  };
}
