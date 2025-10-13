export type TruthPanel = {
  dealId: string;
  policy: {
    maxExposureUsd: number;
    targetRoiPct: number;
  };
  estimate: {
    baseline: number;
    p50: number;
    p80: number;
    p95: number;
  };
  headroom: {
    amount: number;
    pct: number;
  };
  contingency: {
    targetPct: number;
    remainingUsd: number;
  };
  drivers: {
    trade: string;
    delta: number;
  }[];
  status: {
    g1: string;
    g2: string;
    g3: string;
    g4: string;
  };
  actions: string[];
  eventId?: string;
};

export type MoneyPanel = {
  dealId: string;
  budget: {
    baseline: number;
    committed: number;
    actuals: number;
    variance: {
      abs: number;
      pct: number;
    };
  };
  byTrade: {
    trade: string;
    baseline: number;
    committed: number;
    actuals: number;
    varianceAbs: number;
    variancePct: number;
    frozen: boolean;
  }[];
  changeOrders: {
    count: number;
    approved: number;
    denied: number;
    netImpactUsd: number;
    approvalLatencyHours: number;
  };
  invoices: {
    count: number;
    avgApprovalLatencyHours: number;
  };
  burn: {
    dailyUsd: number;
    daysHeld: number;
    carryToDateUsd: number;
  };
  eventId?: string;
};

export type MotionPanel = {
  dealId: string;
  progress: {
    plannedMilestones: number;
    completedMilestones: number;
    percentComplete: number;
  };
  bottlenecks: {
    type: "APPROVAL" | "VENDOR" | "INVOICE" | "CHANGE_ORDER";
    refId: string;
    ageHours: number;
    notes: string;
  }[];
  vendors: {
    vendorId: string;
    name: string;
    reliabilityScore: number;
    avgBidTurnaroundHours: number;
    avgInvoiceLatencyHours: number;
  }[];
  recentEvents: {
    ts: string;
    artifact: string;
    action: string;
  }[];
  eventId?: string;
};