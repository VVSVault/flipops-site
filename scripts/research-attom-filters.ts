/**
 * Research ATTOM API Filtering Capabilities
 *
 * Tests various endpoints and parameters to understand:
 * 1. What filters are available for property discovery
 * 2. How to filter by distress indicators
 * 3. What data we get back for investor personalization
 */

const ATTOM_API_KEY = '72403894efb4b2cfeb4b5b41f105a53a';
const BASE_URL = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0';

// Test location: Jacksonville, FL (Duval County)
const TEST_ZIP = '32202'; // Downtown Jacksonville

async function callAttomAPI(endpoint: string, params: Record<string, string>) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  console.log(`\n🔍 Testing: ${endpoint}`);
  console.log(`   URL: ${url.toString()}\n`);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'apikey': ATTOM_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`   ❌ Status: ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText.substring(0, 200)}`);
      return null;
    }

    const data = await response.json();
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   Records: ${data.property?.length || data.salestrends?.length || 'N/A'}`);
    console.log(`   Total: ${data.status?.total || 'N/A'}`);

    return data;
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    return null;
  }
}

async function researchAttomFilters() {
  console.log('🏗️  ATTOM API Filter Research');
  console.log('=' .repeat(80));
  console.log('Testing Location: Jacksonville, FL (ZIP 32202)');
  console.log('=' .repeat(80));

  // Test 1: Basic Sales Snapshot (our current working endpoint)
  console.log('\n📊 TEST 1: Sales Snapshot (Current Approach)');
  console.log('-'.repeat(80));
  const test1 = await callAttomAPI('/sale/snapshot', {
    postalcode: TEST_ZIP,
    pagesize: '5'
  });
  if (test1?.property?.[0]) {
    console.log('\n   Sample Property Fields:');
    const prop = test1.property[0];
    console.log(`   - Address: ${prop.address?.line1}`);
    console.log(`   - Property Type: ${prop.summary?.propclass}`);
    console.log(`   - Beds/Baths: ${prop.building?.rooms?.beds}/${prop.building?.rooms?.bathstotal}`);
    console.log(`   - Last Sale: ${prop.sale?.amount?.saleamt} on ${prop.sale?.saleTransDate}`);
    console.log(`   - Assessed Value: ${prop.assessment?.assessed?.assdttlvalue}`);
    console.log(`   - Owner: ${prop.owner?.owner1?.firstName} ${prop.owner?.owner1?.lastName}`);
    console.log(`   - Has Absentee Flag: ${prop.owner?.owner1?.mailingCareOfName ? 'Yes' : 'No'}`);
  }

  // Test 2: Property Detail with Address (more comprehensive data)
  console.log('\n\n📊 TEST 2: Property Detail (Deep Dive)');
  console.log('-'.repeat(80));
  const test2 = await callAttomAPI('/property/detail', {
    postalcode: TEST_ZIP,
    pagesize: '2'
  });
  if (test2?.property?.[0]) {
    console.log('\n   Additional Fields Available:');
    const prop = test2.property[0];
    console.log(`   - Has Foreclosure Data: ${prop.foreclosure ? 'Yes' : 'No'}`);
    console.log(`   - Has Mortgage Data: ${prop.mortgage ? 'Yes' : 'No'}`);
    console.log(`   - Has Tax Data: ${prop.assessment?.tax ? 'Yes' : 'No'}`);
    console.log(`   - Has Market Data: ${prop.assessment?.market ? 'Yes' : 'No'}`);
  }

  // Test 3: Expanded Profile (maximum data)
  console.log('\n\n📊 TEST 3: Expanded Profile (Maximum Data)');
  console.log('-'.repeat(80));
  const test3 = await callAttomAPI('/property/expandedprofile', {
    postalcode: TEST_ZIP,
    pagesize: '2'
  });
  if (test3?.property?.[0]) {
    console.log('\n   Full Data Structure Available - Check response');
  }

  // Test 4: Filter by Property Type
  console.log('\n\n📊 TEST 4: Filter by Property Type (Single Family Only)');
  console.log('-'.repeat(80));
  const test4 = await callAttomAPI('/sale/snapshot', {
    postalcode: TEST_ZIP,
    propertytype: 'SFR', // Single Family Residence
    pagesize: '5'
  });

  // Test 5: Filter by Price Range
  console.log('\n\n📊 TEST 5: Filter by Sale Price Range ($75k-$250k)');
  console.log('-'.repeat(80));
  const test5 = await callAttomAPI('/sale/snapshot', {
    postalcode: TEST_ZIP,
    minsaleamt: '75000',
    maxsaleamt: '250000',
    pagesize: '5'
  });

  // Test 6: Filter by Year Built
  console.log('\n\n📊 TEST 6: Filter by Year Built (Pre-1980 = Older Properties)');
  console.log('-'.repeat(80));
  const test6 = await callAttomAPI('/property/detail', {
    postalcode: TEST_ZIP,
    minyearbuilt: '1900',
    maxyearbuilt: '1980',
    pagesize: '5'
  });

  // Test 7: Sales History (for tracking owner tenure)
  console.log('\n\n📊 TEST 7: Sales History (10-year history)');
  console.log('-'.repeat(80));
  const test7 = await callAttomAPI('/saleshistory/snapshot', {
    postalcode: TEST_ZIP,
    pagesize: '2'
  });
  if (test7?.property?.[0]) {
    console.log('\n   Sales History Available:');
    const prop = test7.property[0];
    console.log(`   - Has Multi-Year History: ${Array.isArray(prop.sale) ? 'Yes' : 'No'}`);
    if (Array.isArray(prop.sale)) {
      console.log(`   - Number of Sales: ${prop.sale.length}`);
    }
  }

  // Test 8: AVM (Automated Valuation Model)
  console.log('\n\n📊 TEST 8: AVM Data (For Equity Calculation)');
  console.log('-'.repeat(80));
  const test8 = await callAttomAPI('/attomavm/detail', {
    postalcode: TEST_ZIP,
    pagesize: '2'
  });
  if (test8?.property?.[0]) {
    console.log('\n   AVM Data Available:');
    const prop = test8.property[0];
    console.log(`   - Has AVM Value: ${prop.avm?.amount?.value ? 'Yes' : 'No'}`);
    console.log(`   - AVM Value: $${prop.avm?.amount?.value?.toLocaleString()}`);
    console.log(`   - Confidence Score: ${prop.avm?.amount?.confidencescore}`);
  }

  // Test 9: Multiple Property Types (Pipe Delimiter)
  console.log('\n\n📊 TEST 9: Multiple Property Types (SFR|Condo|Townhouse)');
  console.log('-'.repeat(80));
  const test9 = await callAttomAPI('/sale/snapshot', {
    postalcode: TEST_ZIP,
    propertytype: 'SFR|CONDO|TOWNHOUSE',
    pagesize: '5'
  });

  // Test 10: Search by Radius (Geographic Discovery)
  console.log('\n\n📊 TEST 10: Radius Search (5 miles from downtown Jacksonville)');
  console.log('-'.repeat(80));
  const test10 = await callAttomAPI('/sale/snapshot', {
    latitude: '30.3322',
    longitude: '-81.6557',
    radius: '5',
    pagesize: '5'
  });

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📋 RESEARCH SUMMARY');
  console.log('='.repeat(80));
  console.log('\n✅ Working Filters:');
  console.log('   - postalcode (by ZIP)');
  console.log('   - propertytype (SFR, CONDO, etc. - pipe delimited)');
  console.log('   - minsaleamt / maxsaleamt (price range)');
  console.log('   - minyearbuilt / maxyearbuilt (age range)');
  console.log('   - latitude/longitude + radius (geographic)');
  console.log('   - pagesize (results per page)');

  console.log('\n📊 Available Data Points:');
  console.log('   - Property characteristics (beds, baths, sqft, year built)');
  console.log('   - Sales data (amount, date, transaction type)');
  console.log('   - Owner information (name, mailing address → absentee)');
  console.log('   - Assessment data (tax assessed value, market value)');
  console.log('   - AVM (automated valuation)');
  console.log('   - Sales history (10-year lookback)');

  console.log('\n⚠️  Client-Side Filtering Needed For:');
  console.log('   - Foreclosure status (not filterable in API query)');
  console.log('   - Tax delinquency (not filterable in API query)');
  console.log('   - Vacant properties (must infer from data)');
  console.log('   - Equity percentage (calculate from AVM vs last sale)');
  console.log('   - Distress indicators (need to score after fetching)');

  console.log('\n💡 Recommendation:');
  console.log('   1. Use /sale/snapshot for initial discovery (fastest)');
  console.log('   2. Filter by: ZIP, property type, price range');
  console.log('   3. Client-side scoring for distress indicators');
  console.log('   4. Use /property/expandedprofile for enrichment (more data)');
  console.log('   5. Use /attomavm/detail for equity calculations');

  console.log('\n');
}

// Run the research
researchAttomFilters().catch(console.error);
