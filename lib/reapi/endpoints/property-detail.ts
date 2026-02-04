/**
 * REAPI Property Detail Endpoint
 *
 * Get detailed property information including distress data.
 */

import { reapiPost, REAPIError } from '../client';
import type { PropertyDetailRequest, PropertyDetailResponse } from '../types';

/**
 * Get full property details by ID or address
 * Costs 1 credit per request
 */
export async function getPropertyDetail(
  params: PropertyDetailRequest
): Promise<PropertyDetailResponse | null> {
  try {
    const response = await reapiPost<PropertyDetailResponse>('/v2/PropertyDetail', params);
    return response.data;
  } catch (error) {
    if (error instanceof REAPIError && error.code === 'API_ERROR' && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get property details by address string
 * Convenience wrapper for getPropertyDetail
 */
export async function getPropertyByAddress(
  address: string,
  city: string,
  state: string,
  zip: string
): Promise<PropertyDetailResponse | null> {
  // REAPI expects full address string
  const fullAddress = `${address}, ${city}, ${state} ${zip}`;
  return getPropertyDetail({ address: fullAddress });
}

/**
 * Get property details by REAPI ID
 * Use this when you already have the property ID from search
 */
export async function getPropertyById(
  id: string
): Promise<PropertyDetailResponse | null> {
  return getPropertyDetail({ id });
}

/**
 * Fetch details for multiple properties
 * Processes sequentially with built-in rate limiting
 */
export async function getPropertyDetailsBatch(
  ids: string[],
  options?: {
    onProgress?: (completed: number, total: number) => void;
    onError?: (id: string, error: Error) => void;
  }
): Promise<PropertyDetailResponse[]> {
  const results: PropertyDetailResponse[] = [];

  for (let i = 0; i < ids.length; i++) {
    try {
      const detail = await getPropertyById(ids[i]);
      if (detail) {
        results.push(detail);
      }
    } catch (error) {
      if (options?.onError) {
        options.onError(ids[i], error instanceof Error ? error : new Error(String(error)));
      } else {
        console.warn(`[REAPI] Failed to fetch property ${ids[i]}:`, error);
      }
    }

    if (options?.onProgress) {
      options.onProgress(i + 1, ids.length);
    }
  }

  return results;
}
