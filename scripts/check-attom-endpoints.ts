/**
 * Test different ATTOM API endpoints to find one with full property data
 * Usage: npx tsx scripts/check-attom-endpoints.ts
 */

const ATTOM_API_KEY = '72403894efb4b2cfeb4b5b41f105a53a';

async function testEndpoint(name: string, url: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name}`);
  console.log(`URL: ${url}`);
  console.log('='.repeat(60));

  try {
    const response = await fetch(url, {
      headers: {
        'apikey': ATTOM_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`❌ Error: ${response.status}`);
      const text = await response.text();
      console.log(text.substring(0, 200));
      return;
    }

    const data = await response.json();
    const prop = data.property?.[0];

    if (!prop) {
      console.log('❌ No property data returned');
      return;
    }

    console.log('\n✅ Success! Key fields:');
    console.log('  bedrooms:', prop.building?.rooms?.beds ?? prop.building?.rooms?.bedrooms ?? 'NOT FOUND');
    console.log('  bathrooms:', prop.building?.rooms?.bathstotal ?? prop.building?.rooms?.bathrooms ?? 'NOT FOUND');
    console.log('  sqft:', prop.building?.size?.livingsize ?? prop.building?.size?.universalsize ?? 'NOT FOUND');
    console.log('  yearBuilt:', prop.summary?.yearbuilt ?? prop.building?.summary?.yearbuilt ?? 'NOT FOUND');
    console.log('  owner:', prop.assessment?.owner?.owner1?.name ?? prop.owner?.owner1?.name ?? prop.assessment?.assessed?.owner?.name ?? 'NOT FOUND');
    console.log('  assessedValue:', prop.assessment?.assessed?.assdttlvalue ?? prop.assessment?.market?.mktttlvalue ?? 'NOT FOUND');
    console.log('  avm/estimatedValue:', prop.avm?.amount?.value ?? 'NOT FOUND');
    console.log('  lastSalePrice:', prop.sale?.amount?.saleamt ?? 'NOT FOUND');

  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }
}

async function main() {
  console.log('Testing ATTOM API endpoints to find complete property data...\n');

  // Test address for looking up specific property
  const testAddress = '2825 EASTHILLS DR';
  const testCity = 'LEXINGTON';
  const testState = 'KY';

  // 1. Sale Snapshot (what we're using)
  await testEndpoint(
    '1. Sale Snapshot (current)',
    `https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot?postalcode=40517&pagesize=1`
  );

  // 2. Property Basic Profile
  await testEndpoint(
    '2. Property Basic Profile',
    `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/basicprofile?address1=${encodeURIComponent(testAddress)}&address2=${encodeURIComponent(testCity + ', ' + testState)}`
  );

  // 3. Property Expanded Profile
  await testEndpoint(
    '3. Property Expanded Profile',
    `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/expandedprofile?address1=${encodeURIComponent(testAddress)}&address2=${encodeURIComponent(testCity + ', ' + testState)}`
  );

  // 4. Property Detail
  await testEndpoint(
    '4. Property Detail',
    `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?address1=${encodeURIComponent(testAddress)}&address2=${encodeURIComponent(testCity + ', ' + testState)}`
  );

  // 5. AVM Detail
  await testEndpoint(
    '5. AVM Detail',
    `https://api.gateway.attomdata.com/propertyapi/v1.0.0/attomavm/detail?address1=${encodeURIComponent(testAddress)}&address2=${encodeURIComponent(testCity + ', ' + testState)}`
  );

  // 6. Assessment/Basic
  await testEndpoint(
    '6. Assessment Basic',
    `https://api.gateway.attomdata.com/propertyapi/v1.0.0/assessment/basic?address1=${encodeURIComponent(testAddress)}&address2=${encodeURIComponent(testCity + ', ' + testState)}`
  );

  // 7. Sale Detail
  await testEndpoint(
    '7. Sale Detail',
    `https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/detail?address1=${encodeURIComponent(testAddress)}&address2=${encodeURIComponent(testCity + ', ' + testState)}`
  );

  console.log('\n\n' + '='.repeat(60));
  console.log('RECOMMENDATION:');
  console.log('Use the endpoint that returns beds, owner, and AVM data.');
  console.log('='.repeat(60));
}

main().catch(console.error);
