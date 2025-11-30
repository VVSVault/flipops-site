const ATTOM_API_KEY = '72403894efb4b2cfeb4b5b41f105a53a';

/**
 * Test ATTOM API property search capabilities
 * Goal: Find foreclosure properties in Miami-Dade County
 */
async function testAttomPropertySearch() {
  console.log('🔍 Testing ATTOM API Property Search...\n');
  console.log('=' .repeat(80));

  // Test 1: Property detail by address (verify API key works)
  console.log('\n📍 Test 1: Property Detail by Address');
  console.log('-'.repeat(80));

  try {
    const testAddress = '4529 Winona Court';
    const testCity = 'Denver';
    const testState = 'CO';

    const url = new URL('https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/basicprofile');
    url.searchParams.append('address1', testAddress);
    url.searchParams.append('address2', `${testCity}, ${testState}`);

    console.log(`Searching for: ${testAddress}, ${testCity}, ${testState}`);
    console.log(`URL: ${url.toString()}\n`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'apikey': ATTOM_API_KEY,
        'Accept': 'application/json'
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ Success! Sample Response:');
      console.log(JSON.stringify(data, null, 2).substring(0, 1000) + '...');
    } else {
      const errorText = await response.text();
      console.log('\n❌ Error:');
      console.log(errorText);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }

  // Test 2: Try expanded profile (more data)
  console.log('\n\n📊 Test 2: Expanded Profile');
  console.log('-'.repeat(80));

  try {
    const testAddress = '4529 Winona Court';
    const testCity = 'Denver';
    const testState = 'CO';

    const url = new URL('https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/expandedprofile');
    url.searchParams.append('address1', testAddress);
    url.searchParams.append('address2', `${testCity}, ${testState}`);

    console.log(`Searching for: ${testAddress}, ${testCity}, ${testState}\n`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'apikey': ATTOM_API_KEY,
        'Accept': 'application/json'
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ Success! Property Details:');

      // Extract key fields
      if (data.property && data.property.length > 0) {
        const property = data.property[0];
        console.log(`\nAddress: ${property.address?.oneLine || 'N/A'}`);
        console.log(`Type: ${property.summary?.propclass || 'N/A'}`);
        console.log(`Bedrooms: ${property.building?.rooms?.beds || 'N/A'}`);
        console.log(`Bathrooms: ${property.building?.rooms?.bathstotal || 'N/A'}`);
        console.log(`Square Feet: ${property.building?.size?.bldgsize || 'N/A'}`);
        console.log(`Year Built: ${property.summary?.yearbuilt || 'N/A'}`);
        console.log(`Assessed Value: $${property.assessment?.assessed?.assdttlvalue?.toLocaleString() || 'N/A'}`);
        console.log(`Market Value: $${property.assessment?.market?.mktttlvalue?.toLocaleString() || 'N/A'}`);
      }
    } else {
      const errorText = await response.text();
      console.log('\n❌ Error:');
      console.log(errorText);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }

  // Test 3: Try to search by county (what we need for discovery)
  console.log('\n\n🏘️  Test 3: Search by County');
  console.log('-'.repeat(80));
  console.log('Note: This may require different endpoint or premium access\n');

  try {
    // Try property/snapshot endpoint with geoid (county code)
    // Miami-Dade County FIPS code: 12086
    const url = new URL('https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/snapshot');
    url.searchParams.append('geoid', '12086'); // Miami-Dade
    url.searchParams.append('pagesize', '5');

    console.log(`URL: ${url.toString()}\n`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'apikey': ATTOM_API_KEY,
        'Accept': 'application/json'
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ County Search Works!');
      console.log(JSON.stringify(data, null, 2).substring(0, 1500) + '...');
    } else {
      const errorText = await response.text();
      console.log('\n⚠️  Endpoint Response:');
      console.log(errorText);
      console.log('\n💡 May need to use different endpoint for bulk search');
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('📚 ATTOM API Documentation Links:\n');
  console.log('• Developer Portal: https://api.developer.attomdata.com/');
  console.log('• Property API: https://api.developer.attomdata.com/propertyapi');
  console.log('• Sales API (foreclosures): https://api.developer.attomdata.com/saleapi');
  console.log('\n💡 Next Steps:');
  console.log('1. Review API docs to find foreclosure/preforeclosure search endpoint');
  console.log('2. Test sales/snapshot endpoint for foreclosure data');
  console.log('3. Build transformer to convert ATTOM format → FlipOps format');
  console.log('=' .repeat(80));
}

testAttomPropertySearch();
