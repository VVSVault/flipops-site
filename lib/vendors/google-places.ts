/**
 * Google Places API Integration for Vendor Network
 *
 * Uses Google Places Text Search and Place Details APIs to find
 * contractors and service providers in a market area.
 */

import { VendorCategory, VendorSource, VendorStatus } from '@prisma/client';

// Read API key lazily to support scripts that load env vars after module import
const getApiKey = () => process.env.GOOGLE_PLACES_API_KEY;
const PLACES_TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const PLACES_DETAILS_URL = 'https://places.googleapis.com/v1/places';

// Map Google place types to our vendor categories
const CATEGORY_SEARCH_TERMS: Record<VendorCategory, string[]> = {
  GENERAL_CONTRACTOR: ['general contractor', 'home remodeling contractor'],
  ROOFER: ['roofing contractor', 'roof repair'],
  PLUMBER: ['plumber', 'plumbing contractor'],
  ELECTRICIAN: ['electrician', 'electrical contractor'],
  HVAC: ['hvac contractor', 'air conditioning repair', 'heating contractor'],
  FLOORING: ['flooring contractor', 'tile installer', 'carpet installer'],
  PAINTER: ['painting contractor', 'house painter'],
  LANDSCAPER: ['landscaping company', 'lawn care service'],
  DUMPSTER_RENTAL: ['dumpster rental', 'roll off dumpster'],
  LOCKSMITH: ['locksmith'],
  CLEANING_SERVICE: ['house cleaning service', 'janitorial service'],
  HOME_INSPECTOR: ['home inspector', 'property inspector'],
  APPRAISER: ['real estate appraiser', 'property appraiser'],
  DEMOLITION: ['demolition contractor'],
  FRAMING: ['framing contractor', 'house framing'],
  SIDING: ['siding contractor', 'vinyl siding installer'],
  WINDOWS: ['window installer', 'window replacement'],
  INSULATION: ['insulation contractor'],
  DRYWALL: ['drywall contractor', 'drywall installer'],
  KITCHEN: ['kitchen remodeling', 'kitchen renovation contractor'],
  BATHROOM: ['bathroom remodeling', 'bathroom renovation contractor'],
  FENCING: ['fence contractor', 'fence installation'],
  CONCRETE: ['concrete contractor', 'concrete work'],
  POOL: ['pool contractor', 'pool service'],
  PEST_CONTROL: ['pest control', 'exterminator'],
  GARAGE_DOOR: ['garage door repair', 'garage door installer'],
  APPLIANCE_REPAIR: ['appliance repair'],
  OTHER: ['handyman'],
};

export interface PlaceSearchResult {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  location: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  googleMapsUri?: string;
  regularOpeningHours?: any;
  businessStatus?: string;
  types?: string[];
  primaryType?: string;
}

export interface PlaceDetailsResult extends PlaceSearchResult {
  editorialSummary?: { text: string };
}

export interface PlatformVendorInput {
  name: string;
  description?: string;
  address?: string;
  city: string;
  state: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  categories: VendorCategory[];
  source: VendorSource;
  googlePlaceId: string;
  sourceRating?: number;
  sourceReviewCount?: number;
  priceLevel?: number;
  status: VendorStatus;
}

/**
 * Search for places using Google Places Text Search API
 */
export async function searchPlaces(
  query: string,
  location: { lat: number; lng: number },
  radiusMiles: number = 50
): Promise<PlaceSearchResult[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY is not configured');
  }

  // Convert miles to meters, capped at Google's 50,000m limit
  const radiusMeters = Math.min(radiusMiles * 1609.34, 50000);

  const response = await fetch(PLACES_TEXT_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.location',
        'places.rating',
        'places.userRatingCount',
        'places.priceLevel',
        'places.websiteUri',
        'places.nationalPhoneNumber',
        'places.internationalPhoneNumber',
        'places.googleMapsUri',
        'places.businessStatus',
        'places.types',
        'places.primaryType',
      ].join(','),
    },
    body: JSON.stringify({
      textQuery: query,
      locationBias: {
        circle: {
          center: { latitude: location.lat, longitude: location.lng },
          radius: radiusMeters,
        },
      },
      maxResultCount: 20,
      languageCode: 'en',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Places API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.places || [];
}

/**
 * Get detailed information about a place
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetailsResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY is not configured');
  }

  const response = await fetch(`${PLACES_DETAILS_URL}/${placeId}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'id',
        'displayName',
        'formattedAddress',
        'location',
        'rating',
        'userRatingCount',
        'priceLevel',
        'websiteUri',
        'nationalPhoneNumber',
        'internationalPhoneNumber',
        'googleMapsUri',
        'businessStatus',
        'types',
        'primaryType',
        'editorialSummary',
      ].join(','),
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.text();
    throw new Error(`Google Places API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Parse address components from formatted address
 * Example: "123 Main St, Jacksonville, FL 32256, USA"
 */
function parseAddress(formattedAddress: string): {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
} {
  const parts = formattedAddress.split(',').map(p => p.trim());

  if (parts.length < 3) {
    return {};
  }

  // USA format: "Street, City, State ZIP, Country"
  const address = parts[0];
  const city = parts[1];

  // Parse "FL 32256" format
  const stateZipMatch = parts[2].match(/^([A-Z]{2})\s*(\d{5})?/);
  const state = stateZipMatch ? stateZipMatch[1] : undefined;
  const zip = stateZipMatch ? stateZipMatch[2] : undefined;

  return { address, city, state, zip };
}

/**
 * Convert price level string to number
 */
function parsePriceLevel(priceLevel?: string): number | undefined {
  if (!priceLevel) return undefined;
  const levels: Record<string, number> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };
  return levels[priceLevel];
}

/**
 * Convert Google Place result to PlatformVendor input
 */
export function convertPlaceToVendor(
  place: PlaceSearchResult | PlaceDetailsResult,
  category: VendorCategory
): PlatformVendorInput {
  const addressParts = parseAddress(place.formattedAddress);

  return {
    name: place.displayName.text,
    description: 'editorialSummary' in place ? place.editorialSummary?.text : undefined,
    address: addressParts.address,
    city: addressParts.city || '',
    state: addressParts.state || '',
    zip: addressParts.zip,
    latitude: place.location?.latitude,
    longitude: place.location?.longitude,
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber,
    website: place.websiteUri,
    categories: [category],
    source: VendorSource.GOOGLE_PLACES,
    googlePlaceId: place.id,
    sourceRating: place.rating,
    sourceReviewCount: place.userRatingCount,
    priceLevel: parsePriceLevel(place.priceLevel),
    status: place.businessStatus === 'CLOSED_PERMANENTLY'
      ? VendorStatus.CLOSED
      : place.businessStatus === 'CLOSED_TEMPORARILY'
        ? VendorStatus.INACTIVE
        : VendorStatus.ACTIVE,
  };
}

/**
 * Search for vendors by category in a location
 */
export async function searchVendorsByCategory(
  category: VendorCategory,
  location: { lat: number; lng: number; city: string; state: string },
  radiusMiles: number = 50
): Promise<PlatformVendorInput[]> {
  const searchTerms = CATEGORY_SEARCH_TERMS[category] || [];
  const vendors: PlatformVendorInput[] = [];
  const seenPlaceIds = new Set<string>();

  for (const term of searchTerms) {
    const query = `${term} in ${location.city}, ${location.state}`;

    try {
      const places = await searchPlaces(query, { lat: location.lat, lng: location.lng }, radiusMiles);

      for (const place of places) {
        // Skip duplicates
        if (seenPlaceIds.has(place.id)) {
          continue;
        }
        seenPlaceIds.add(place.id);

        // Skip closed businesses
        if (place.businessStatus === 'CLOSED_PERMANENTLY') {
          continue;
        }

        vendors.push(convertPlaceToVendor(place, category));
      }
    } catch (error) {
      console.error(`Error searching for "${term}":`, error);
    }
  }

  return vendors;
}

/**
 * Get all search terms for a category
 */
export function getSearchTermsForCategory(category: VendorCategory): string[] {
  return CATEGORY_SEARCH_TERMS[category] || [];
}

/**
 * Get the primary categories to seed (most common trades)
 */
export function getPrimaryCategories(): VendorCategory[] {
  return [
    VendorCategory.GENERAL_CONTRACTOR,
    VendorCategory.ROOFER,
    VendorCategory.PLUMBER,
    VendorCategory.ELECTRICIAN,
    VendorCategory.HVAC,
    VendorCategory.FLOORING,
    VendorCategory.PAINTER,
    VendorCategory.LANDSCAPER,
  ];
}
