/**
 * Test different ATTOM endpoints to find one with building/sale data
 */

const ATTOM_API_KEY = '72403894efb4b2cfeb4b5b41f105a53a';

async function testEndpoint(name: string, url: string) {
  console.log(`\n📝 Testing: ${name}`);
  console.log(`   URL: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'apikey': ATTOM_API_KEY,
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`   ❌ Failed: ${response.status}`);
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}`);
      return;
    }

    const data = await response.json();

    if (data.property && data.property.length > 0) {
      const prop = data.property[0];
      console.log(`   ✅ Success: ${data.property.length} properties`);
      console.log(`   📊 Data available:`);
      console.log(`      - identifier: ${!!prop.identifier}`);
      console.log(`      - address: ${!!prop.address}`);
      console.log(`      - building: ${!!prop.building}`);
      console.log(`      - sale: ${!!prop.sale}`);
      console.log(`      - assessment: ${!!prop.assessment}`);
      console.log(`      - avm: ${!!prop.avm}`);
      console.log(`      - lot: ${!!prop.lot}`);
      console.log(`   📋 All keys: ${Object.keys(prop).join(', ')}`);
    } else {
      console.log(`   ⚠️  No properties returned`);
      console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
    }
  } catch (error) {
    console.error(`   ❌ Error:`, error.message);
  }
}

async function main() {
  console.log('🔍 ATTOM API Endpoint Testing');
  console.log('==============================');

  const zip = '32202';
  const pagesize = 2;

  await testEndpoint(
    'Property Address (current)',
    `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/address?postalcode=${zip}&pagesize=${pagesize}`
  );

  await testEndpoint(
    'Property Detail',
    `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?postalcode=${zip}&pagesize=${pagesize}`
  );

  await testEndpoint(
    'Property Expanded',
    `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/expandedprofile?postalcode=${zip}&pagesize=${pagesize}`
  );

  await testEndpoint(
    'Property Basic with includes',
    `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/basicprofile?postalcode=${zip}&pagesize=${pagesize}`
  );
}

main().catch(console.error);
