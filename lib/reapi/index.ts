/**
 * REAPI Module Exports
 *
 * Main entry point for REAPI integration.
 * Import from '@/lib/reapi' for all REAPI functionality.
 *
 * Updated 2025-12-11 to match actual REAPI response structure.
 */

// Client
export { reapiPost, reapiGet, isREAPIConfigured, getREAPIKeyMasked, REAPIError } from './client';

// Types
export type {
  PropertySearchRequest,
  PropertySearchResponse,
  PropertySearchResult,
  PropertyDetailRequest,
  PropertyDetailResponse,
  REAPIPropertyData,
  AddressInfo,
  OwnerInfo,
  AVMRequest,
  AVMResponse,
} from './types';

// Endpoints
export {
  searchProperties,
  countProperties,
  getPropertyIds,
  buildSearchParams,
  buildDistressSearchParams,
  filterByDistress,
} from './endpoints/property-search';

export {
  getPropertyDetail,
  getPropertyByAddress,
  getPropertyById,
  getPropertyDetailsBatch,
} from './endpoints/property-detail';

// Mappers
export {
  mapREAPIDetailToProperty,
  mapREAPISearchResultToProperty,
  extractDistressSignals,
} from './mappers';

// Scoring
export {
  calculateDistressScore,
  quickDistressScore,
  combineWithProfileScore,
} from './utils/distress-scorer';

export type { DistressScore, DistressSignal } from './utils/distress-scorer';
