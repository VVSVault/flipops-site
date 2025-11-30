const ATTOM_API_KEY = '72403894efb4b2cfeb4b5b41f105a53a';

/**
 * Test ATTOM Sales API for foreclosure/preforeclosure search
 * This is what we need for automated property discovery
 */
async function testAttomForeclosureSearch() {
  console.log('🏚️  Testing ATTOM Foreclosure Search API...\n');
  console.log('=' .repeat(80));

  // Test 1: Sales Snapshot (recent sales in an area)
  console.log('\n📊 Test 1: Sales Snapshot by Postal Code');
  console.log('-'.repeat(80));

  try {
    // Miami Beach postal code
    const url = new URL('https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot');
    url.searchParams.append('postalcode', '33139'); // Miami Beach
    url.searchParams.append('pagesize', '5');

    console.log(`URL: ${url.toString()}\n`);

    const response = await fetch(url.toString(), {
      headers: {
        'apikey': ATTOM_API_KEY,
        'Accept': 'application/json'
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ Sales Snapshot Response:');
      console.log(JSON.stringify(data, null, 2).substring(0, 1500) + '...\n');
    } else {
      const errorText = await response.text();
      console.log('\n❌ Error:');
      console.log(errorText);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }

  // Test 2: Property Detail with Sales History
  console.log('\n\n🏠 Test 2: Property Detail with Sales History');
  console.log('-'.repeat(80));

  try {
    const url = new URL('https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail');
    url.searchParams.append('address1', '1600 Meridian Ave');
    url.searchParams.append('address2', 'Miami Beach, FL 33139');

    console.log(`URL: ${url.toString()}\n`);

    const response = await fetch(url.toString(), {
      headers: {
        'apikey': ATTOM_API_KEY,
        'Accept': 'application/json'
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ Property Detail Response:');

      if (data.property && data.property.length > 0) {
        const property = data.property[0];
        console.log(`\nAddress: ${property.address?.oneLine || 'N/A'}`);
        console.log(`APN: ${property.identifier?.apn || 'N/A'}`);
        console.log(`Owner: ${property.owner?.owner1?.firstName || ''} ${property.owner?.owner1?.lastName || 'N/A'}`);
        console.log(`Property Type: ${property.summary?.propclass || 'N/A'}`);
        console.log(`Bedrooms: ${property.building?.rooms?.beds || 'N/A'}`);
        console.log(`Bathrooms: ${property.building?.rooms?.bathstotal || 'N/A'}`);
        console.log(`Square Feet: ${property.building?.size?.bldgsize || 'N/A'}`);
        console.log(`Year Built: ${property.summary?.yearbuilt || 'N/A'}`);
        console.log(`Assessed Value: $${property.assessment?.assessed?.assdttlvalue?.toLocaleString() || 'N/A'}`);
        console.log(`Market Value: $${property.assessment?.market?.mktttlvalue?.toLocaleString() || 'N/A'}`);

        // Check for distress indicators
        if (property.sale) {
          console.log(`\nSale Info:`);
          console.log(`  Last Sale Date: ${property.sale?.saleTransDate || 'N/A'}`);
          console.log(`  Last Sale Price: $${property.sale?.amount?.saleAmt?.toLocaleString() || 'N/A'}`);
        }
      }
    } else {
      const errorText = await response.text();
      console.log('\n❌ Error:');
      console.log(errorText);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }

  // Test 3: Try AVM (Automated Valuation Model) endpoint
  console.log('\n\n💰 Test 3: AVM (Property Valuation)');
  console.log('-'.repeat(80));

  try {
    const url = new URL('https://api.gateway.attomdata.com/propertyapi/v1.0.0/avm');
    url.searchParams.append('address1', '1600 Meridian Ave');
    url.searchParams.append('address2', 'Miami Beach, FL 33139');

    console.log(`URL: ${url.toString()}\n`);

    const response = await fetch(url.toString(), {
      headers: {
        'apikey': ATTOM_API_KEY,
        'Accept': 'application/json'
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ AVM Response:');
      console.log(JSON.stringify(data, null, 2).substring(0, 1000) + '...');
    } else {
      const errorText = await response.text();
      console.log('\n⚠️  AVM Response:');
      console.log(errorText);
      console.log('\n💡 AVM may require additional subscription');
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }

  // Summary and recommendations
  console.log('\n\n' + '='.repeat(80));
  console.log('📋 SUMMARY & RECOMMENDATIONS\n');
  console.log('✅ What Works:');
  console.log('  • Property Detail by Address - WORKING');
  console.log('  • Expanded Profile - WORKING');
  console.log('  • Sales Snapshot by Postal Code - TESTING NEEDED');
  console.log('');
  console.log('🤔 For Property Discovery, We Need:');
  console.log('  1. Bulk search by county (not just postal code)');
  console.log('  2. Filter by foreclosure/preforeclosure status');
  console.log('  3. Filter by tax delinquent status');
  console.log('  4. Vacancy indicators');
  console.log('');
  console.log('💡 Recommended Approach:');
  console.log('  Option A: Use postal code loop (search each ZIP in target market)');
  console.log('  Option B: Check if trial includes Sales/Distressed Property API');
  console.log('  Option C: Start with manual property list → score → expand later');
  console.log('');
  console.log('📚 Next Steps:');
  console.log('  1. Contact ATTOM support to confirm trial API access level');
  console.log('  2. Test Sales API endpoints if available');
  console.log('  3. Build ZIP code loop for Miami-Dade (33 ZIP codes)');
  console.log('  4. Create ATTOM → FlipOps data transformer');
  console.log('=' .repeat(80));
}

testAttomForeclosureSearch();
