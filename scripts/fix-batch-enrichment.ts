/**
 * Fix Batch Enrichment
 *
 * Problem: Each property flows individually through enrichment,
 * and Aggregate runs after first property completes
 *
 * Solution: Do enrichment in a single Code node that processes ALL properties,
 * making parallel API calls and waiting for all to complete
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
  console.log('🔧 Restructuring for batch enrichment...\n');

  // Remove the individual enrichment nodes and replace with ONE batch enrichment node

  // Find and remove old nodes
  const nodesToRemove = [
    'Extract Property IDs',
    'Fetch Assessment Data',
    'Fetch AVM Data',
    'Merge Enrichment Data',
    'Transform & Calculate Match Score'
  ];

  workflow.nodes = workflow.nodes.filter((n: any) => !nodesToRemove.includes(n.name));

  console.log('✅ Removed individual enrichment nodes');

  // Create single batch enrichment + scoring node
  const batchEnrichNode = {
    parameters: {
      jsCode: `
/**
 * Batch Enrichment & Scoring
 * Process ALL properties with parallel API calls
 */

const salesData = $input.first().json;
const loopData = $('Loop Through ZIPs').first().json;
const user = loopData.user;

if (!salesData || !salesData.property || salesData.property.length === 0) {
  console.log('No properties to enrich');
  return [];
}

const properties = salesData.property;
console.log(\`\\n=== Batch Enriching \${properties.length} properties ===\`);

// Parse investorProfile
let investorProfile = user.investorProfile;
if (typeof investorProfile === 'string') {
  investorProfile = JSON.parse(investorProfile);
}

const ATTOM_API_KEY = '${ATTOM_API_KEY}';

/**
 * Enrich a single property with Assessment + AVM data
 */
async function enrichProperty(prop) {
  const attomId = prop.identifier?.attomId;
  if (!attomId) {
    console.log(\`No ATTOM ID for \${prop.address?.line1}\`);
    return { sales: prop, assessment: null, avm: null };
  }

  try {
    // Parallel API calls for this property
    const [assessmentRes, avmRes] = await Promise.all([
      fetch(\`https://api.gateway.attomdata.com/propertyapi/v1.0.0/assessment/detail?attomid=\${attomId}\`, {
        headers: { 'apikey': ATTOM_API_KEY, 'Accept': 'application/json' }
      }).catch(e => null),
      fetch(\`https://api.gateway.attomdata.com/propertyapi/v1.0.0/avm/detail?attomid=\${attomId}\`, {
        headers: { 'apikey': ATTOM_API_KEY, 'Accept': 'application/json' }
      }).catch(e => null)
    ]);

    const assessment = assessmentRes ? await assessmentRes.json().catch(() => null) : null;
    const avm = avmRes ? await avmRes.json().catch(() => null) : null;

    return {
      sales: prop,
      assessment: assessment?.property?.[0] || null,
      avm: avm?.property?.[0] || null
    };
  } catch (error) {
    console.log(\`Error enriching \${prop.address?.line1}: \${error.message}\`);
    return { sales: prop, assessment: null, avm: null };
  }
}

// Enrich ALL properties in parallel
console.log('Making parallel API calls...');
const enriched = await Promise.all(properties.map(enrichProperty));
console.log(\`Enrichment complete: \${enriched.length} properties\`);

/**
 * Calculate Match Score
 */
function calculateMatchScore(property, assessmentData, avmData, profile) {
  if (!profile) return 50;

  let score = 0;

  // 1. PRICE MATCH (30 points)
  const salePrice = property.sale?.amount?.saleamt || property.sale?.amount?.saleAmt || 0;
  if (salePrice > 0) {
    const priceRanges = profile.priceRanges || [];
    for (const range of priceRanges) {
      if (salePrice >= range.min && salePrice <= range.max) {
        score += 30 * range.weight;
        break;
      }
    }
  }

  // 2. DISTRESS INDICATORS (40 points)
  const distressWeights = profile.distressIndicators || {};
  let distressPoints = 0;

  // Tax delinquency
  const taxDelinquent = assessmentData?.tax?.taxdelinquentyear ? true : false;
  if (taxDelinquent && distressWeights.taxDelinquent) {
    distressPoints += 10 * distressWeights.taxDelinquent;
  }

  // Vacant
  const propertyClass = (property.summary?.propclass || '').toLowerCase();
  const isVacant = propertyClass.includes('vacant');
  if (isVacant && distressWeights.vacant) {
    distressPoints += 10 * distressWeights.vacant;
  }

  // Absentee owner
  const absenteeOwner = property.owner?.owner1?.mailingCareOfName ? true : false;
  if (absenteeOwner && distressWeights.absenteeOwner) {
    distressPoints += 10 * distressWeights.absenteeOwner;
  }

  // Liens
  const hasLiens = assessmentData?.assessment?.tax?.taxamt > 0;
  if (hasLiens) {
    distressPoints += 5;
  }

  score += distressPoints;

  // 3. PROPERTY CHARACTERISTICS (15 points)
  const preferredChar = profile.preferredCharacteristics || {};
  const beds = property.building?.rooms?.beds || 0;
  const sqft = property.building?.size?.bldgsize || 0;
  const yearBuilt = property.summary?.yearbuilt || 0;

  let charPoints = 0;
  if (beds >= (preferredChar.minBedrooms || 0) && beds <= (preferredChar.maxBedrooms || 10)) charPoints += 5;
  if (sqft >= (preferredChar.minSquareFeet || 0) && sqft <= (preferredChar.maxSquareFeet || 999999)) charPoints += 5;
  if (yearBuilt >= (preferredChar.preferredYearBuilt?.min || 1900) && yearBuilt <= (preferredChar.preferredYearBuilt?.max || 2025)) charPoints += 5;

  score += charPoints;

  // 4. EQUITY POTENTIAL (15 points)
  const marketValue = avmData?.avm?.amount?.value || assessmentData?.assessment?.market?.mktttlvalue || property.assessment?.market?.mktttlvalue || 0;
  let equityPoints = 0;
  if (salePrice > 0 && marketValue > 0) {
    const equityPercent = ((marketValue - salePrice) / marketValue) * 100;
    const minEquity = profile.equityRequirements?.minEquityPercent || 20;
    const preferredEquity = profile.equityRequirements?.preferredEquityPercent || 30;

    if (equityPercent >= preferredEquity) equityPoints = 15;
    else if (equityPercent >= minEquity) equityPoints = 8;
  }

  score += equityPoints;

  return Math.round(Math.min(score, 100));
}

// Score and transform all properties
const transformedProperties = enriched.map(({sales: prop, assessment, avm}) => {
  const matchScore = calculateMatchScore(prop, assessment, avm, investorProfile);

  return {
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
    taxDelinquent: assessment?.tax?.taxdelinquentyear ? true : false,
    vacant: (prop.summary?.propclass || '').toLowerCase().includes('vacant'),
    absenteeOwner: prop.owner?.owner1?.mailingCareOfName ? true : false,
    hasLiens: assessment?.assessment?.tax?.taxamt > 0,
    matchScore: matchScore,
    sourceId: prop.identifier?.attomId?.toString() || null,
    metadata: {
      fips: prop.identifier?.fips,
      geoid: prop.location?.geoid,
      latitude: prop.location?.latitude,
      longitude: prop.location?.longitude,
      enriched: true
    }
  };
});

console.log(\`Scored \${transformedProperties.length} properties\`);

// Filter and sort
const minScore = user.minScore || 65;
const qualifiedProperties = transformedProperties.filter(p => p.matchScore >= minScore);
qualifiedProperties.sort((a, b) => b.matchScore - a.matchScore);

console.log(\`Qualified: \${qualifiedProperties.length} (>= \${minScore})\`);

// Limit to daily max
const dailyMax = investorProfile?.leadPreferences?.dailyMaxLeads || 20;
const topProperties = qualifiedProperties.slice(0, dailyMax);

// Return batch result
return [{
  json: {
    user: user,
    properties: topProperties,
    stats: {
      fetched: transformedProperties.length,
      qualified: qualifiedProperties.length,
      ingesting: topProperties.length,
      minScore: minScore
    }
  }
}];
`
    },
    id: 'batch-enrich-score',
    name: 'Batch Enrich & Score',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1650, 300]
  };

  workflow.nodes.push(batchEnrichNode);

  // Update connections: Fetch ATTOM → Batch Enrich → Has Qualified
  workflow.connections['Fetch from ATTOM API'] = {
    main: [[{ node: 'Batch Enrich & Score', type: 'main', index: 0 }]]
  };

  workflow.connections['Batch Enrich & Score'] = {
    main: [[{ node: 'Has Qualified Properties?', type: 'main', index: 0 }]]
  };

  // Remove old connections
  delete workflow.connections['Extract Property IDs'];
  delete workflow.connections['Fetch Assessment Data'];
  delete workflow.connections['Fetch AVM Data'];
  delete workflow.connections['Merge Enrichment Data'];
  delete workflow.connections['Transform & Calculate Match Score'];
  delete workflow.connections['Aggregate Scored Properties'];

  // Remove Aggregate node (no longer needed)
  workflow.nodes = workflow.nodes.filter((n: any) => n.name !== 'Aggregate Scored Properties');

  console.log('✅ Restructured to batch enrichment\n');
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
  console.log('🏗️  Restructuring to Batch Enrichment...\n');

  try {
    const workflow = await getWorkflow();
    await updateWorkflow(workflow);

    console.log('✅ Batch Enrichment Deployed!\n');
    console.log('📊 New Simplified Flow:');
    console.log('   Fetch from ATTOM API (20 properties)');
    console.log('   ↓');
    console.log('   Batch Enrich & Score ← NEW: Processes ALL 20 in parallel');
    console.log('   ↓');
    console.log('   Has Qualified Properties?');
    console.log('   ↓');
    console.log('   Ingest Properties\n');
    console.log('🎯 Benefits:');
    console.log('   ✅ All 20 properties enriched before aggregation');
    console.log('   ✅ Parallel API calls (faster)');
    console.log('   ✅ Simpler workflow (fewer nodes)');
    console.log('   ✅ Guaranteed batch processing\n');
    console.log('🧪 Test now - all 20 properties should flow through!');
    console.log('🔗 https://primary-production-8b46.up.railway.app/workflow/EkhrKhMhfRyu00go\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
