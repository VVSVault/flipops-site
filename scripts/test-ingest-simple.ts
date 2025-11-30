const LOCAL_URL = 'http://localhost:3007';

/**
 * Simple test of the ingest endpoint with minimal data
 */
async function testIngestSimple() {
  console.log('🧪 Testing Ingest Endpoint...\n');

  const payload = {
    userId: 'test-investor-miami',
    source: 'attom',
    properties: [
      {
        address: '123 Test Street',
        city: 'Miami Beach',
        state: 'FL',
        zip: '33139',
        county: 'Miami-Dade',
        propertyType: 'single_family',
        foreclosure: false,
        preForeclosure: false,
        taxDelinquent: false,
        vacant: false,
        bankruptcy: false,
        absenteeOwner: false
      }
    ]
  };

  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('');

  try {
    const response = await fetch(`${LOCAL_URL}/api/properties/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    const result = await response.json();
    console.log('\nResponse:');
    console.log(JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ Ingest endpoint working!');
    } else {
      console.log('\n❌ Ingest endpoint failed');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testIngestSimple();
