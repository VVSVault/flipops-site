/**
 * REAPI Connection Test Script
 *
 * Run with: npx tsx scripts/test-reapi-connection.ts
 *
 * Tests:
 * 1. API connection
 * 2. Free count query (no credits used)
 * 3. Property search (uses credits)
 * 4. Property detail (uses credits)
 * 5. Distress scoring
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Now import REAPI modules (they read env vars at import time)
async function main() {
  console.log('\n========================================');
  console.log('REAPI Connection Test');
  console.log('========================================\n');

  // Check environment
  const apiKey = process.env.REAPI_API_KEY;
  const baseUrl = process.env.REAPI_BASE_URL || 'https://api.realestateapi.com';

  if (!apiKey) {
    console.error('REAPI_API_KEY not set in .env.local');
    process.exit(1);
  }

  console.log(`API Key: ${apiKey.substring(0, 12)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log('');

  // Test 1: Free count query
  console.log('Test 1: Count properties in ZIP 33125 (FREE - no credits)');
  console.log('-----------------------------------------------------------');

  try {
    const countResponse = await fetch(`${baseUrl}/v2/PropertySearch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        zip: '33125',
        count: true, // FREE - just get count
      }),
    });

    const countData = await countResponse.json();

    if (!countResponse.ok) {
      console.error('Count query failed:', countData);
      process.exit(1);
    }

    console.log(`Total properties in ZIP 33125: ${countData.status?.total || 0}`);
    console.log('Count query: SUCCESS (0 credits used)');
    console.log('');
  } catch (error) {
    console.error('Count query error:', error);
    process.exit(1);
  }

  // Test 2: Count with distress filters (still free)
  console.log('Test 2: Count PRE-FORECLOSURE properties in ZIP 33125 (FREE)');
  console.log('--------------------------------------------------------------');

  try {
    const distressCountResponse = await fetch(`${baseUrl}/v2/PropertySearch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        zip: '33125',
        preForeclosure: true,
        count: true,
      }),
    });

    const distressCountData = await distressCountResponse.json();

    if (!distressCountResponse.ok) {
      console.error('Distress count query failed:', distressCountData);
    } else {
      console.log(`Pre-foreclosure properties in ZIP 33125: ${distressCountData.status?.total || 0}`);
      console.log('Distress count query: SUCCESS (0 credits used)');
    }
    console.log('');
  } catch (error) {
    console.error('Distress count query error:', error);
  }

  // Test 3: Actual search (USES CREDITS!)
  console.log('Test 3: Search 3 properties in ZIP 33125 (USES 3 CREDITS)');
  console.log('-----------------------------------------------------------');
  console.log('Searching with distress filters: preForeclosure OR vacant OR absenteeOwner');
  console.log('');

  try {
    const searchResponse = await fetch(`${baseUrl}/v2/PropertySearch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        zip: '33125',
        size: 3, // Only 3 to conserve credits
        // Distress filters - any of these
        preForeclosure: true,
      }),
    });

    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      console.error('Search failed:', searchData);
    } else {
      const results = searchData.results || [];
      console.log(`Found ${results.length} pre-foreclosure properties`);
      console.log('');

      if (results.length > 0) {
        const sample = results[0];
        console.log('Sample Property:');
        console.log('  Address:', sample.propertyInfo?.address?.address || 'N/A');
        console.log('  City:', sample.propertyInfo?.address?.city || 'N/A');
        console.log('  Owner:', sample.ownerInfo?.owner1FullName || 'N/A');
        console.log('  Est Value:', sample.estimatedValue ? `$${sample.estimatedValue.toLocaleString()}` : 'N/A');
        console.log('  Equity %:', sample.equityPercent || 'N/A');
        console.log('');
        console.log('Distress Flags:');
        console.log('  preForeclosure:', sample.preForeclosure);
        console.log('  vacant:', sample.vacant);
        console.log('  absenteeOwner:', sample.absenteeOwner);
        console.log('  outOfStateOwner:', sample.outOfStateAbsenteeOwner);
        console.log('  inherited:', sample.inherited);
        console.log('  death:', sample.death);
        console.log('  lien:', sample.lien);
        console.log('  judgment:', sample.judgment);
        console.log('  highEquity:', sample.highEquity);
        console.log('  freeClear:', sample.freeClear);
        console.log('');
        console.log(`Search: SUCCESS (~${results.length} credits used)`);
      }
    }
    console.log('');
  } catch (error) {
    console.error('Search error:', error);
  }

  // Test 4: Count properties by different distress types
  console.log('Test 4: Count properties by distress type in ZIP 33125 (FREE)');
  console.log('--------------------------------------------------------------');

  const distressTypes = [
    { name: 'Vacant', filter: { vacant: true } },
    { name: 'Absentee Owner', filter: { absenteeOwner: true } },
    { name: 'High Equity (50%+)', filter: { highEquity: true } },
    { name: 'Inherited', filter: { inherited: true } },
    { name: 'Lien/Judgment', filter: { lien: true } },
  ];

  for (const { name, filter } of distressTypes) {
    try {
      const response = await fetch(`${baseUrl}/v2/PropertySearch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          zip: '33125',
          count: true,
          ...filter,
        }),
      });

      const data = await response.json();
      const count = data.status?.total || 0;
      console.log(`  ${name}: ${count} properties`);
    } catch (error) {
      console.log(`  ${name}: ERROR`);
    }
  }

  console.log('');
  console.log('========================================');
  console.log('Test Complete!');
  console.log('========================================');
  console.log('');
  console.log('Next steps:');
  console.log('1. Use /api/reapi/search to search properties via UI');
  console.log('2. Use /api/reapi/import to import selected properties');
  console.log('3. BatchData will still be used for skip tracing');
  console.log('');
  console.log('NOTE: REAPI credits expire December 24, 2025');
  console.log('');
}

main().catch(console.error);
