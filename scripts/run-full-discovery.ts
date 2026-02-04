/**
 * Run Full ATTOM Property Discovery with AVM Enrichment
 *
 * This script runs the complete production discovery workflow:
 * 1. Fetch properties from ATTOM sale/snapshot by ZIP code
 * 2. Enrich each property with AVM data (estimated value)
 * 3. Score properties based on investor profile
 * 4. Ingest qualified properties into database
 *
 * Usage: npx tsx scripts/run-full-discovery.ts <userId> [zipCode]
 *
 * Example:
 *   npx tsx scripts/run-full-discovery.ts cmite33vr0000mfpce5s3nj0v 40517
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const ATTOM_API_KEY = process.env.ATTOM_API_KEY || '72403894efb4b2cfeb4b5b41f105a53a';
const ATTOM_API_BASE = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0';

interface AttomProperty {
  identifier?: { attomId?: number; apn?: string; fips?: string };
  address?: {
    line1?: string;
    locality?: string;
    countrySubd?: string;
    postal1?: string;
    oneLine?: string;
  };
  summary?: { yearbuilt?: number; propclass?: string };
  building?: {
    rooms?: { beds?: number; bathstotal?: number };
    size?: { universalsize?: number; livingsize?: number };
  };
  lot?: { lotSize1?: number };
  sale?: { amount?: { saleamt?: number }; salerecdate?: string };
}

interface EnrichedProperty {
  address: string;
  city: string;
  state: string;
  zip: string;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  yearBuilt: number | null;
  lastSalePrice: number | null;
  lastSaleDate: string | null;
  estimatedValue: number | null;
  assessedValue: number | null;
  score: number;
  sourceId: string | null;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Step 1: Fetch properties from ATTOM sale/snapshot
 */
async function fetchProperties(zipCode: string, pageSize: number = 20): Promise<AttomProperty[]> {
  console.log(`\n📡 Fetching properties from ATTOM for ZIP ${zipCode}...`);

  const url = `${ATTOM_API_BASE}/sale/snapshot?postalcode=${zipCode}&pagesize=${pageSize}`;

  const response = await fetch(url, {
    headers: {
      apikey: ATTOM_API_KEY,
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`ATTOM API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const properties = data.property || [];

  console.log(`   Found ${properties.length} properties`);
  return properties;
}

/**
 * Step 2: Enrich a single property with AVM data
 */
async function enrichWithAvm(
  address: string,
  city: string,
  state: string
): Promise<{ estimatedValue: number | null; assessedValue: number | null }> {
  try {
    const address2 = `${city}, ${state}`;
    const url = `${ATTOM_API_BASE}/attomavm/detail?address1=${encodeURIComponent(address)}&address2=${encodeURIComponent(address2)}`;

    const response = await fetch(url, {
      headers: {
        apikey: ATTOM_API_KEY,
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      return { estimatedValue: null, assessedValue: null };
    }

    const data = await response.json();
    const prop = data.property?.[0];

    if (!prop) {
      return { estimatedValue: null, assessedValue: null };
    }

    return {
      estimatedValue: prop.avm?.amount?.value || null,
      assessedValue: prop.assessment?.assessed?.assdttlvalue || prop.assessment?.market?.mktttlvalue || null,
    };
  } catch (error) {
    return { estimatedValue: null, assessedValue: null };
  }
}

/**
 * Step 3: Calculate property score
 * Simple scoring based on available data
 */
function calculateScore(property: {
  lastSalePrice: number | null;
  estimatedValue: number | null;
  yearBuilt: number | null;
  squareFeet: number | null;
}): number {
  let score = 50; // Base score

  // Equity potential (up to 25 points)
  if (property.lastSalePrice && property.estimatedValue) {
    const equity = ((property.estimatedValue - property.lastSalePrice) / property.estimatedValue) * 100;
    if (equity >= 30) score += 25;
    else if (equity >= 20) score += 15;
    else if (equity >= 10) score += 8;
  }

  // Property age (up to 15 points)
  if (property.yearBuilt) {
    const age = new Date().getFullYear() - property.yearBuilt;
    if (age >= 30 && age <= 60) score += 15; // Sweet spot for rehab
    else if (age >= 20 && age < 30) score += 10;
    else if (age < 20) score += 5;
  }

  // Size (up to 10 points)
  if (property.squareFeet) {
    if (property.squareFeet >= 1000 && property.squareFeet <= 2500) score += 10;
    else if (property.squareFeet > 2500) score += 5;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Main function
 */
async function main() {
  const userId = process.argv[2];
  const zipCode = process.argv[3] || '40517';
  const pageSize = parseInt(process.argv[4] || '10');

  if (!userId) {
    console.error('❌ Usage: npx tsx scripts/run-full-discovery.ts <userId> [zipCode] [pageSize]');
    console.error('   Example: npx tsx scripts/run-full-discovery.ts cmite33vr0000mfpce5s3nj0v 40517 10');
    process.exit(1);
  }

  console.log('='.repeat(80));
  console.log('🏠 FlipOps Full Property Discovery');
  console.log('='.repeat(80));
  console.log(`User ID: ${userId}`);
  console.log(`ZIP Code: ${zipCode}`);
  console.log(`Page Size: ${pageSize}`);

  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      console.error(`❌ User not found: ${userId}`);
      process.exit(1);
    }

    console.log(`User: ${user.name} (${user.email})`);

    // Step 1: Fetch properties
    const rawProperties = await fetchProperties(zipCode, pageSize);

    if (rawProperties.length === 0) {
      console.log('❌ No properties found for this ZIP code');
      process.exit(0);
    }

    // Step 2: Transform and enrich with AVM
    console.log(`\n🔄 Enriching ${rawProperties.length} properties with AVM data...`);

    const enrichedProperties: EnrichedProperty[] = [];

    for (let i = 0; i < rawProperties.length; i++) {
      const prop = rawProperties[i];
      const address = prop.address?.line1 || '';
      const city = prop.address?.locality || '';
      const state = prop.address?.countrySubd || '';
      const zip = prop.address?.postal1 || zipCode;

      console.log(`   [${i + 1}/${rawProperties.length}] ${address}...`);

      // Fetch AVM data
      const avmData = await enrichWithAvm(address, city, state);

      const enriched: EnrichedProperty = {
        address,
        city,
        state,
        zip,
        propertyType: prop.summary?.propclass || null,
        bedrooms: prop.building?.rooms?.beds || null,
        bathrooms: prop.building?.rooms?.bathstotal || null,
        squareFeet: prop.building?.size?.universalsize || prop.building?.size?.livingsize || null,
        yearBuilt: prop.summary?.yearbuilt || null,
        lastSalePrice: prop.sale?.amount?.saleamt || null,
        lastSaleDate: null,
        estimatedValue: avmData.estimatedValue,
        assessedValue: avmData.assessedValue,
        score: 0,
        sourceId: prop.identifier?.attomId?.toString() || null,
      };

      // Calculate score
      enriched.score = calculateScore(enriched);

      enrichedProperties.push(enriched);

      // Log enrichment result
      if (avmData.estimatedValue) {
        console.log(`      ✅ AVM: $${avmData.estimatedValue.toLocaleString()}, Score: ${enriched.score}`);
      } else {
        console.log(`      ⚠️  No AVM data, Score: ${enriched.score}`);
      }

      // Rate limit
      await sleep(500);
    }

    // Step 3: Ingest into database
    console.log(`\n📥 Ingesting ${enrichedProperties.length} properties into database...`);

    let created = 0;
    let updated = 0;

    for (const prop of enrichedProperties) {
      try {
        const existing = await prisma.property.findFirst({
          where: {
            userId,
            address: prop.address,
            city: prop.city,
            state: prop.state,
          },
        });

        if (existing) {
          await prisma.property.update({
            where: { id: existing.id },
            data: {
              propertyType: prop.propertyType ?? existing.propertyType,
              bedrooms: prop.bedrooms ?? existing.bedrooms,
              bathrooms: prop.bathrooms ?? existing.bathrooms,
              squareFeet: prop.squareFeet ?? existing.squareFeet,
              yearBuilt: prop.yearBuilt ?? existing.yearBuilt,
              lastSalePrice: prop.lastSalePrice ?? existing.lastSalePrice,
              estimatedValue: prop.estimatedValue ?? existing.estimatedValue,
              assessedValue: prop.assessedValue ?? existing.assessedValue,
              score: prop.score,
              scoredAt: new Date(),
              dataSource: 'attom',
              sourceId: prop.sourceId,
              updatedAt: new Date(),
            },
          });
          updated++;
        } else {
          await prisma.property.create({
            data: {
              userId,
              address: prop.address,
              city: prop.city,
              state: prop.state,
              zip: prop.zip,
              propertyType: prop.propertyType,
              bedrooms: prop.bedrooms,
              bathrooms: prop.bathrooms,
              squareFeet: prop.squareFeet,
              yearBuilt: prop.yearBuilt,
              lastSalePrice: prop.lastSalePrice,
              estimatedValue: prop.estimatedValue,
              assessedValue: prop.assessedValue,
              score: prop.score,
              scoredAt: new Date(),
              dataSource: 'attom',
              sourceId: prop.sourceId,
              enriched: false,
            },
          });
          created++;
        }
      } catch (error) {
        console.error(`   ❌ Failed to save ${prop.address}:`, error);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('🎉 DISCOVERY COMPLETE!\n');
    console.log('📊 Results:');
    console.log(`   Properties fetched: ${rawProperties.length}`);
    console.log(`   Properties enriched with AVM: ${enrichedProperties.filter((p) => p.estimatedValue).length}`);
    console.log(`   New properties created: ${created}`);
    console.log(`   Existing properties updated: ${updated}`);
    console.log(`   Average score: ${Math.round(enrichedProperties.reduce((sum, p) => sum + p.score, 0) / enrichedProperties.length)}`);

    console.log('\n📋 Top 5 Properties by Score:');
    const topProperties = [...enrichedProperties].sort((a, b) => b.score - a.score).slice(0, 5);
    topProperties.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.address}, ${p.city}`);
      console.log(`      Score: ${p.score} | AVM: $${p.estimatedValue?.toLocaleString() || 'N/A'} | Sale: $${p.lastSalePrice?.toLocaleString() || 'N/A'}`);
    });

    console.log('\n🔍 Next Steps:');
    console.log('   1. View in UI: http://localhost:3007/app/underwriting');
    console.log('   2. Run skip tracing: npx tsx scripts/run-skip-trace.ts');
    console.log('   3. View in Prisma Studio: http://localhost:5556');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Discovery failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
