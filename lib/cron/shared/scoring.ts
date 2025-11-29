/**
 * Property scoring utilities for ATTOM workflow
 * Calculates match score based on investor profile criteria
 */

export interface InvestorProfile {
  minPrice?: number;
  maxPrice?: number;
  targetZipCodes?: string[];
  minBedrooms?: number;
  maxBedrooms?: number;
  minSquareFeet?: number;
  maxSquareFeet?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  preferredPropertyTypes?: string[];
  minEquityPct?: number;
}

export interface PropertyData {
  // Sales data
  salePrice?: number;
  saleDate?: string;

  // Address
  address?: {
    line1?: string;
    line2?: string;
    locality?: string;
    countrySubd?: string;
    postal1?: string;
  };

  // Building details
  building?: {
    rooms?: {
      beds?: number;
      bathsTotal?: number;
    };
    size?: {
      livingSize?: number;
    };
    construction?: {
      yearBuilt?: number;
    };
  };

  // Assessment data
  assessment?: {
    owner?: {
      absenteeOwnerStatus?: string;
    };
    tax?: {
      taxDelinquentYear?: number;
    };
  };

  // AVM data
  avm?: {
    amount?: {
      value?: number;
    };
  };

  // Lot data
  lot?: {
    lotSize1?: number;
  };

  // Additional distress indicators
  vintage?: {
    lastSaleDate?: string;
  };

  // Computed fields
  price?: number;
  marketValue?: number;
  taxDelinquent?: boolean;
  absenteeOwner?: boolean;
  vacant?: boolean;
  foreclosure?: boolean;
  liens?: boolean;
}

/**
 * Calculate property match score (0-100)
 */
export function calculatePropertyScore(
  property: PropertyData,
  profile: InvestorProfile
): number {
  let score = 0;

  const price = property.salePrice || property.price || 0;
  const marketValue = property.avm?.amount?.value || property.marketValue || 0;
  const bedrooms = property.building?.rooms?.beds || 0;
  const squareFeet = property.building?.size?.livingSize || 0;
  const yearBuilt = property.building?.construction?.yearBuilt || 0;

  // Price Match (30 points)
  if (profile.minPrice && profile.maxPrice) {
    if (price >= profile.minPrice && price <= profile.maxPrice) {
      score += 30;
    } else if (price > 0) {
      // Partial credit for being close
      const priceRange = profile.maxPrice - profile.minPrice;
      const deviation = Math.min(
        Math.abs(price - profile.minPrice),
        Math.abs(price - profile.maxPrice)
      );
      const deviationPct = deviation / priceRange;

      if (deviationPct <= 0.2) {
        score += 20; // Within 20% of range
      } else if (deviationPct <= 0.5) {
        score += 10; // Within 50% of range
      }
    }
  }

  // Distress Indicators (40 points total)

  // Tax Delinquent (8.5 points)
  if (property.assessment?.tax?.taxDelinquentYear || property.taxDelinquent) {
    score += 8.5;
  }

  // Absentee Owner (7.5 points)
  if (
    property.assessment?.owner?.absenteeOwnerStatus === 'Absentee' ||
    property.absenteeOwner
  ) {
    score += 7.5;
  }

  // Vacant (6 points)
  if (property.vacant) {
    score += 6;
  }

  // Liens (5 points)
  if (property.liens) {
    score += 5;
  }

  // Foreclosure (13 points)
  if (property.foreclosure) {
    score += 13;
  }

  // Property Characteristics Match (15 points total)

  // Bedrooms (5 points)
  if (profile.minBedrooms && profile.maxBedrooms) {
    if (bedrooms >= profile.minBedrooms && bedrooms <= profile.maxBedrooms) {
      score += 5;
    }
  }

  // Square Footage (5 points)
  if (profile.minSquareFeet && profile.maxSquareFeet) {
    if (squareFeet >= profile.minSquareFeet && squareFeet <= profile.maxSquareFeet) {
      score += 5;
    }
  }

  // Year Built (5 points)
  if (profile.minYearBuilt && profile.maxYearBuilt) {
    if (yearBuilt >= profile.minYearBuilt && yearBuilt <= profile.maxYearBuilt) {
      score += 5;
    }
  }

  // Equity Potential (15 points)
  if (price > 0 && marketValue > 0) {
    const equityPct = (marketValue - price) / marketValue;

    if (equityPct >= 0.3) {
      score += 15; // 30%+ equity
    } else if (equityPct >= 0.2) {
      score += 8; // 20-30% equity
    } else if (equityPct >= 0.1) {
      score += 3; // 10-20% equity
    }
  }

  return Math.round(score);
}

/**
 * Filter properties by minimum score
 */
export function filterQualifiedProperties<T extends { score?: number }>(
  properties: T[],
  minScore: number = 65
): T[] {
  return properties.filter((prop) => (prop.score || 0) >= minScore);
}

/**
 * Calculate contractor reliability score
 */
export function calculateContractorReliability(
  onTimePct: number,
  onBudgetPct: number
): number {
  return Math.round(onTimePct * 0.4 + onBudgetPct * 0.6);
}

/**
 * Calculate bid spread percentage
 */
export function calculateBidSpread(bids: number[]): number {
  if (bids.length < 2) return 0;

  const sortedBids = [...bids].sort((a, b) => a - b);
  const lowest = sortedBids[0];
  const highest = sortedBids[sortedBids.length - 1];

  return (highest - lowest) / lowest;
}

/**
 * Calculate budget variance percentage
 */
export function calculateBudgetVariance(
  actual: number,
  budgeted: number
): number {
  if (budgeted === 0) return 0;
  return (actual - budgeted) / budgeted;
}

/**
 * Check if P80 exceeds max exposure
 */
export function checkP80Exposure(
  p80: number,
  maxExposureUsd: number
): boolean {
  return p80 > maxExposureUsd;
}
