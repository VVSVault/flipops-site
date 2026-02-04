/**
 * REAPI Property Search Endpoint
 *
 * Search for properties with distress filters.
 * Updated to match actual REAPI response structure (2025-12-11).
 */

import { reapiPost } from '../client';
import type { PropertySearchRequest, PropertySearchResponse, REAPIPropertyData } from '../types';

/**
 * Search for properties matching criteria
 * Returns data array with distress flags on each property
 */
export async function searchProperties(
  params: PropertySearchRequest
): Promise<PropertySearchResponse> {
  const response = await reapiPost<PropertySearchResponse>('/v2/PropertySearch', params);
  return response.data as PropertySearchResponse;
}

/**
 * Get count of matching properties (FREE - no credit cost)
 * Use this to preview how many properties match before fetching
 */
export async function countProperties(
  params: Omit<PropertySearchRequest, 'count' | 'ids_only'>
): Promise<number> {
  const response = await reapiPost<PropertySearchResponse>('/v2/PropertySearch', {
    ...params,
    count: true,
  });
  // Count response uses resultCount field
  return response.data?.resultCount || 0;
}

/**
 * Get property IDs only (FREE - no credit cost)
 * Use this to get IDs for filtering against existing database
 */
export async function getPropertyIds(
  params: Omit<PropertySearchRequest, 'count' | 'ids_only'>
): Promise<string[]> {
  const response = await reapiPost<PropertySearchResponse>('/v2/PropertySearch', {
    ...params,
    ids_only: true,
  });
  // Extract IDs from data array
  return response.data?.data?.map(p => p.id) || [];
}

/**
 * Helper to build search params
 * NOTE: Distress filters (preForeclosure, etc.) may not be available on trial tier
 * Instead, search by location and filter results client-side using filterByDistress()
 */
export function buildSearchParams(options: {
  zip?: string;
  city?: string;
  state?: string;
  county?: string;
  propertyType?: PropertySearchRequest['propertyType'];
  minBeds?: number;
  maxBeds?: number;
  minValue?: number;
  maxValue?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  maxResults?: number;
}): PropertySearchRequest {
  const params: PropertySearchRequest = {
    size: Math.min(options.maxResults || 50, 500),
  };

  // Geographic filters
  if (options.zip) params.zip = options.zip;
  if (options.city) params.city = options.city;
  if (options.state) params.state = options.state;
  if (options.county) params.county = options.county;

  // Property filters
  if (options.propertyType) params.propertyType = options.propertyType;
  if (options.minBeds) params.bedrooms_min = options.minBeds;
  if (options.maxBeds) params.bedrooms_max = options.maxBeds;
  if (options.minValue) params.estimatedValue_min = options.minValue;
  if (options.maxValue) params.estimatedValue_max = options.maxValue;
  if (options.minYearBuilt) params.yearBuilt_min = options.minYearBuilt;
  if (options.maxYearBuilt) params.yearBuilt_max = options.maxYearBuilt;

  return params;
}

/**
 * Filter search results by distress signals client-side
 * Use this when server-side filtering isn't available (trial tier)
 *
 * @param results - Array of property data from REAPI
 * @param options - Distress filter options (OR logic - include if ANY flag is true)
 */
export function filterByDistress(
  results: REAPIPropertyData[],
  options: {
    preForeclosure?: boolean;
    vacant?: boolean;
    absenteeOwner?: boolean;
    outOfStateOwner?: boolean;
    inherited?: boolean;
    highEquity?: boolean;
    taxLien?: boolean;
    death?: boolean;
    foreclosure?: boolean;
    judgment?: boolean;
  }
): REAPIPropertyData[] {
  // If no filters selected, return all
  const anyFilterSelected = Object.values(options).some(v => v === true);
  if (!anyFilterSelected) return results;

  return results.filter(p => {
    // OR logic - include if ANY selected flag is true
    if (options.preForeclosure && p.preForeclosure) return true;
    if (options.vacant && p.vacant) return true;
    if (options.absenteeOwner && p.absenteeOwner) return true;
    if (options.outOfStateOwner && p.outOfStateAbsenteeOwner) return true;
    if (options.inherited && p.inherited) return true;
    if (options.highEquity && p.highEquity) return true;
    if (options.taxLien && p.taxLien) return true;
    if (options.death && p.death) return true;
    if (options.foreclosure && p.foreclosure) return true;
    if (options.judgment && p.judgment) return true;

    return false;
  });
}

// Keep for backwards compatibility
export const buildDistressSearchParams = buildSearchParams;
