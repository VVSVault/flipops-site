/**
 * ATTOM AVM (Automated Valuation Model) Enrichment
 *
 * This module fetches estimated property values from ATTOM's AVM API
 * to enrich properties discovered via the sale/snapshot endpoint.
 *
 * The sale/snapshot endpoint doesn't include AVM data, so we need
 * to make secondary API calls to get estimated values.
 */

import { createLogger, sleep, retry } from '../shared';

const logger = createLogger('ATTOM AVM Enrichment');

const ATTOM_API_KEY = process.env.ATTOM_API_KEY;
const ATTOM_API_BASE = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0';

interface AvmResult {
  estimatedValue: number | null;
  assessedValue: number | null;
  avmConfidence: number | null;
  avmDate: string | null;
}

/**
 * Fetch AVM (Automated Valuation Model) data for a specific property
 * Returns estimated value and assessed value
 */
export async function fetchAvmData(
  address: string,
  city: string,
  state: string
): Promise<AvmResult> {
  if (!ATTOM_API_KEY) {
    logger.warn('ATTOM_API_KEY not set, skipping AVM enrichment');
    return { estimatedValue: null, assessedValue: null, avmConfidence: null, avmDate: null };
  }

  try {
    const address2 = `${city}, ${state}`;
    const url = `${ATTOM_API_BASE}/attomavm/detail?address1=${encodeURIComponent(address)}&address2=${encodeURIComponent(address2)}`;

    const response = await retry(
      async () => {
        const res = await fetch(url, {
          headers: {
            apikey: ATTOM_API_KEY!,
            accept: 'application/json',
          },
        });

        if (res.status === 404) {
          // Property not found in AVM database - this is normal for some properties
          return null;
        }

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`ATTOM AVM API error: ${res.status} - ${errorText}`);
        }

        return res.json();
      },
      {
        maxAttempts: 2,
        delayMs: 500,
        backoffMultiplier: 2,
      }
    );

    if (!response) {
      return { estimatedValue: null, assessedValue: null, avmConfidence: null, avmDate: null };
    }

    const prop = response.property?.[0];
    if (!prop) {
      return { estimatedValue: null, assessedValue: null, avmConfidence: null, avmDate: null };
    }

    return {
      estimatedValue: prop.avm?.amount?.value || null,
      assessedValue: prop.assessment?.assessed?.assdttlvalue || prop.assessment?.market?.mktttlvalue || null,
      avmConfidence: prop.avm?.amount?.scr || null,
      avmDate: prop.avm?.eventDate || null,
    };
  } catch (error) {
    logger.debug(`AVM lookup error for ${address}: ${error}`);
    return { estimatedValue: null, assessedValue: null, avmConfidence: null, avmDate: null };
  }
}

/**
 * Batch enrich multiple properties with AVM data
 * Includes rate limiting to avoid API throttling
 */
export async function enrichPropertiesWithAvm<T extends {
  address: string;
  city: string;
  state: string;
  estimatedValue?: number | null;
  assessedValue?: number | null;
}>(
  properties: T[],
  options: { delayMs?: number; maxConcurrent?: number } = {}
): Promise<T[]> {
  const { delayMs = 500 } = options;

  logger.info(`Starting AVM enrichment for ${properties.length} properties...`);

  const enrichedProperties: T[] = [];
  let enrichedCount = 0;

  for (const property of properties) {
    try {
      const avmData = await fetchAvmData(
        property.address,
        property.city,
        property.state
      );

      // Only update if we got data and the property doesn't already have values
      const enrichedProperty: T = {
        ...property,
        estimatedValue: property.estimatedValue || avmData.estimatedValue,
        assessedValue: property.assessedValue || avmData.assessedValue,
      };

      enrichedProperties.push(enrichedProperty);

      if (avmData.estimatedValue || avmData.assessedValue) {
        enrichedCount++;
        logger.debug(`Enriched ${property.address}: AVM=$${avmData.estimatedValue}, Assessed=$${avmData.assessedValue}`);
      }

      // Rate limit between API calls
      await sleep(delayMs);
    } catch (error) {
      logger.debug(`Failed to enrich ${property.address}: ${error}`);
      enrichedProperties.push(property);
    }
  }

  logger.info(`AVM enrichment complete: ${enrichedCount}/${properties.length} properties enriched`);
  return enrichedProperties;
}

/**
 * Enrich a single property with AVM data and update database
 * Use this for on-demand enrichment of individual properties
 */
export async function enrichSingleProperty(
  address: string,
  city: string,
  state: string
): Promise<AvmResult> {
  logger.debug(`Enriching single property: ${address}, ${city}, ${state}`);
  return fetchAvmData(address, city, state);
}
