import { logger } from './logger';

/**
 * Unit conversion system for bid normalization
 * Ensures apples-to-apples comparison across vendor bids
 */

export type CanonicalUnit = 'ea' | 'sqft' | 'lf' | 'sy' | 'ton' | 'job';

interface UnitConversion {
  canonical: CanonicalUnit;
  factor: number; // multiply by this to get canonical
  aliases: string[];
}

// Comprehensive unit mapping with common variations
const UNIT_MAP: Record<string, UnitConversion> = {
  // Each/Unit/Count
  ea: {
    canonical: 'ea',
    factor: 1,
    aliases: ['each', 'unit', 'units', 'ct', 'count', 'pcs', 'piece', 'pieces', 'item', 'items']
  },

  // Square Feet
  sqft: {
    canonical: 'sqft',
    factor: 1,
    aliases: ['sf', 'sq ft', 'sq.ft', 'square feet', 'square foot', 'sq_ft', 'sqft']
  },

  // Roofing Square (100 sqft)
  square: {
    canonical: 'sqft',
    factor: 100,
    aliases: ['squares', 'roofing square', 'roofing squares', 'sq']
  },

  // Linear Feet
  lf: {
    canonical: 'lf',
    factor: 1,
    aliases: ['linear feet', 'linear foot', 'lin ft', 'l.f.', 'lineal feet', 'ft']
  },

  // Square Yards
  sy: {
    canonical: 'sy',
    factor: 1,
    aliases: ['square yards', 'square yard', 'sq yd', 'sq.yd', 'sqyd']
  },

  // HVAC Tons
  ton: {
    canonical: 'ton',
    factor: 1,
    aliases: ['tons', 'tonnage', 'cooling ton', 'hvac ton']
  },

  // Job/Lump Sum
  job: {
    canonical: 'job',
    factor: 1,
    aliases: ['lump sum', 'ls', 'lot', 'complete', 'project', 'total', 'all']
  }
};

// Build reverse lookup map for all aliases
const ALIAS_TO_KEY: Map<string, string> = new Map();
Object.entries(UNIT_MAP).forEach(([key, config]) => {
  ALIAS_TO_KEY.set(key.toLowerCase(), key);
  config.aliases.forEach(alias => {
    ALIAS_TO_KEY.set(alias.toLowerCase(), key);
  });
});

/**
 * Normalize a unit string to its canonical form
 */
export function normalizeUnit(unit: string): {
  canonical: CanonicalUnit;
  factor: number;
} {
  const cleanUnit = unit.trim().toLowerCase().replace(/[^\w\s.]/g, '');

  const key = ALIAS_TO_KEY.get(cleanUnit);
  if (!key) {
    logger.warn({ unit, cleanUnit }, 'Unknown unit, defaulting to "ea"');
    return { canonical: 'ea', factor: 1 };
  }

  const config = UNIT_MAP[key];
  return {
    canonical: config.canonical,
    factor: config.factor
  };
}

/**
 * Normalize a quantity with its unit to canonical form
 */
export function normalizeQuantity(
  quantity: number,
  unit: string
): {
  normalizedQty: number;
  canonicalUnit: CanonicalUnit;
} {
  const { canonical, factor } = normalizeUnit(unit);
  return {
    normalizedQty: quantity * factor,
    canonicalUnit: canonical
  };
}

/**
 * Bid item structure
 */
export interface BidItem {
  trade: string;
  task: string;
  quantity: {
    value: number;
    unit: string;
  };
  unitPrice?: number;
  totalPrice: number;
  includes?: string[];
  excludes?: string[];
}

/**
 * Normalize an entire bid for comparison
 */
export function normalizeBid(items: BidItem[]): {
  normalizedItems: Array<{
    trade: string;
    task: string;
    originalQty: number;
    originalUnit: string;
    normalizedQty: number;
    canonicalUnit: CanonicalUnit;
    totalPrice: number;
  }>;
  totalByTrade: Record<string, number>;
  grandTotal: number;
} {
  const normalizedItems = items.map(item => {
    const { normalizedQty, canonicalUnit } = normalizeQuantity(
      item.quantity.value,
      item.quantity.unit
    );

    return {
      trade: item.trade,
      task: item.task,
      originalQty: item.quantity.value,
      originalUnit: item.quantity.unit,
      normalizedQty,
      canonicalUnit,
      totalPrice: item.totalPrice
    };
  });

  // Group by trade
  const totalByTrade: Record<string, number> = {};
  let grandTotal = 0;

  normalizedItems.forEach(item => {
    if (!totalByTrade[item.trade]) {
      totalByTrade[item.trade] = 0;
    }
    totalByTrade[item.trade] += item.totalPrice;
    grandTotal += item.totalPrice;
  });

  return {
    normalizedItems,
    totalByTrade,
    grandTotal
  };
}

/**
 * Compare bids for the same scope
 */
export function compareBids(
  bids: Array<{
    id: string;
    vendorId: string;
    items: BidItem[];
    subtotal: number;
  }>,
  trade?: string,
  task?: string
): {
  normalized: Array<{
    bidId: string;
    vendorId: string;
    comparableTotal: number;
    breakdown: any;
  }>;
  stats: {
    min: number;
    max: number;
    median: number;
    mean: number;
    spread: number;
    spreadPct: number;
  };
  outliers: string[];
} {
  const normalized = bids.map(bid => {
    const { normalizedItems, totalByTrade, grandTotal } = normalizeBid(bid.items);

    // If comparing specific trade/task, filter
    let comparableTotal = grandTotal;
    if (trade) {
      comparableTotal = totalByTrade[trade] || 0;
    }

    return {
      bidId: bid.id,
      vendorId: bid.vendorId,
      comparableTotal,
      breakdown: {
        normalizedItems: trade ? normalizedItems.filter(i => i.trade === trade) : normalizedItems,
        totalByTrade,
        grandTotal
      }
    };
  });

  // Calculate statistics
  const totals = normalized.map(n => n.comparableTotal).sort((a, b) => a - b);
  const min = Math.min(...totals);
  const max = Math.max(...totals);
  const mean = totals.reduce((sum, t) => sum + t, 0) / totals.length;

  // Calculate median
  const mid = Math.floor(totals.length / 2);
  const median = totals.length % 2 === 0
    ? (totals[mid - 1] + totals[mid]) / 2
    : totals[mid];

  const spread = max - min;
  const spreadPct = median > 0 ? (spread / median) * 100 : 0;

  // Identify outliers (bids > 1.5 * IQR from Q1 or Q3)
  const q1 = totals[Math.floor(totals.length * 0.25)];
  const q3 = totals[Math.floor(totals.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers = normalized
    .filter(n => n.comparableTotal < lowerBound || n.comparableTotal > upperBound)
    .map(n => n.bidId);

  return {
    normalized,
    stats: {
      min,
      max,
      median,
      mean,
      spread,
      spreadPct
    },
    outliers
  };
}

export default {
  normalizeUnit,
  normalizeQuantity,
  normalizeBid,
  compareBids
};