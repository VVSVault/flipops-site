/**
 * REAPI Property Mapper
 *
 * Maps REAPI response data to FlipOps Prisma Property model.
 * Important: Field names must match prisma/schema.prisma Property model exactly.
 */

import type { PropertyDetailResponse, PropertySearchResult } from './types';
import type { Prisma } from '@prisma/client';

/**
 * Map REAPI PropertyDetail to Prisma Property create input
 * Used when importing from PropertyDetail endpoint (full data)
 */
export function mapREAPIDetailToProperty(
  reapi: PropertyDetailResponse,
  userId: string
): Prisma.PropertyCreateInput {
  const address = reapi.propertyInfo?.address;
  const owner = reapi.ownerInfo;

  return {
    user: { connect: { id: userId } },

    // Address fields - match YOUR schema field names
    address: address?.address || address?.label || '',
    city: address?.city || '',
    state: address?.state || '',
    zip: address?.zip || '',
    county: address?.county || null,
    apn: reapi.lotInfo?.apn || null,

    // Owner info
    ownerName: owner?.owner1FullName || null,

    // Property characteristics
    propertyType: mapPropertyType(reapi.propertyType),
    bedrooms: reapi.propertyInfo?.bedrooms || null,
    bathrooms: reapi.propertyInfo?.bathrooms || null,
    squareFeet: reapi.propertyInfo?.livingSquareFeet || null,
    lotSize: reapi.propertyInfo?.lotSquareFeet || null,
    yearBuilt: reapi.propertyInfo?.yearBuilt || null,

    // Financial
    estimatedValue: reapi.estimatedValue || null,
    assessedValue: reapi.taxInfo?.assessedValue || null,
    lastSalePrice: parseFloat(String(reapi.lastSalePrice)) || null,
    lastSaleDate: reapi.lastSaleDate || null,
    taxAmount: reapi.taxInfo?.taxAmount ? parseFloat(reapi.taxInfo.taxAmount) : null,

    // Distress flags - REAPI provides these directly!
    foreclosure: reapi.auction || false,
    preForeclosure: reapi.preForeclosure || false,
    taxDelinquent: false, // REAPI doesn't have direct flag, but we can check taxInfo
    vacant: reapi.vacant || false,
    bankruptcy: false, // Not provided by REAPI
    absenteeOwner: reapi.absenteeOwner || reapi.outOfStateAbsenteeOwner || reapi.inStateAbsenteeOwner || false,

    // Source tracking
    dataSource: 'reapi',
    sourceId: reapi.id,
    enriched: false, // Will be true after BatchData skip trace

    // Store additional REAPI data in metadata
    metadata: JSON.stringify({
      reapiId: reapi.id,
      equityPercent: reapi.equityPercent,
      estimatedEquity: reapi.estimatedEquity,
      freeClear: reapi.freeClear,
      highEquity: reapi.highEquity,
      inherited: reapi.inherited,
      corporateOwned: reapi.corporateOwned,
      death: reapi.death,
      spousalDeath: reapi.spousalDeath,
      lien: reapi.lien,
      judgment: reapi.judgment,
      outOfStateAbsenteeOwner: reapi.outOfStateAbsenteeOwner,
      ownershipLength: owner?.ownershipLength,
      linkedPropertyCount: reapi.linkedProperties?.totalOwned,
      mlsActive: reapi.mlsActive,
      mlsPending: reapi.mlsPending,
      auctionDate: reapi.auctionInfo?.auctionDate,
      foreclosureInfo: reapi.foreclosureInfo?.[0],
    }),
  };
}

/**
 * Map REAPI PropertySearchResult to Prisma Property create input
 * Used when importing from PropertySearch endpoint (less data than detail)
 */
export function mapREAPISearchResultToProperty(
  result: PropertySearchResult,
  userId: string
): Prisma.PropertyCreateInput {
  const address = result.propertyInfo?.address;
  const owner = result.ownerInfo;

  return {
    user: { connect: { id: userId } },

    // Address fields
    address: address?.address || address?.label || '',
    city: address?.city || '',
    state: address?.state || '',
    zip: address?.zip || '',
    county: address?.county || null,

    // Owner info
    ownerName: owner?.owner1FullName || null,

    // Property characteristics
    propertyType: mapPropertyType(result.propertyType),
    bedrooms: result.propertyInfo?.bedrooms || null,
    bathrooms: result.propertyInfo?.bathrooms || null,
    squareFeet: result.propertyInfo?.squareFeet || null,
    yearBuilt: result.propertyInfo?.yearBuilt || null,

    // Financial
    estimatedValue: result.estimatedValue || null,
    lastSalePrice: parseFloat(String(result.lastSalePrice)) || null,
    lastSaleDate: result.lastSaleDate || null,

    // Distress flags
    foreclosure: result.auction || false,
    preForeclosure: result.preForeclosure || false,
    taxDelinquent: false,
    vacant: result.vacant || false,
    bankruptcy: false,
    absenteeOwner: result.absenteeOwner || result.outOfStateAbsenteeOwner || false,

    // Source tracking
    dataSource: 'reapi',
    sourceId: result.id,
    enriched: false,

    // Store REAPI-specific data in metadata
    metadata: JSON.stringify({
      reapiId: result.id,
      equityPercent: result.equityPercent,
      estimatedEquity: result.estimatedEquity,
      freeClear: result.freeClear,
      highEquity: result.highEquity,
      inherited: result.inherited,
      corporateOwned: result.corporateOwned,
      death: result.death,
      lien: result.lien,
      judgment: result.judgment,
      outOfStateAbsenteeOwner: result.outOfStateAbsenteeOwner,
      mlsActive: result.mlsActive,
    }),
  };
}

/**
 * Map REAPI property type to FlipOps property type
 */
function mapPropertyType(reapiType: string | undefined): string {
  if (!reapiType) return 'unknown';

  const typeMap: Record<string, string> = {
    SFR: 'single_family',
    'Single Family': 'single_family',
    MFH2to4: 'multi_family',
    MFH5plus: 'multi_family',
    CONDO: 'condo',
    Condo: 'condo',
    LAND: 'land',
    Land: 'land',
    MOBILE: 'mobile_home',
    Mobile: 'mobile_home',
    TOWNHOUSE: 'townhouse',
    Townhouse: 'townhouse',
  };

  return typeMap[reapiType] || reapiType.toLowerCase().replace(/\s+/g, '_');
}

/**
 * Extract distress signals from REAPI data for scoring
 */
export function extractDistressSignals(reapi: PropertyDetailResponse | PropertySearchResult): {
  preForeclosure: boolean;
  auction: boolean;
  vacant: boolean;
  absenteeOwner: boolean;
  outOfStateOwner: boolean;
  highEquity: boolean;
  inherited: boolean;
  death: boolean;
  lien: boolean;
  judgment: boolean;
  freeClear: boolean;
  corporateOwned: boolean;
} {
  // Handle both PropertyDetailResponse and PropertySearchResult
  const isDetail = 'auctionInfo' in reapi;

  return {
    preForeclosure: reapi.preForeclosure || false,
    auction: reapi.auction || false,
    vacant: reapi.vacant || false,
    absenteeOwner: reapi.absenteeOwner || false,
    outOfStateOwner: reapi.outOfStateAbsenteeOwner || false,
    highEquity: reapi.highEquity || false,
    inherited: reapi.inherited || false,
    death: reapi.death || false,
    lien: reapi.lien || false,
    judgment: reapi.judgment || false,
    freeClear: reapi.freeClear || false,
    corporateOwned: reapi.corporateOwned || false,
  };
}
