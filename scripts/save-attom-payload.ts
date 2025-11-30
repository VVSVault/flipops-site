import fs from 'fs';

const ATTOM_API_KEY = '72403894efb4b2cfeb4b5b41f105a53a';

async function saveAttomPayload() {
  const url = new URL('https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot');
  url.searchParams.append('postalcode', '33139');
  url.searchParams.append('pagesize', '2');

  const attomResponse = await fetch(url.toString(), {
    headers: { 'apikey': ATTOM_API_KEY, 'Accept': 'application/json' }
  });

  const attomData = await attomResponse.json();

  const transformedProperties = attomData.property.map((prop: any) => ({
    address: prop.address?.line1 || 'Unknown',
    city: prop.address?.locality || 'Unknown',
    state: prop.address?.countrySubd || 'FL',
    zip: prop.address?.postal1 || 'Unknown',
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
    lastSalePrice: prop.sale?.amount?.saleamt || prop.sale?.amount?.saleAmt || null,
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
    }
  }));

  const payload = {
    userId: 'test-investor-miami',
    source: 'attom',
    properties: transformedProperties
  };

  fs.writeFileSync('attom-payload.json', JSON.stringify(payload, null, 2));
  console.log('✅ Saved payload to attom-payload.json');
  console.log(`Properties: ${transformedProperties.length}`);
}

saveAttomPayload();
