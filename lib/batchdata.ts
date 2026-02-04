/**
 * BatchData Skip Trace Service
 *
 * Provides skip tracing functionality using the BatchData API
 * to enrich property records with owner contact information.
 */

const BATCHDATA_API_KEY = process.env.BATCHDATA_API_KEY;
const BATCHDATA_API_URL = 'https://api.batchdata.com/api/v1/property/skip-trace';

export interface SkipTraceResult {
  success: boolean;
  ownerName?: string | null;
  phoneNumbers?: string[];
  emails?: string[];
  error?: string;
}

export interface PropertyAddress {
  address: string;
  city: string;
  state: string;
  zip: string;
}

/**
 * Skip trace a single property using BatchData API
 */
export async function skipTraceProperty(property: PropertyAddress): Promise<SkipTraceResult> {
  if (!BATCHDATA_API_KEY) {
    console.warn('[BatchData] No API key configured - skipping skip trace');
    return { success: false, error: 'BatchData API key not configured' };
  }

  try {
    const response = await fetch(BATCHDATA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BATCHDATA_API_KEY}`,
      },
      body: JSON.stringify({
        requests: [
          {
            propertyAddress: {
              street: property.address,
              city: property.city,
              state: property.state,
              zip: property.zip,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('[BatchData] API error:', response.status, response.statusText);
      return { success: false, error: `API error: ${response.status}` };
    }

    const data = await response.json();

    // BatchData returns results in data.results.persons array
    const result = data.results?.persons?.[0];

    if (!result || (result.meta && result.meta.error)) {
      const errMsg = result?.meta?.errorMessage || 'No match found';
      console.log(`[BatchData] ${property.address}: ${errMsg}`);
      return { success: false, error: errMsg };
    }

    // Extract owner name from result.name
    let ownerName: string | null = null;
    if (result.name) {
      if (result.name.full) {
        ownerName = result.name.full;
      } else if (result.name.first && result.name.last) {
        ownerName = `${result.name.first} ${result.name.last}`;
      }
    }

    // Extract phone numbers
    const phoneNumbers: string[] = [];
    if (result.phoneNumbers && Array.isArray(result.phoneNumbers)) {
      for (const p of result.phoneNumbers) {
        if (p.number) phoneNumbers.push(p.number);
      }
    }

    // Extract emails
    const emails: string[] = [];
    if (result.emails && Array.isArray(result.emails)) {
      for (const e of result.emails) {
        if (e.address) emails.push(e.address);
        else if (e.email) emails.push(e.email);
      }
    }

    console.log(`[BatchData] ${property.address}: Found ${phoneNumbers.length} phones, ${emails.length} emails`);

    return {
      success: true,
      ownerName,
      phoneNumbers,
      emails,
    };
  } catch (error) {
    console.error('[BatchData] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Skip trace multiple properties in batch
 * Processes sequentially with a delay to respect rate limits
 */
export async function skipTraceProperties(
  properties: Array<PropertyAddress & { id: string }>,
  delayMs: number = 500
): Promise<Map<string, SkipTraceResult>> {
  const results = new Map<string, SkipTraceResult>();

  for (const property of properties) {
    const result = await skipTraceProperty(property);
    results.set(property.id, result);

    // Add delay between requests to respect rate limits
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Check if BatchData is configured
 */
export function isBatchDataConfigured(): boolean {
  return !!BATCHDATA_API_KEY;
}
