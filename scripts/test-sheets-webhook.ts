#!/usr/bin/env tsx
/**
 * Test the sheets webhook with sample data
 */

const testData = [
  {
    address: '654 Maple Blvd',
    city: 'Miami',
    state: 'FL',
    zip: '33143',
    owner_name: 'Charlie Brown',
    foreclosure: 'yes',
    pre_foreclosure: 'yes',
    tax_delinquent: 'yes',
    vacant: 'yes',
    bankruptcy: 'yes',
    absentee_owner: 'yes'
  },
  {
    address: '369 Spruce Ave',
    city: 'Miami',
    state: 'FL',
    zip: '33147',
    owner_name: 'Grace Lee',
    foreclosure: 'yes',
    pre_foreclosure: 'yes',
    tax_delinquent: 'yes',
    vacant: 'yes',
    bankruptcy: 'no',
    absentee_owner: 'yes'
  },
  {
    address: '789 Elm Dr',
    city: 'Miami Beach',
    state: 'FL',
    zip: '33141',
    owner_name: 'Bob Johnson',
    foreclosure: 'yes',
    pre_foreclosure: 'no',
    tax_delinquent: 'yes',
    vacant: 'yes',
    bankruptcy: 'no',
    absentee_owner: 'yes'
  }
];

async function testWebhook() {
  console.log('Testing sheets webhook with sample data...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/webhooks/sheets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testWebhook();
