import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  searchProperties,
  countProperties,
  isREAPIConfigured,
  REAPIError,
} from '@/lib/reapi';
import { filterByDistress } from '@/lib/reapi/endpoints/property-search';
import { quickDistressScore } from '@/lib/reapi/utils/distress-scorer';

const SearchSchema = z.object({
  // Geographic filters (at least one required)
  zip: z.string().min(5).max(10).optional(),
  city: z.string().min(1).optional(),
  state: z.string().length(2).optional(),
  county: z.string().min(1).optional(),

  // Distress filters - applied client-side since trial tier may not support server-side
  preForeclosure: z.boolean().optional(),
  vacant: z.boolean().optional(),
  taxLien: z.boolean().optional(),
  highEquity: z.boolean().optional(),
  absenteeOwner: z.boolean().optional(),
  outOfStateOwner: z.boolean().optional(),
  inherited: z.boolean().optional(),
  death: z.boolean().optional(),

  // Minimum distress score filter (0-100) - applied server-side after scoring
  minScore: z.number().min(0).max(100).optional(),

  // Property filters
  propertyType: z.enum(['SFR', 'MFH2to4', 'MFH5plus', 'CONDO', 'LAND', 'MOBILE']).optional(),
  minBeds: z.number().min(0).optional(),
  maxBeds: z.number().max(20).optional(),
  minValue: z.number().min(0).optional(),
  maxValue: z.number().optional(),
  minYearBuilt: z.number().optional(),
  maxYearBuilt: z.number().optional(),

  // Pagination
  pageSize: z.number().min(1).max(100).default(20),
  countOnly: z.boolean().optional(),
});

/**
 * POST /api/reapi/search
 * Search for properties using REAPI with distress filters
 *
 * NOTE: REAPI trial tier may not support server-side distress filtering.
 * We fetch all properties and filter client-side by distress flags.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user exists
    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!isREAPIConfigured()) {
      return NextResponse.json(
        { error: 'REAPI not configured. Please add REAPI_API_KEY to environment variables.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validationResult = SearchSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const {
      zip,
      city,
      state,
      county,
      // Distress filters (client-side)
      preForeclosure,
      vacant,
      taxLien,
      highEquity,
      absenteeOwner,
      outOfStateOwner,
      inherited,
      death,
      // Property filters
      propertyType,
      minBeds,
      maxBeds,
      minValue,
      maxValue,
      minYearBuilt,
      maxYearBuilt,
      pageSize,
      countOnly,
    } = validationResult.data;

    // Validate at least one geographic filter
    if (!zip && !city && !state && !county) {
      return NextResponse.json(
        { error: 'At least one geographic filter required (zip, city, state, or county)' },
        { status: 400 }
      );
    }

    // Build REAPI search params (geographic + property filters only)
    const searchParams: Record<string, unknown> = {
      size: pageSize,
    };

    // Geographic
    if (zip) searchParams.zip = zip;
    if (city) searchParams.city = city;
    if (state) searchParams.state = state;
    if (county) searchParams.county = county;

    // Property filters (these work on trial tier)
    if (propertyType) searchParams.propertyType = propertyType;
    if (minBeds) searchParams.bedrooms_min = minBeds;
    if (maxBeds) searchParams.bedrooms_max = maxBeds;
    if (minValue) searchParams.estimatedValue_min = minValue;
    if (maxValue) searchParams.estimatedValue_max = maxValue;
    if (minYearBuilt) searchParams.yearBuilt_min = minYearBuilt;
    if (maxYearBuilt) searchParams.yearBuilt_max = maxYearBuilt;

    // If just counting, use the free count endpoint
    if (countOnly) {
      const count = await countProperties(searchParams);
      return NextResponse.json({
        success: true,
        count,
        creditsUsed: 0, // Count is free
      });
    }

    // Perform search
    const searchResponse = await searchProperties(searchParams);

    // Response structure: { data: [...properties], resultCount, statusCode, statusMessage }
    let properties = searchResponse.data || [];

    // Log for debugging
    if (properties.length > 0) {
      console.log('[REAPI Search] Found', properties.length, 'properties in', zip || city || state);
      console.log('[REAPI Search] Sample distress flags:', {
        preForeclosure: properties[0].preForeclosure,
        vacant: properties[0].vacant,
        absenteeOwner: properties[0].absenteeOwner,
        highEquity: properties[0].highEquity,
        inherited: properties[0].inherited,
      });
    }

    // Apply client-side distress filters
    const hasDistressFilters =
      preForeclosure || vacant || taxLien || highEquity || absenteeOwner || outOfStateOwner || inherited || death;

    if (hasDistressFilters) {
      properties = filterByDistress(properties, {
        preForeclosure,
        vacant,
        taxLien,
        highEquity,
        absenteeOwner,
        outOfStateOwner,
        inherited,
        death,
      });
      console.log('[REAPI Search] After distress filter:', properties.length, 'properties');
    }

    // Transform properties to our format with distress scores
    const transformedProperties = properties.map((p) => {
      const distressScore = quickDistressScore(p);

      // Determine grade (v2.0 thresholds)
      let distressGrade: 'A' | 'B' | 'C' | 'D' | 'F';
      if (distressScore >= 65) distressGrade = 'A';
      else if (distressScore >= 50) distressGrade = 'B';
      else if (distressScore >= 35) distressGrade = 'C';
      else if (distressScore >= 20) distressGrade = 'D';
      else distressGrade = 'F';

      // Determine motivation (v2.0 thresholds)
      let motivation: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
      if (distressScore >= 50) motivation = 'HIGH';
      else if (distressScore >= 35) motivation = 'MEDIUM';
      else if (distressScore >= 20) motivation = 'LOW';
      else motivation = 'NONE';

      // Collect active distress signals (all tracked in scoring)
      const distressSignals: string[] = [];
      if (p.preForeclosure) distressSignals.push('PRE_FORECLOSURE');
      if (p.auction || p.foreclosure) distressSignals.push('AUCTION');
      if (p.vacant) distressSignals.push('VACANT');
      if (p.absenteeOwner) distressSignals.push('ABSENTEE_OWNER');
      if (p.outOfStateAbsenteeOwner) distressSignals.push('OUT_OF_STATE_OWNER');
      if (p.inherited) distressSignals.push('INHERITED');
      if (p.death) distressSignals.push('DEATH');
      if (p.taxLien) distressSignals.push('TAX_LIEN');
      if (p.judgment) distressSignals.push('JUDGMENT');
      if (p.highEquity) distressSignals.push('HIGH_EQUITY');
      if (p.freeClear) distressSignals.push('FREE_CLEAR');
      if (p.negativeEquity) distressSignals.push('NEGATIVE_EQUITY');
      if (p.priceReduced) distressSignals.push('PRICE_REDUCED');
      if (p.privateLender) distressSignals.push('PRIVATE_LENDER');
      if (p.reo) distressSignals.push('REO');
      if (p.corporateOwned) distressSignals.push('CORPORATE_OWNED');
      if (p.adjustableRate) distressSignals.push('ADJUSTABLE_RATE');
      const yearsOwned = p.yearsOwned || 0;
      if (yearsOwned > 15) distressSignals.push('LONG_TERM_OWNER');
      const totalOwned = parseInt(p.totalPropertiesOwned || '0');
      if (totalOwned >= 4 && p.absenteeOwner) distressSignals.push('PORTFOLIO_OWNER');
      // Quit claim deed (v2.0 new signal)
      const isQuitClaim = p.documentType?.toLowerCase().includes('quit claim') ||
                          p.documentTypeCode === 'QC';
      if (isQuitClaim) distressSignals.push('QUIT_CLAIM');

      return {
        // IDs
        reapiId: p.id,

        // Address - fields at root level in actual API
        address: p.address?.address || '',
        city: p.address?.city || '',
        state: p.address?.state || '',
        zip: p.address?.zip || zip || '',
        county: p.address?.county || '',

        // Owner
        ownerName: p.companyName || p.owner1LastName || null,
        mailingAddress: p.mailAddress?.address || null,

        // Property characteristics - at root level
        propertyType: p.propertyType || null,
        bedrooms: p.bedrooms || null,
        bathrooms: p.bathrooms || null,
        squareFeet: p.squareFeet || null,
        lotSquareFeet: p.lotSquareFeet || null,
        yearBuilt: p.yearBuilt || null,

        // Financial
        estimatedValue: p.estimatedValue || null,
        assessedValue: p.assessedValue || null,
        lastSaleDate: p.lastSaleDate || null,
        lastSalePrice: p.lastSaleAmount ? parseFloat(p.lastSaleAmount) : null,
        equityPercent: p.equityPercent || null,
        estimatedEquity: p.estimatedEquity || null,
        openMortgageBalance: p.openMortgageBalance || null,

        // Distress flags (from REAPI directly!)
        preForeclosure: p.preForeclosure || false,
        auction: p.auction || false,
        foreclosure: p.foreclosure || false,
        vacant: p.vacant || false,
        absenteeOwner: p.absenteeOwner || false,
        outOfStateOwner: p.outOfStateAbsenteeOwner || false,
        inStateOwner: p.inStateAbsenteeOwner || false,
        inherited: p.inherited || false,
        death: p.death || false,
        taxLien: p.taxLien || false,
        judgment: p.judgment || false,
        highEquity: p.highEquity || false,
        freeClear: p.freeClear || false,
        corporateOwned: p.corporateOwned || false,
        investorBuyer: p.investorBuyer || false,

        // Portfolio info
        totalPropertiesOwned: p.totalPropertiesOwned || null,
        yearsOwned: p.yearsOwned || null,

        // MLS status
        mlsActive: p.mlsActive || false,
        mlsPending: p.mlsPending || false,
        forSale: p.forSale || false,

        // Location
        latitude: p.latitude || null,
        longitude: p.longitude || null,
        apn: p.apn || null,

        // Calculated distress score
        distressScore,
        distressGrade,
        motivation,
        distressSignals,
      };
    });

    return NextResponse.json({
      success: true,
      count: transformedProperties.length,
      total: searchResponse.resultCount || transformedProperties.length,
      properties: transformedProperties,
      creditsUsed: searchResponse.data?.length || 0, // Credits for all fetched before filter
    });
  } catch (error) {
    console.error('REAPI search error:', error);

    if (error instanceof REAPIError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
