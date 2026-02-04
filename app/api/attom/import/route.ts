import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { skipTraceProperty, isBatchDataConfigured } from '@/lib/batchdata';
import { calculatePropertyScore, type PropertyData, type InvestorProfile } from '@/lib/cron/shared/scoring';

// ATTOM API Configuration
const ATTOM_API_KEY = process.env.ATTOM_API_KEY;
const ATTOM_API_BASE = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0';

/**
 * Fetch property details from ATTOM /property/detail endpoint
 * Used to get building data when /sale/snapshot doesn't include it
 */
async function fetchPropertyDetail(address: string, city: string, state: string, zip: string) {
  if (!ATTOM_API_KEY) {
    console.warn('[ATTOM Detail] No API key configured');
    return null;
  }

  try {
    // ATTOM expects address1 = street address, address2 = city, state zip
    const address2 = `${city}, ${state} ${zip}`;
    const params = new URLSearchParams({
      address1: address,
      address2: address2,
    });

    const url = `${ATTOM_API_BASE}/property/detail?${params.toString()}`;
    console.log('[ATTOM Detail] Fetching:', url);

    const response = await fetch(url, {
      headers: {
        apikey: ATTOM_API_KEY,
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('[ATTOM Detail] API error:', response.status);
      return null;
    }

    const data = await response.json();
    const property = data.property?.[0];

    if (!property) {
      console.warn('[ATTOM Detail] No property found');
      return null;
    }

    console.log('[ATTOM Detail] Found property data:', {
      sqft: property.building?.size?.livingsize,
      yearBuilt: property.building?.summary?.yearbuilt,
      beds: property.building?.rooms?.beds,
      baths: property.building?.rooms?.bathstotal,
      avm: property.avm?.amount?.value,
    });

    // Return the building/property details
    return {
      bedrooms: property.building?.rooms?.beds || null,
      bathrooms: property.building?.rooms?.bathstotal || null,
      squareFeet: property.building?.size?.livingsize || null,
      yearBuilt: property.building?.summary?.yearbuilt || null,
      propertyType: property.building?.summary?.propertyType || null,
      lotSize: property.lot?.lotsize1 || null,
      estimatedValue: property.avm?.amount?.value || null,
      assessedValue: property.assessment?.market?.mktttlvalue || null,
    };
  } catch (error) {
    console.error('[ATTOM Detail] Error:', error);
    return null;
  }
}

const PropertySchema = z.object({
  attomId: z.union([z.string(), z.number()]).transform(v => v ? String(v) : null).nullable().optional(),
  apn: z.string().nullable().optional(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  ownerName: z.string().nullable().optional(),
  mailingAddress: z.string().nullable().optional(),
  propertyType: z.string().nullable().optional(),
  bedrooms: z.number().nullable().optional(),
  bathrooms: z.number().nullable().optional(),
  squareFeet: z.number().nullable().optional(),
  lotSize: z.number().nullable().optional(),
  yearBuilt: z.number().nullable().optional(),
  assessedValue: z.number().nullable().optional(),
  taxAmount: z.number().nullable().optional(),
  taxYear: z.number().nullable().optional(),
  lastSaleDate: z.string().nullable().optional(),
  lastSalePrice: z.number().nullable().optional(),
  estimatedValue: z.number().nullable().optional(),
});

/**
 * Calculate property score using the shared scoring algorithm
 * This matches what the cron job uses for consistency
 */
function calculateImportScore(
  property: z.infer<typeof PropertySchema>,
  profile: InvestorProfile | null,
  hasContactInfo: boolean
): { score: number; taxDelinquent: boolean; absenteeOwner: boolean } {
  // Detect distress signals from ATTOM data
  const currentYear = new Date().getFullYear();
  const taxDelinquent = property.taxYear ? property.taxYear < currentYear - 1 : false;

  // Check if mailing address differs from property address (absentee owner indicator)
  const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip}`;
  const absenteeOwner = property.mailingAddress
    ? property.mailingAddress.toLowerCase() !== fullAddress.toLowerCase()
    : false;

  // Build PropertyData for the scoring function
  const propertyData: PropertyData = {
    price: property.lastSalePrice || undefined,
    marketValue: property.estimatedValue || undefined,
    taxDelinquent,
    absenteeOwner,
    building: {
      rooms: { beds: property.bedrooms || undefined },
      size: { livingSize: property.squareFeet || undefined },
      construction: { yearBuilt: property.yearBuilt || undefined },
    },
  };

  // Use default profile if user doesn't have one configured
  const defaultProfile: InvestorProfile = {
    minPrice: 50000,
    maxPrice: 500000,
    minBedrooms: 2,
    maxBedrooms: 5,
    minSquareFeet: 800,
    maxSquareFeet: 4000,
    minYearBuilt: 1950,
    maxYearBuilt: 2025,
  };

  let score = calculatePropertyScore(propertyData, profile || defaultProfile);

  // Bonus for having contact info from skip tracing
  if (hasContactInfo) {
    score = Math.min(score + 10, 100);
  }

  return { score, taxDelinquent, absenteeOwner };
}

const ImportSchema = z.object({
  properties: z.array(PropertySchema).min(1).max(50),
});

/**
 * POST /api/attom/import
 * Import selected properties from ATTOM search results
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Look up the database user by clerkId
    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = dbUser.id;

    const body = await request.json();
    const validationResult = ImportSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid import data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { properties } = validationResult.data;
    const skipTraceEnabled = isBatchDataConfigured();

    const results = {
      imported: 0,
      skipped: 0,
      enriched: 0,
      detailsFetched: 0,
      errors: [] as string[],
    };

    for (const property of properties) {
      try {
        // Check if property already exists for this user
        const existing = await prisma.property.findUnique({
          where: {
            userId_address_city_state_zip: {
              userId,
              address: property.address,
              city: property.city,
              state: property.state,
              zip: property.zip,
            },
          },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        // If building data is missing, fetch from ATTOM /property/detail endpoint
        let enrichedProperty = { ...property };
        const isMissingBuildingData = !property.squareFeet || !property.yearBuilt || !property.estimatedValue;

        if (isMissingBuildingData) {
          console.log(`[Import] Missing building data for ${property.address}, fetching details...`);
          const details = await fetchPropertyDetail(
            property.address,
            property.city,
            property.state,
            property.zip
          );

          if (details) {
            // Merge details with existing property data (don't overwrite if we already have values)
            enrichedProperty = {
              ...property,
              bedrooms: property.bedrooms ?? details.bedrooms,
              bathrooms: property.bathrooms ?? details.bathrooms,
              squareFeet: property.squareFeet ?? details.squareFeet,
              yearBuilt: property.yearBuilt ?? details.yearBuilt,
              propertyType: property.propertyType ?? details.propertyType,
              lotSize: property.lotSize ?? details.lotSize,
              estimatedValue: property.estimatedValue ?? details.estimatedValue,
              assessedValue: property.assessedValue ?? details.assessedValue,
            };
            results.detailsFetched++;
            console.log(`[Import] Enriched ${property.address} with building data`);
          }
        }

        // Skip trace the property before creating (if BatchData is configured)
        let skipTraceData: {
          ownerName?: string | null;
          phoneNumbers?: string;
          emails?: string;
          enriched: boolean;
        } = { enriched: false };

        if (skipTraceEnabled) {
          try {
            const skipResult = await skipTraceProperty({
              address: property.address,
              city: property.city,
              state: property.state,
              zip: property.zip,
            });

            if (skipResult.success) {
              skipTraceData = {
                ownerName: skipResult.ownerName || property.ownerName,
                phoneNumbers: skipResult.phoneNumbers?.length ? JSON.stringify(skipResult.phoneNumbers) : undefined,
                emails: skipResult.emails?.length ? JSON.stringify(skipResult.emails) : undefined,
                enriched: true,
              };
              results.enriched++;
            }
          } catch (skipError) {
            console.warn('Skip trace failed for', property.address, skipError);
          }
        }

        // Calculate score using the shared scoring algorithm (same as cron job)
        // Use enrichedProperty which may have additional data from /property/detail
        const { score, taxDelinquent, absenteeOwner } = calculateImportScore(
          enrichedProperty,
          null, // TODO: Could fetch user's investor profile here for personalized scoring
          skipTraceData.enriched
        );

        // Create new property with score and distress flags
        // Use enrichedProperty which may have additional data from /property/detail
        await prisma.property.create({
          data: {
            userId,
            address: enrichedProperty.address,
            city: enrichedProperty.city,
            state: enrichedProperty.state,
            zip: enrichedProperty.zip,
            apn: enrichedProperty.apn,
            ownerName: skipTraceData.ownerName || enrichedProperty.ownerName,
            propertyType: enrichedProperty.propertyType,
            bedrooms: enrichedProperty.bedrooms,
            bathrooms: enrichedProperty.bathrooms,
            squareFeet: enrichedProperty.squareFeet,
            lotSize: enrichedProperty.lotSize,
            yearBuilt: enrichedProperty.yearBuilt,
            assessedValue: enrichedProperty.assessedValue,
            taxAmount: enrichedProperty.taxAmount,
            lastSaleDate: enrichedProperty.lastSaleDate,
            lastSalePrice: enrichedProperty.lastSalePrice,
            estimatedValue: enrichedProperty.estimatedValue,
            // Scoring
            score,
            scoredAt: new Date(),
            // Distress flags detected from ATTOM data
            taxDelinquent,
            absenteeOwner,
            foreclosure: false,
            preForeclosure: false,
            vacant: false,
            bankruptcy: false,
            // Source tracking
            dataSource: 'attom',
            sourceId: enrichedProperty.attomId,
            enriched: skipTraceData.enriched,
            phoneNumbers: skipTraceData.phoneNumbers,
            emails: skipTraceData.emails,
          },
        });

        results.imported++;
      } catch (propertyError) {
        console.error('Failed to import property:', property.address, propertyError);
        results.errors.push(`${property.address}: ${propertyError instanceof Error ? propertyError.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      skipTraceEnabled,
      message: `Imported ${results.imported} properties${results.detailsFetched > 0 ? ` (${results.detailsFetched} with property details)` : ''}${results.enriched > 0 ? `, ${results.enriched} enriched with contact info` : ''}${results.skipped > 0 ? `, ${results.skipped} already existed` : ''}`,
    });
  } catch (error) {
    console.error('ATTOM import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
