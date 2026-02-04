/**
 * Test BatchData Skip Trace API
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

const BATCHDATA_API_KEY = process.env.BATCHDATA_API_KEY || 'eprRFqavyw9vLUP1bZcoUycLJp6EMJxmmnhUGHDy';

async function main() {
  console.log('Testing BatchData Skip Trace API...\n');
  console.log('API Key:', BATCHDATA_API_KEY.substring(0, 10) + '...');

  const testAddress = {
    street: '2825 EASTHILLS DR',
    city: 'LEXINGTON',
    state: 'KY',
    zip: '40517',
  };

  console.log('\nTest Address:', JSON.stringify(testAddress, null, 2));

  // Try different API endpoints
  const endpoints = [
    'https://api.batchdata.com/api/v1/property/skip-trace',
    'https://api.batchdata.com/api/v1/skip-trace',
    'https://api.batchdata.com/api/v1/property/lookup',
  ];

  for (const endpoint of endpoints) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${endpoint}`);
    console.log('='.repeat(60));

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BATCHDATA_API_KEY}`,
          'x-api-key': BATCHDATA_API_KEY,
        },
        body: JSON.stringify({
          requests: [{ address: testAddress }],
        }),
      });

      console.log('Status:', response.status, response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));

      const text = await response.text();
      console.log('Response:', text.substring(0, 500));

      if (response.ok) {
        console.log('\n✅ This endpoint works!');
        try {
          const data = JSON.parse(text);
          console.log('Parsed data:', JSON.stringify(data, null, 2));
        } catch (e) {
          // Not JSON
        }
      }
    } catch (error) {
      console.log('Error:', error);
    }
  }
}

main().catch(console.error);
