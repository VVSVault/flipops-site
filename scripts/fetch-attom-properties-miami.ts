const ATTOM_API_KEY = '72403894efb4b2cfeb4b5b41f105a53a';
const LOCAL_URL = 'http://localhost:3007';

/**
 * Fetch properties from ATTOM API for Miami Beach and ingest them
 * for our test Miami investor
 */
async function fetchAndIngestMiamiProperties() {
  console.log('🏖️  Fetching Miami Beach Properties from ATTOM...\n');
  console.log('=' .repeat(80));

  try {
    // Step 1: Fetch properties from ATTOM Sales Snapshot
    console.log('\n📊 Step 1: Fetching from ATTOM API...');
    console.log('-'.repeat(80));

    const url = new URL('https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot');
    url.searchParams.append('postalcode', '33139'); // Miami Beach
    url.searchParams.append('pagesize', '10'); // Get 10 properties for testing

    console.log(`URL: ${url.toString()}\n`);

    const attomResponse = await fetch(url.toString(), {
      headers: {
        'apikey': ATTOM_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!attomResponse.ok) {
      throw new Error(`ATTOM API failed: ${attomResponse.status} ${attomResponse.statusText}`);
    }

    const attomData = await attomResponse.json();
    console.log(`✅ Fetched ${attomData.property?.length || 0} properties from ATTOM`);
    console.log(`   Total available: ${attomData.status.total}`);
    console.log('');

    // Step 2: Transform ATTOM format to FlipOps format
    console.log('🔄 Step 2: Transforming data...');
    console.log('-'.repeat(80));

    const transformedProperties = attomData.property.map((prop: any) => {
      // Extract address components
      const address = prop.address?.line1 || 'Unknown';
      const city = prop.address?.locality || 'Unknown';
      const state = prop.address?.countrySubd || 'FL';
      const zip = prop.address?.postal1 || 'Unknown';
      const county = 'Miami-Dade';

      // Extract property details
      const propertyType = prop.summary?.propclass?.toLowerCase().replace(' ', '_') || 'single_family';
      const bedrooms = prop.building?.rooms?.beds || null;
      const bathrooms = prop.building?.rooms?.bathstotal || null;
      const squareFeet = prop.building?.size?.bldgsize || null;
      const lotSize = prop.lot?.lotSize2 || null;
      const yearBuilt = prop.summary?.yearbuilt || null;

      // Extract financial info
      const assessedValue = prop.assessment?.assessed?.assdttlvalue || null;
      const lastSalePrice = prop.sale?.amount?.saleamt || prop.sale?.amount?.saleAmt || null;
      const lastSaleDate = prop.sale?.saleTransDate || null;
      const estimatedValue = prop.assessment?.market?.mktttlvalue || assessedValue;

      // Extract owner info
      const ownerFirstName = prop.owner?.owner1?.firstName || '';
      const ownerLastName = prop.owner?.owner1?.lastName || '';
      const ownerName = `${ownerFirstName} ${ownerLastName}`.trim() || null;

      // Determine distress signals (basic heuristics from available data)
      // Note: ATTOM may have specific foreclosure fields in other endpoints
      const foreclosure = false; // Would need foreclosure-specific endpoint
      const preForeclosure = false;
      const taxDelinquent = false; // Would need tax data
      const vacant = false;
      const bankruptcy = false;
      const absenteeOwner = prop.owner?.owner1?.mailingCareOfName ? true : false;

      return {
        address,
        city,
        state,
        zip,
        county,
        apn: prop.identifier?.apn || null,
        ownerName,
        propertyType,
        bedrooms,
        bathrooms,
        squareFeet,
        lotSize,
        yearBuilt,
        assessedValue,
        lastSaleDate,
        lastSalePrice,
        estimatedValue,
        foreclosure,
        preForeclosure,
        taxDelinquent,
        vacant,
        bankruptcy,
        absenteeOwner,
        sourceId: prop.identifier?.attomId?.toString() || null,
        metadata: {
          fips: prop.identifier?.fips,
          geoid: prop.location?.geoid,
          matchCode: prop.address?.matchCode,
          latitude: prop.location?.latitude,
          longitude: prop.location?.longitude,
        }
      };
    });

    console.log(`✅ Transformed ${transformedProperties.length} properties`);
    console.log('');

    // Step 3: Ingest into FlipOps via API
    console.log('📥 Step 3: Ingesting into FlipOps...');
    console.log('-'.repeat(80));

    const ingestPayload = {
      userId: 'test-investor-miami',
      source: 'attom',
      properties: transformedProperties
    };

    console.log(`Sending to: ${LOCAL_URL}/api/properties/ingest`);
    console.log(`Payload: ${transformedProperties.length} properties for user test-investor-miami\n`);

    const ingestResponse = await fetch(`${LOCAL_URL}/api/properties/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ingestPayload)
    });

    if (!ingestResponse.ok) {
      const errorText = await ingestResponse.text();
      throw new Error(`Ingest API failed: ${ingestResponse.status}\n${errorText}`);
    }

    const ingestResult = await ingestResponse.json();
    console.log('✅ Ingestion complete!');
    console.log(JSON.stringify(ingestResult, null, 2));

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('🎉 SUCCESS!\n');
    console.log('📊 Summary:');
    console.log(`   • Fetched: ${attomData.property?.length || 0} properties from ATTOM`);
    console.log(`   • Created: ${ingestResult.results.created} new properties`);
    console.log(`   • Updated: ${ingestResult.results.updated} existing properties`);
    console.log(`   • Skipped: ${ingestResult.results.skipped} properties`);
    console.log('');
    console.log('🔍 Next Steps:');
    console.log('   1. Check database: npx prisma studio');
    console.log('   2. Verify properties belong to test-investor-miami');
    console.log('   3. Run scoring on new properties');
    console.log('   4. Build n8n workflow to automate this daily');
    console.log('=' .repeat(80));

  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error instanceof Error) {
      console.error('Details:', error.message);
    }
    process.exit(1);
  }
}

fetchAndIngestMiamiProperties();
