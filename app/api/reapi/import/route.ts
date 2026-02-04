import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { skipTraceProperty, isBatchDataConfigured } from '@/lib/batchdata';
import {
  getPropertyById,
  isREAPIConfigured,
  mapREAPIDetailToProperty,
  mapREAPISearchResultToProperty,
  calculateDistressScore,
  REAPIError,
} from '@/lib/reapi';
import type { PropertySearchResult } from '@/lib/reapi';

// Schema for importing from search results (minimal data)
const SearchResultPropertySchema = z.object({
  reapiId: z.string(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  county: z.string().optional(),
  ownerName: z.string().nullable().optional(),
  propertyType: z.string().nullable().optional(),
  bedrooms: z.number().nullable().optional(),
  bathrooms: z.number().nullable().optional(),
  squareFeet: z.number().nullable().optional(),
  yearBuilt: z.number().nullable().optional(),
  estimatedValue: z.number().nullable().optional(),
  lastSaleDate: z.string().nullable().optional(),
  lastSalePrice: z.number().nullable().optional(),
  equityPercent: z.number().nullable().optional(),
  estimatedEquity: z.number().nullable().optional(),
  // Distress flags
  preForeclosure: z.boolean().optional(),
  auction: z.boolean().optional(),
  vacant: z.boolean().optional(),
  absenteeOwner: z.boolean().optional(),
  outOfStateOwner: z.boolean().optional(),
  inherited: z.boolean().optional(),
  death: z.boolean().optional(),
  lien: z.boolean().optional(),
  judgment: z.boolean().optional(),
  highEquity: z.boolean().optional(),
  freeClear: z.boolean().optional(),
  corporateOwned: z.boolean().optional(),
  // Pre-calculated score
  distressScore: z.number().optional(),
  distressGrade: z.string().optional(),
  motivation: z.string().optional(),
});

const ImportSchema = z.object({
  properties: z.array(SearchResultPropertySchema).min(1).max(50),
  fetchFullDetails: z.boolean().default(false), // If true, fetch PropertyDetail for each (costs more credits)
  skipTrace: z.boolean().default(true), // If true and BatchData configured, skip trace each property
});

/**
 * POST /api/reapi/import
 * Import selected properties from REAPI search results
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const { properties, fetchFullDetails, skipTrace } = validationResult.data;
    const skipTraceEnabled = skipTrace && isBatchDataConfigured();
    const reapiConfigured = isREAPIConfigured();

    const results = {
      imported: 0,
      skipped: 0,
      enriched: 0,
      detailsFetched: 0,
      errors: [] as string[],
      creditsUsed: 0,
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

        // Optionally fetch full details from REAPI (costs 1 credit)
        let fullDetails = null;
        if (fetchFullDetails && reapiConfigured && property.reapiId) {
          try {
            fullDetails = await getPropertyById(property.reapiId);
            if (fullDetails) {
              results.detailsFetched++;
              results.creditsUsed++;
            }
          } catch (detailError) {
            console.warn(`[REAPI Import] Failed to fetch details for ${property.address}:`, detailError);
          }
        }

        // Skip trace the property (using BatchData, not REAPI)
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
                phoneNumbers: skipResult.phoneNumbers?.length
                  ? JSON.stringify(skipResult.phoneNumbers)
                  : undefined,
                emails: skipResult.emails?.length ? JSON.stringify(skipResult.emails) : undefined,
                enriched: true,
              };
              results.enriched++;
            }
          } catch (skipError) {
            console.warn('Skip trace failed for', property.address, skipError);
          }
        }

        // Calculate distress score (use pre-calculated if available, otherwise calculate)
        let distressScore = property.distressScore;
        let distressGrade = property.distressGrade;

        if (fullDetails) {
          // Recalculate from full details for more accuracy
          const distressResult = calculateDistressScore(fullDetails);
          distressScore = distressResult.score;
          distressGrade = distressResult.grade;
        }

        // Create property in database
        // Build data object based on whether we have full details or just search results
        const createData = fullDetails
          ? {
              ...mapREAPIDetailToProperty(fullDetails, userId),
              // Override with skip trace data
              ownerName: skipTraceData.ownerName || fullDetails.ownerInfo?.owner1FullName,
              enriched: skipTraceData.enriched,
              phoneNumbers: skipTraceData.phoneNumbers,
              emails: skipTraceData.emails,
              // Add score
              score: distressScore,
              scoredAt: new Date(),
              scoreBreakdown: JSON.stringify({
                source: 'reapi_distress',
                grade: distressGrade,
              }),
            }
          : {
              // Map from search result data passed in
              user: { connect: { id: userId } },
              address: property.address,
              city: property.city,
              state: property.state,
              zip: property.zip,
              county: property.county || null,
              apn: null,
              ownerName: skipTraceData.ownerName || property.ownerName,
              propertyType: property.propertyType,
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              squareFeet: property.squareFeet,
              lotSize: null,
              yearBuilt: property.yearBuilt,
              estimatedValue: property.estimatedValue,
              assessedValue: null,
              lastSalePrice: property.lastSalePrice,
              lastSaleDate: property.lastSaleDate,
              taxAmount: null,
              // Distress flags from REAPI
              foreclosure: property.auction || false,
              preForeclosure: property.preForeclosure || false,
              taxDelinquent: false,
              vacant: property.vacant || false,
              bankruptcy: false,
              absenteeOwner: property.absenteeOwner || property.outOfStateOwner || false,
              // Source
              dataSource: 'reapi',
              sourceId: property.reapiId,
              enriched: skipTraceData.enriched,
              phoneNumbers: skipTraceData.phoneNumbers,
              emails: skipTraceData.emails,
              // Score
              score: distressScore,
              scoredAt: new Date(),
              scoreBreakdown: JSON.stringify({
                source: 'reapi_distress',
                grade: distressGrade,
                motivation: property.motivation,
              }),
              // Store REAPI-specific data
              metadata: JSON.stringify({
                reapiId: property.reapiId,
                equityPercent: property.equityPercent,
                estimatedEquity: property.estimatedEquity,
                highEquity: property.highEquity,
                freeClear: property.freeClear,
                inherited: property.inherited,
                death: property.death,
                lien: property.lien,
                judgment: property.judgment,
                outOfStateOwner: property.outOfStateOwner,
                corporateOwned: property.corporateOwned,
              }),
            };

        await prisma.property.create({
          data: createData,
        });

        results.imported++;
      } catch (propertyError) {
        console.error('Failed to import property:', property.address, propertyError);
        results.errors.push(
          `${property.address}: ${propertyError instanceof Error ? propertyError.message : 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      results,
      skipTraceEnabled,
      message: `Imported ${results.imported} properties${results.detailsFetched > 0 ? ` (${results.detailsFetched} with full details)` : ''}${results.enriched > 0 ? `, ${results.enriched} enriched with contact info` : ''}${results.skipped > 0 ? `, ${results.skipped} already existed` : ''}`,
    });
  } catch (error) {
    console.error('REAPI import error:', error);

    if (error instanceof REAPIError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
