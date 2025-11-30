const ATTOM_API_KEY = '72403894efb4b2cfeb4b5b41f105a53a';

/**
 * Debug: Print out what we're actually sending
 */
async function debugAttomPayload() {
  console.log('🐛 Debugging ATTOM Payload...\n');

  // Fetch ONE property from ATTOM
  const url = new URL('https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot');
  url.searchParams.append('postalcode', '33139');
  url.searchParams.append('pagesize', '1');

  const attomResponse = await fetch(url.toString(), {
    headers: {
      'apikey': ATTOM_API_KEY,
      'Accept': 'application/json'
    }
  });

  const attomData = await attomResponse.json();
  const prop = attomData.property[0];

  console.log('Raw ATTOM Property:');
  console.log(JSON.stringify(prop, null, 2));
  console.log('\n' + '='.repeat(80) + '\n');

  // Transform it
  const address = prop.address?.line1 || 'Unknown';
  const city = prop.address?.locality || 'Unknown';
  const state = prop.address?.countrySubd || 'FL';
  const zip = prop.address?.postal1 || 'Unknown';

  const transformed = {
    address,
    city,
    state,
    zip,
    county: 'Miami-Dade',
    apn: prop.identifier?.apn || null,
    ownerName: `${prop.owner?.owner1?.firstName || ''} ${prop.owner?.owner1?.lastName || ''}`.trim() || null,
    propertyType: prop.summary?.propclass?.toLowerCase().replace(' ', '_') || null,
    bedrooms: prop.building?.rooms?.beds || null,
    bathrooms: prop.building?.rooms?.bathstotal || null,
    squareFeet: prop.building?.size?.bldgsize || null,
    lotSize: prop.lot?.lotSize2 || null,
    yearBuilt: prop.summary?.yearbuilt || null,
    assessedValue: prop.assessment?.assessed?.assdttlvalue || null,
    lastSaleDate: prop.sale?.saleTransDate || null,
    lastSalePrice: prop.sale?.amount?.saleAmt || null,
    estimatedValue: prop.assessment?.market?.mktttlvalue || prop.assessment?.assessed?.assdttlvalue || null,
    foreclosure: false,
    preForeclosure: false,
    taxDelinquent: false,
    vacant: false,
    bankruptcy: false,
    absenteeOwner: prop.owner?.owner1?.mailingCareOfName ? true : false,
    sourceId: prop.identifier?.attomId?.toString() || null,
    metadata: {
      fips: prop.identifier?.fips,
      geoid: prop.location?.geoid,
      matchCode: prop.address?.matchCode,
      latitude: prop.location?.latitude,
      longitude: prop.location?.longitude,
    }
  };

  console.log('Transformed Property:');
  console.log(JSON.stringify(transformed, null, 2));
  console.log('\n' + '='.repeat(80) + '\n');

  console.log('Field Type Check:');
  Object.entries(transformed).forEach(([key, value]) => {
    console.log(`  ${key}: ${typeof value} = ${value === null ? 'null' : value === undefined ? 'undefined' : JSON.stringify(value).substring(0, 50)}`);
  });
}

debugAttomPayload();
