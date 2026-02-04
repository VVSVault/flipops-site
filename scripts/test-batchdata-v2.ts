/**
 * Test BatchData Skip Trace API - Correct Format
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

const BATCHDATA_API_KEY = process.env.BATCHDATA_API_KEY || 'eprRFqavyw9vLUP1bZcoUycLJp6EMJxmmnhUGHDy';

async function testFormat(name: string, body: object) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name}`);
  console.log('Body:', JSON.stringify(body, null, 2));
  console.log('='.repeat(60));

  try {
    const response = await fetch('https://api.batchdata.com/api/v1/property/skip-trace', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BATCHDATA_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    const result = data.results?.persons?.[0];
    if (result && !result.meta?.error) {
      console.log('\n✅ SUCCESS!');
      console.log('Name:', result.name);
      console.log('Phones:', result.phoneNumbers);
      console.log('Emails:', result.emails);
    } else if (result?.meta?.errorMessage) {
      console.log('\n❌ Error:', result.meta.errorMessage);
    }
  } catch (error) {
    console.log('Error:', error);
  }
}

async function main() {
  console.log('Testing BatchData Skip Trace API formats...\n');

  // Format 1: Current format
  await testFormat('Format 1: Nested address object', {
    requests: [{
      address: {
        street: '2825 EASTHILLS DR',
        city: 'LEXINGTON',
        state: 'KY',
        zip: '40517',
      },
    }],
  });

  // Format 2: Flat property address
  await testFormat('Format 2: Flat propertyAddress', {
    requests: [{
      propertyAddress: {
        street: '2825 EASTHILLS DR',
        city: 'LEXINGTON',
        state: 'KY',
        zip: '40517',
      },
    }],
  });

  // Format 3: With streetAddress
  await testFormat('Format 3: streetAddress field', {
    requests: [{
      propertyAddress: {
        streetAddress: '2825 EASTHILLS DR',
        city: 'LEXINGTON',
        state: 'KY',
        zip: '40517',
      },
    }],
  });

  // Format 4: Top level fields
  await testFormat('Format 4: Top level fields', {
    requests: [{
      street: '2825 EASTHILLS DR',
      city: 'LEXINGTON',
      state: 'KY',
      zip: '40517',
    }],
  });

  // Format 5: Single request (not array)
  await testFormat('Format 5: Single request object', {
    propertyAddress: {
      street: '2825 EASTHILLS DR',
      city: 'LEXINGTON',
      state: 'KY',
      zip: '40517',
    },
  });

  // Format 6: With address1/address2
  await testFormat('Format 6: address1/address2', {
    requests: [{
      address1: '2825 EASTHILLS DR',
      address2: 'LEXINGTON, KY 40517',
    }],
  });

  // Format 7: Full address string
  await testFormat('Format 7: Full address string', {
    requests: [{
      address: '2825 EASTHILLS DR, LEXINGTON, KY 40517',
    }],
  });
}

main().catch(console.error);
