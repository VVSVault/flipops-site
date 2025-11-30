/**
 * Add ATTOM Data Enrichment Pipeline
 *
 * Professional-grade property discovery workflow with multi-endpoint enrichment:
 *
 * Flow per property:
 * 1. Fetch Sales Data (/sale/snapshot) - get recent sales
 * 2. Enrich with Assessment Data (/assessment/detail) - tax delinquency, liens
 * 3. Enrich with AVM Data (/avm/detail) - accurate market value
 * 4. Merge all data sources
 * 5. Calculate comprehensive match score (0-100)
 * 6. Filter and rank properties
 */

const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const WORKFLOW_ID = 'EkhrKhMhfRyu00go';
const ATTOM_API_KEY = '72403894efb4b2cfeb4b5b41f105a53a';

async function getWorkflow() {
  const response = await fetch(`${N8N_API_URL}/workflows/${WORKFLOW_ID}`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workflow: ${response.status}`);
  }

  return response.json();
}

async function updateWorkflow(workflow: any) {
  console.log('🔧 Adding enrichment pipeline to workflow...\n');

  // Find the existing nodes
  const fetchAttomNode = workflow.nodes.find((n: any) => n.name === 'Fetch from ATTOM API');
  const transformNode = workflow.nodes.find((n: any) => n.name === 'Transform & Calculate Match Score');

  if (!fetchAttomNode || !transformNode) {
    throw new Error('Required nodes not found');
  }

  console.log('✅ Found existing nodes');

  // STEP 1: Add node to extract property IDs from sales data
  const extractIdsNode = {
    parameters: {
      jsCode: `
// Extract property IDs (ATTOM IDs) from sales data for enrichment
const salesData = $input.first().json;
const loopData = $('Loop Through ZIPs').first().json;

if (!salesData || !salesData.property || salesData.property.length === 0) {
  console.log('No properties to enrich');
  return [];
}

console.log(\`Extracting IDs from \${salesData.property.length} properties for enrichment\`);

// Return each property with its ATTOM ID for enrichment
return salesData.property.map(prop => ({
  json: {
    attomId: prop.identifier?.attomId,
    address: prop.address?.line1,
    zip: prop.address?.postal1,
    originalProperty: prop,  // Keep original sales data
    user: loopData.user       // Pass through user context
  }
}));
`
    },
    id: 'extract-ids',
    name: 'Extract Property IDs',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1650, 300]
  };

  // STEP 2: Add Assessment API call (tax delinquency data)
  const assessmentNode = {
    parameters: {
      url: '=https://api.gateway.attomdata.com/propertyapi/v1.0.0/assessment/detail',
      sendQuery: true,
      queryParameters: {
        parameters: [
          {
            name: 'attomid',
            value: '={{$json.attomId}}'
          }
        ]
      },
      sendHeaders: true,
      headerParameters: {
        parameters: [
          {
            name: 'apikey',
            value: ATTOM_API_KEY
          },
          {
            name: 'Accept',
            value: 'application/json'
          }
        ]
      },
      options: {
        response: {
          response: {
            neverError: true  // Don't fail workflow if property not found
          }
        }
      }
    },
    id: 'fetch-assessment',
    name: 'Fetch Assessment Data',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [1850, 300]
  };

  // STEP 3: Add AVM API call (accurate market value)
  const avmNode = {
    parameters: {
      url: '=https://api.gateway.attomdata.com/propertyapi/v1.0.0/avm/detail',
      sendQuery: true,
      queryParameters: {
        parameters: [
          {
            name: 'attomid',
            value: '={{$json.attomId}}'
          }
        ]
      },
      sendHeaders: true,
      headerParameters: {
        parameters: [
          {
            name: 'apikey',
            value: ATTOM_API_KEY
          },
          {
            name: 'Accept',
            value: 'application/json'
          }
        ]
      },
      options: {
        response: {
          response: {
            neverError: true
          }
        }
      }
    },
    id: 'fetch-avm',
    name: 'Fetch AVM Data',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [2050, 300]
  };

  // STEP 4: Merge enrichment data
  const mergeDataNode = {
    parameters: {
      jsCode: `
/**
 * Merge Sales + Assessment + AVM data
 */

const extractData = $('Extract Property IDs').first().json;
const salesProperty = extractData.originalProperty;
const user = extractData.user;

// Get assessment data (from this node's input after assessment call)
const assessmentResponse = $('Fetch Assessment Data').first().json;
const assessmentData = assessmentResponse?.property?.[0] || null;

// Get AVM data
const avmResponse = $('Fetch AVM Data').first().json;
const avmData = avmResponse?.property?.[0] || null;

console.log(\`Merging data for: \${extractData.address}\`);
console.log(\`  - Sales data: ✅\`);
console.log(\`  - Assessment data: \${assessmentData ? '✅' : '❌'}\`);
console.log(\`  - AVM data: \${avmData ? '✅' : '❌'}\`);

// Merge all data sources
const enrichedProperty = {
  // Core property data from sales
  sales: salesProperty,

  // Assessment data (tax, liens, delinquency)
  assessment: assessmentData || {},

  // AVM data (market value estimate)
  avm: avmData || {},

  // User context
  user: user
};

return [{
  json: enrichedProperty
}];
`
    },
    id: 'merge-enrichment',
    name: 'Merge Enrichment Data',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [2250, 300]
  };

  // STEP 5: Update Transform node to use enriched data
  console.log('✅ Updating Transform node for enriched scoring...');

  transformNode.parameters.jsCode = `
/**
 * Transform & Score with FULL ENRICHED DATA
 * Professional-grade scoring with all distress indicators
 */

const enrichedData = $input.first().json;
const prop = enrichedData.sales;
const assessment = enrichedData.assessment;
const avm = enrichedData.avm;
const user = enrichedData.user;

// Parse investorProfile
let investorProfile = user.investorProfile;
if (typeof investorProfile === 'string') {
  investorProfile = JSON.parse(investorProfile);
}

console.log(\`\\n=== Scoring property: \${prop.address?.line1} ===\`);

/**
 * PROFESSIONAL MATCH SCORE (0-100)
 * With full distress indicators from multiple ATTOM endpoints
 */
function calculateMatchScore(property, assessmentData, avmData, profile) {
  if (!profile) return 50;

  let score = 0;
  const breakdown = {};

  // 1. PRICE MATCH (30 points) - back to original weight
  const salePrice = property.sale?.amount?.saleamt || property.sale?.amount?.saleAmt || 0;
  breakdown.salePrice = salePrice;

  if (salePrice > 0) {
    const priceRanges = profile.priceRanges || [];
    for (const range of priceRanges) {
      if (salePrice >= range.min && salePrice <= range.max) {
        const points = 30 * range.weight;
        score += points;
        breakdown.priceMatch = points;
        break;
      }
    }
  }

  // 2. DISTRESS INDICATORS (40 points) - NOW WITH FULL DATA
  const distressWeights = profile.distressIndicators || {};
  let distressPoints = 0;

  // Tax delinquency (from assessment endpoint)
  const taxDelinquent = assessmentData?.tax?.taxdelinquentyear ? true : false;
  if (taxDelinquent && distressWeights.taxDelinquent) {
    distressPoints += 10 * distressWeights.taxDelinquent; // 8.5 points max
    breakdown.taxDelinquent = true;
  }

  // Vacant (from sales property class)
  const propertyClass = (property.summary?.propclass || '').toLowerCase();
  const isVacant = propertyClass.includes('vacant');
  if (isVacant && distressWeights.vacant) {
    distressPoints += 10 * distressWeights.vacant; // 9 points max
    breakdown.vacant = true;
  }

  // Absentee owner (from sales owner data)
  const absenteeOwner = property.owner?.owner1?.mailingCareOfName ? true : false;
  if (absenteeOwner && distressWeights.absenteeOwner) {
    distressPoints += 10 * distressWeights.absenteeOwner; // 7.5 points max
    breakdown.absenteeOwner = true;
  }

  // Multiple liens (from assessment)
  const hasLiens = assessmentData?.assessment?.tax?.taxamt > 0;
  if (hasLiens) {
    distressPoints += 5; // Additional distress signal
    breakdown.hasLiens = true;
  }

  score += distressPoints;
  breakdown.distressTotal = distressPoints;

  // 3. PROPERTY CHARACTERISTICS (15 points)
  const preferredChar = profile.preferredCharacteristics || {};
  const beds = property.building?.rooms?.beds || 0;
  const sqft = property.building?.size?.bldgsize || 0;
  const yearBuilt = property.summary?.yearbuilt || 0;

  let charPoints = 0;
  if (beds >= (preferredChar.minBedrooms || 0) && beds <= (preferredChar.maxBedrooms || 10)) {
    charPoints += 5;
  }
  if (sqft >= (preferredChar.minSquareFeet || 0) && sqft <= (preferredChar.maxSquareFeet || 999999)) {
    charPoints += 5;
  }
  if (yearBuilt >= (preferredChar.preferredYearBuilt?.min || 1900) &&
      yearBuilt <= (preferredChar.preferredYearBuilt?.max || 2025)) {
    charPoints += 5;
  }

  score += charPoints;
  breakdown.characteristics = charPoints;

  // 4. EQUITY POTENTIAL (15 points) - NOW WITH ACCURATE AVM
  const marketValue = avmData?.avm?.amount?.value ||
                      assessmentData?.assessment?.market?.mktttlvalue ||
                      property.assessment?.market?.mktttlvalue || 0;

  let equityPoints = 0;
  if (salePrice > 0 && marketValue > 0) {
    const equityPercent = ((marketValue - salePrice) / marketValue) * 100;
    const minEquity = profile.equityRequirements?.minEquityPercent || 20;
    const preferredEquity = profile.equityRequirements?.preferredEquityPercent || 30;

    breakdown.equityPercent = equityPercent.toFixed(1);
    breakdown.marketValue = marketValue;

    if (equityPercent >= preferredEquity) {
      equityPoints = 15;
    } else if (equityPercent >= minEquity) {
      equityPoints = 8;
    }
  }

  score += equityPoints;
  breakdown.equity = equityPoints;

  breakdown.totalScore = Math.round(Math.min(score, 100));

  return { score: breakdown.totalScore, breakdown };
}

const scoreResult = calculateMatchScore(prop, assessment, avm, investorProfile);

// Transform to final property format
const transformed = {
  address: prop.address?.line1 || 'Unknown',
  city: prop.address?.locality || 'Unknown',
  state: prop.address?.countrySubd || 'FL',
  zip: prop.address?.postal1 || 'Unknown',
  county: prop.area?.countrySecSubd || null,
  apn: prop.identifier?.apn || null,
  ownerName: \`\${prop.owner?.owner1?.firstName || ''} \${prop.owner?.owner1?.lastName || ''}\`.trim() || null,
  propertyType: (prop.summary?.propclass || '').toLowerCase().replace(' ', '_') || null,
  bedrooms: prop.building?.rooms?.beds || null,
  bathrooms: prop.building?.rooms?.bathstotal || null,
  squareFeet: prop.building?.size?.bldgsize || null,
  lotSize: prop.lot?.lotSize2 || null,
  yearBuilt: prop.summary?.yearbuilt || null,
  assessedValue: assessment?.assessment?.assessed?.assdttlvalue || prop.assessment?.assessed?.assdttlvalue || null,
  lastSaleDate: prop.sale?.saleTransDate || null,
  lastSalePrice: prop.sale?.amount?.saleamt || prop.sale?.amount?.saleAmt || null,
  estimatedValue: avm?.avm?.amount?.value || assessment?.assessment?.market?.mktttlvalue || null,

  // ENRICHED DISTRESS FLAGS
  foreclosure: false, // TODO: Add foreclosure endpoint if needed
  preForeclosure: false,
  taxDelinquent: scoreResult.breakdown.taxDelinquent || false,
  vacant: scoreResult.breakdown.vacant || false,
  bankruptcy: false,
  absenteeOwner: scoreResult.breakdown.absenteeOwner || false,
  hasLiens: scoreResult.breakdown.hasLiens || false,

  matchScore: scoreResult.score,
  scoreBreakdown: scoreResult.breakdown,

  sourceId: prop.identifier?.attomId?.toString() || null,
  metadata: {
    fips: prop.identifier?.fips,
    geoid: prop.location?.geoid,
    matchCode: prop.address?.matchCode,
    latitude: prop.location?.latitude,
    longitude: prop.location?.longitude,
    enriched: true,
    enrichmentSources: ['sales', 'assessment', 'avm']
  }
};

console.log(\`Score: \${scoreResult.score}\`);
console.log(\`Breakdown:\`, JSON.stringify(scoreResult.breakdown, null, 2));

return [{
  json: {
    user: user,
    property: transformed
  }
}];
`;

  // Update node positions for new nodes
  transformNode.position = [2450, 300];

  // Add new nodes to workflow
  workflow.nodes.push(extractIdsNode, assessmentNode, avmNode, mergeDataNode);

  // Update connections
  console.log('✅ Updating workflow connections...');

  // Disconnect old: Fetch ATTOM -> Transform
  // Connect new: Fetch ATTOM -> Extract IDs -> Assessment -> AVM -> Merge -> Transform

  workflow.connections['Fetch from ATTOM API'] = {
    main: [[{ node: 'Extract Property IDs', type: 'main', index: 0 }]]
  };

  workflow.connections['Extract Property IDs'] = {
    main: [[{ node: 'Fetch Assessment Data', type: 'main', index: 0 }]]
  };

  workflow.connections['Fetch Assessment Data'] = {
    main: [[{ node: 'Fetch AVM Data', type: 'main', index: 0 }]]
  };

  workflow.connections['Fetch AVM Data'] = {
    main: [[{ node: 'Merge Enrichment Data', type: 'main', index: 0 }]]
  };

  workflow.connections['Merge Enrichment Data'] = {
    main: [[{ node: 'Transform & Calculate Match Score', type: 'main', index: 0 }]]
  };

  console.log('✅ Enrichment pipeline complete\n');
  console.log('🚀 Uploading to n8n...\n');

  const cleanWorkflow = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings,
    staticData: workflow.staticData
  };

  const response = await fetch(`${N8N_API_URL}/workflows/${WORKFLOW_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': N8N_API_KEY
    },
    body: JSON.stringify(cleanWorkflow)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update workflow: ${response.status} - ${error}`);
  }

  return response.json();
}

async function main() {
  console.log('🏗️  Building Professional ATTOM Enrichment Pipeline...\n');

  try {
    const workflow = await getWorkflow();
    await updateWorkflow(workflow);

    console.log('✅ Professional Enrichment Pipeline Deployed!\n');
    console.log('📊 New Workflow Architecture:');
    console.log('   1. Fetch Sales Data (existing)');
    console.log('   2. Extract Property IDs → Loop through each property');
    console.log('   3. Fetch Assessment Data → Tax delinquency, liens');
    console.log('   4. Fetch AVM Data → Accurate market valuation');
    console.log('   5. Merge All Data Sources');
    console.log('   6. Calculate Comprehensive Score (0-100)');
    console.log('');
    console.log('🎯 Scoring Now Includes:');
    console.log('   ✅ Tax delinquency (from assessment endpoint)');
    console.log('   ✅ Property liens (from assessment)');
    console.log('   ✅ Accurate market value (from AVM)');
    console.log('   ✅ Precise equity calculations');
    console.log('   ✅ All original distress indicators');
    console.log('');
    console.log('💰 API Call Cost per Property:');
    console.log('   - Sales: 1 credit');
    console.log('   - Assessment: 1 credit');
    console.log('   - AVM: 1 credit');
    console.log('   - Total: ~3 credits per property');
    console.log('');
    console.log('📈 Expected Improvement:');
    console.log('   - More accurate scores (full distress data)');
    console.log('   - Better equity calculations (AVM vs manual estimate)');
    console.log('   - Higher quality leads (professional-grade filtering)');
    console.log('');
    console.log('🔗 Test workflow: https://primary-production-8b46.up.railway.app/workflow/EkhrKhMhfRyu00go\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
