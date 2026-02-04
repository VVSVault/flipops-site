/**
 * Check what ATTOM API actually returns
 * Usage: npx tsx scripts/check-attom-response.ts
 */

const ATTOM_API_KEY = '72403894efb4b2cfeb4b5b41f105a53a';

async function main() {
  console.log('Checking ATTOM sale/snapshot response structure...\n');

  const url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot?postalcode=40517&pagesize=1`;

  const response = await fetch(url, {
    headers: {
      'apikey': ATTOM_API_KEY,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    console.error('API Error:', response.status, await response.text());
    return;
  }

  const data = await response.json();

  console.log('Full response structure for first property:\n');
  console.log(JSON.stringify(data.property?.[0], null, 2));

  console.log('\n\n--- KEY FIELDS CHECK ---');
  const prop = data.property?.[0];
  if (prop) {
    console.log('identifier:', prop.identifier);
    console.log('address:', prop.address);
    console.log('building:', prop.building);
    console.log('lot:', prop.lot);
    console.log('assessment:', prop.assessment);
    console.log('sale:', prop.sale);
    console.log('avm:', prop.avm);
    console.log('owner:', prop.owner);
  }
}

main().catch(console.error);
