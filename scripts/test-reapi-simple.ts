/**
 * Simple REAPI Test - No distress filters
 *
 * Run with: npx tsx scripts/test-reapi-simple.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function main() {
  const apiKey = process.env.REAPI_API_KEY;
  const baseUrl = process.env.REAPI_BASE_URL || 'https://api.realestateapi.com';

  if (!apiKey) {
    console.error('REAPI_API_KEY not set');
    process.exit(1);
  }

  console.log('Testing REAPI with basic property search...\n');

  // Test different ZIP codes
  const testZips = ['32202', '33101', '90210', '10001'];

  for (const zip of testZips) {
    console.log(`\nTesting ZIP: ${zip}`);
    console.log('-'.repeat(40));

    // Count query (free)
    try {
      const countResponse = await fetch(`${baseUrl}/v2/PropertySearch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          zip: zip,
          count: true,
        }),
      });

      const countData = await countResponse.json();

      if (countResponse.ok) {
        console.log(`  Count: ${countData.status?.total || 0} properties`);
      } else {
        console.log(`  Count error:`, countData.message || countData);
      }
    } catch (error) {
      console.log(`  Count error:`, error);
    }
  }

  // Try getting actual results (uses credits)
  console.log('\n\nFetching 2 properties from ZIP 32202 (Jacksonville, FL)...');
  console.log('-'.repeat(50));

  try {
    const searchResponse = await fetch(`${baseUrl}/v2/PropertySearch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        zip: '32202',
        size: 2, // Just 2 to conserve credits
      }),
    });

    const searchData = await searchResponse.json();

    console.log('\nFull API Response:');
    console.log(JSON.stringify(searchData, null, 2));

    if (searchResponse.ok && searchData.results?.length > 0) {
      console.log('\n\nProperty found!');
      const p = searchData.results[0];
      console.log('Address:', p.propertyInfo?.address?.address);
      console.log('REAPI ID:', p.id);
      console.log('Estimated Value:', p.estimatedValue);

      // Show all boolean flags
      console.log('\nAll distress flags available in response:');
      const flags = [
        'preForeclosure',
        'auction',
        'vacant',
        'absenteeOwner',
        'outOfStateAbsenteeOwner',
        'inherited',
        'death',
        'lien',
        'judgment',
        'highEquity',
        'freeClear',
        'corporateOwned',
        'cashBuyer',
        'mlsActive',
      ];

      for (const flag of flags) {
        console.log(`  ${flag}: ${p[flag]}`);
      }
    }
  } catch (error) {
    console.error('Search error:', error);
  }

  // Test PropertyDetail endpoint
  console.log('\n\nTesting PropertyDetail endpoint...');
  console.log('-'.repeat(50));

  try {
    const detailResponse = await fetch(`${baseUrl}/v2/PropertyDetail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        address: '123 Main St, Jacksonville, FL 32202',
      }),
    });

    const detailData = await detailResponse.json();
    console.log('PropertyDetail response status:', detailResponse.status);
    console.log('Response:', JSON.stringify(detailData, null, 2).substring(0, 500) + '...');
  } catch (error) {
    console.error('Detail error:', error);
  }
}

main().catch(console.error);
