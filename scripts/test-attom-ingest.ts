/**
 * Test ATTOM API integration with FlipOps
 *
 * This script:
 * 1. Tests ATTOM API connectivity
 * 2. Fetches properties from a specific ZIP code
 * 3. Ingests them into your local FlipOps database
 *
 * Usage: npx tsx scripts/test-attom-ingest.ts [userId]
 *
 * Example:
 *   npx tsx scripts/test-attom-ingest.ts test-investor-jacksonville
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

// Configuration
const CONFIG = {
  ATTOM_API_KEY: process.env.ATTOM_API_KEY || '72403894efb4b2cfeb4b5b41f105a53a',
  FLIPOPS_API_KEY: process.env.FO_API_KEY || 'fo_live_10177805c8d743e1a6e1860515dc2b3f',
  LOCAL_URL: 'http://localhost:3007',
  ZIP_CODE: '40517', // Lexington, KY area
  PAGE_SIZE: 10, // Number of properties to fetch for testing
};

interface AttomProperty {
  identifier?: { attomId?: string; apn?: string; fips?: string };
  address?: { line1?: string; locality?: string; countrySubd?: string; postal1?: string };
  summary?: { propclass?: string; yearbuilt?: number };
  building?: { rooms?: { beds?: number; bathstotal?: number }; size?: { bldgsize?: number } };
  lot?: { lotSize2?: number };
  assessment?: { assessed?: { assdttlvalue?: number }; market?: { mktttlvalue?: number } };
  sale?: { amount?: { saleamt?: number; saleAmt?: number }; saleTransDate?: string };
  owner?: { owner1?: { firstName?: string; lastName?: string; mailingCareOfName?: string } };
  location?: { latitude?: number; longitude?: number; geoid?: string };
}

async function main() {
  console.log('='.repeat(80));
  console.log('🏠 FlipOps ATTOM Integration Test');
  console.log('='.repeat(80));
  console.log(`\nConfiguration:`);
  console.log(`  ZIP Code: ${CONFIG.ZIP_CODE}`);
  console.log(`  Page Size: ${CONFIG.PAGE_SIZE}`);
  console.log(`  Local URL: ${CONFIG.LOCAL_URL}`);
  console.log('');

  // Step 1: Test ATTOM API
  console.log('\n📡 Step 1: Testing ATTOM API connection...');
  console.log('-'.repeat(80));

  const attomUrl = new URL('https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot');
  attomUrl.searchParams.append('postalcode', CONFIG.ZIP_CODE);
  attomUrl.searchParams.append('pagesize', CONFIG.PAGE_SIZE.toString());

  console.log(`URL: ${attomUrl.toString()}\n`);

  let attomData: { property?: AttomProperty[]; status?: { total?: number } };

  try {
    const attomResponse = await fetch(attomUrl.toString(), {
      headers: {
        'apikey': CONFIG.ATTOM_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!attomResponse.ok) {
      const errorText = await attomResponse.text();
      console.error(`❌ ATTOM API failed: ${attomResponse.status}`);
      console.error(errorText);
      process.exit(1);
    }

    attomData = await attomResponse.json();
    console.log(`✅ ATTOM API connected successfully!`);
    console.log(`   Properties found: ${attomData.property?.length || 0}`);
    console.log(`   Total available: ${attomData.status?.total || 'unknown'}`);

    if (!attomData.property?.length) {
      console.log('\n⚠️  No properties found for this ZIP code. Try a different ZIP.');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ ATTOM API request failed:', error);
    process.exit(1);
  }

  // Step 2: Get or create test user
  console.log('\n👤 Step 2: Finding test user...');
  console.log('-'.repeat(80));

  let userId: string;

  try {
    // Try to get the first user from the database via a simple API call
    const usersResponse = await fetch(`${CONFIG.LOCAL_URL}/api/admin/users`, {
      headers: {
        'Authorization': `Bearer ${CONFIG.FLIPOPS_API_KEY}`
      }
    });

    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      if (usersData.users?.length > 0) {
        userId = usersData.users[0].id;
        console.log(`✅ Found existing user: ${userId}`);
      } else {
        console.log('⚠️  No users found in database.');
        console.log('   You need to sign in to the app first to create a user.');
        console.log('   Go to: http://localhost:3007/sign-in');
        process.exit(1);
      }
    } else {
      // Admin endpoint might not exist, try direct DB query via properties endpoint
      console.log('   Admin endpoint not available, will use provided user ID.');
      console.log('');
      console.log('   To find your user ID:');
      console.log('   1. Run: npx prisma studio');
      console.log('   2. Look at the User table');
      console.log('   3. Copy your user ID');
      console.log('');

      // Prompt for user ID or use a default
      const defaultUserId = process.argv[2];
      if (defaultUserId) {
        userId = defaultUserId;
        console.log(`   Using provided user ID: ${userId}`);
      } else {
        console.log('   Usage: npx tsx scripts/test-attom-ingest.ts <userId>');
        console.log('');
        console.log('   Or set USER_ID environment variable:');
        console.log('   USER_ID=your-user-id npx tsx scripts/test-attom-ingest.ts');

        const envUserId = process.env.USER_ID;
        if (envUserId) {
          userId = envUserId;
          console.log(`   Using USER_ID from env: ${userId}`);
        } else {
          console.log('\n❌ No user ID provided. Please run Prisma Studio to find your user ID.');
          console.log('   npx prisma studio');
          process.exit(1);
        }
      }
    }
  } catch (error) {
    console.log('   Could not reach admin endpoint (this is expected).');

    const envUserId = process.env.USER_ID || process.argv[2];
    if (envUserId) {
      userId = envUserId;
      console.log(`   Using provided user ID: ${userId}`);
    } else {
      console.log('\n❌ Please provide a user ID:');
      console.log('   npx tsx scripts/test-attom-ingest.ts <userId>');
      console.log('   Or: USER_ID=xxx npx tsx scripts/test-attom-ingest.ts');
      process.exit(1);
    }
  }

  // Step 3: Transform ATTOM data
  console.log('\n🔄 Step 3: Transforming ATTOM data...');
  console.log('-'.repeat(80));

  const transformedProperties = attomData.property!.map((prop: AttomProperty) => {
    const address = prop.address?.line1 || 'Unknown';
    const city = prop.address?.locality || 'Unknown';
    const state = prop.address?.countrySubd || 'KY';
    const zip = prop.address?.postal1 || CONFIG.ZIP_CODE;

    const ownerFirstName = prop.owner?.owner1?.firstName || '';
    const ownerLastName = prop.owner?.owner1?.lastName || '';
    const ownerName = `${ownerFirstName} ${ownerLastName}`.trim() || null;

    return {
      address,
      city,
      state,
      zip,
      county: 'Fayette', // Default for Lexington area
      apn: prop.identifier?.apn || null,
      ownerName,
      propertyType: prop.summary?.propclass?.toLowerCase().replace(' ', '_') || 'single_family',
      bedrooms: prop.building?.rooms?.beds || null,
      bathrooms: prop.building?.rooms?.bathstotal || null,
      squareFeet: prop.building?.size?.bldgsize || null,
      lotSize: prop.lot?.lotSize2 || null,
      yearBuilt: prop.summary?.yearbuilt || null,
      assessedValue: prop.assessment?.assessed?.assdttlvalue || null,
      lastSalePrice: prop.sale?.amount?.saleamt || prop.sale?.amount?.saleAmt || null,
      lastSaleDate: prop.sale?.saleTransDate || null,
      estimatedValue: prop.assessment?.market?.mktttlvalue || null,
      foreclosure: false,
      preForeclosure: false,
      taxDelinquent: false,
      vacant: false,
      bankruptcy: false,
      absenteeOwner: !!prop.owner?.owner1?.mailingCareOfName,
      sourceId: prop.identifier?.attomId?.toString() || null,
      metadata: {
        fips: prop.identifier?.fips,
        latitude: prop.location?.latitude,
        longitude: prop.location?.longitude,
        geoid: prop.location?.geoid,
      }
    };
  });

  console.log(`✅ Transformed ${transformedProperties.length} properties`);
  console.log('\nSample property:');
  console.log(JSON.stringify(transformedProperties[0], null, 2));

  // Step 4: Ingest into FlipOps
  console.log('\n📥 Step 4: Ingesting into FlipOps...');
  console.log('-'.repeat(80));

  const ingestPayload = {
    userId,
    source: 'attom',
    properties: transformedProperties
  };

  console.log(`Sending to: ${CONFIG.LOCAL_URL}/api/properties/ingest`);
  console.log(`User ID: ${userId}`);
  console.log(`Properties: ${transformedProperties.length}`);

  try {
    const ingestResponse = await fetch(`${CONFIG.LOCAL_URL}/api/properties/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.FLIPOPS_API_KEY}`
      },
      body: JSON.stringify(ingestPayload)
    });

    const responseText = await ingestResponse.text();

    if (!ingestResponse.ok) {
      console.error(`\n❌ Ingest failed: ${ingestResponse.status}`);
      console.error(responseText);
      process.exit(1);
    }

    const ingestResult = JSON.parse(responseText);
    console.log('\n✅ Ingestion complete!');
    console.log(JSON.stringify(ingestResult, null, 2));

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('🎉 SUCCESS!\n');
    console.log('📊 Summary:');
    console.log(`   • Fetched: ${attomData.property?.length || 0} properties from ATTOM`);
    console.log(`   • Created: ${ingestResult.results?.created || 0} new properties`);
    console.log(`   • Updated: ${ingestResult.results?.updated || 0} existing properties`);
    console.log(`   • Skipped: ${ingestResult.results?.skipped || 0} properties`);
    console.log('');
    console.log('🔍 Next Steps:');
    console.log('   1. Check database: npx prisma studio');
    console.log('   2. Open FlipOps UI: http://localhost:3007/app/underwriting');
    console.log('   3. Properties should appear in the Underwriting page');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ Ingest request failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
