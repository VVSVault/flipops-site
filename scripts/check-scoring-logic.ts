/**
 * Check Property Scoring Logic
 *
 * This will help us understand why properties might be scoring below 65
 */

const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const WORKFLOW_ID = 'EkhrKhMhfRyu00go';

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
  console.log('🔧 Adding detailed scoring debug to Transform node...\n');

  const transformNode = workflow.nodes.find((n: any) => n.name === 'Transform & Calculate Match Score');

  if (!transformNode) {
    throw new Error('Transform node not found');
  }

  transformNode.parameters.jsCode = `
/**
 * STEP 2: Transform ATTOM Data & Calculate Match Score
 * WITH DETAILED SCORING DEBUG
 */

const attomData = $input.first().json;
const loopData = $('Loop Through ZIPs').first().json;
const user = loopData.user;

console.log(\`\\n=== Processing for user: \${user.name} ===\`);

// Parse investorProfile
let investorProfile = user.investorProfile;
if (typeof investorProfile === 'string') {
  investorProfile = JSON.parse(investorProfile);
}

if (!attomData || !attomData.property || attomData.property.length === 0) {
  console.log('No properties found in this ZIP');
  return [];
}

console.log(\`Found \${attomData.property.length} properties from ATTOM\`);
console.log(\`Min score threshold: \${user.minScore || 65}\`);

/**
 * Calculate Match Score (0-100) WITH DEBUG LOGGING
 */
function calculateMatchScore(property, profile) {
  if (!profile) {
    console.log('⚠️  No profile - returning default score 50');
    return 50;
  }

  let score = 0;
  const breakdown = {};

  // 1. PRICE MATCH (30 points)
  const salePrice = property.sale?.amount?.saleamt || property.sale?.amount?.saleAmt || 0;
  breakdown.salePrice = salePrice;

  if (salePrice > 0) {
    const priceRanges = profile.priceRanges || [];
    for (const range of priceRanges) {
      if (salePrice >= range.min && salePrice <= range.max) {
        const points = 30 * range.weight;
        score += points;
        breakdown.priceMatch = points;
        breakdown.priceRange = \`$\${range.min}-$\${range.max}\`;
        break;
      }
    }
    if (!breakdown.priceMatch) {
      breakdown.priceMatch = 0;
      breakdown.priceIssue = 'Outside preferred range';
    }
  } else {
    breakdown.priceMatch = 0;
    breakdown.priceIssue = 'No sale price';
  }

  // 2. DISTRESS INDICATORS (40 points max)
  const distressWeights = profile.distressIndicators || {};
  const absenteeOwner = property.owner?.owner1?.mailingCareOfName ? true : false;
  const propertyClass = (property.summary?.propclass || '').toLowerCase();
  const isVacant = propertyClass.includes('vacant');

  let distressPoints = 0;
  if (isVacant && distressWeights.vacant) {
    const points = 10 * distressWeights.vacant;
    distressPoints += points;
    breakdown.vacant = points;
  }
  if (absenteeOwner && distressWeights.absenteeOwner) {
    const points = 10 * distressWeights.absenteeOwner;
    distressPoints += points;
    breakdown.absenteeOwner = points;
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
  breakdown.beds = beds;
  breakdown.sqft = sqft;
  breakdown.yearBuilt = yearBuilt;

  // 4. EQUITY POTENTIAL (15 points)
  const assessedValue = property.assessment?.assessed?.assdttlvalue || 0;
  const marketValue = property.assessment?.market?.mktttlvalue || assessedValue;

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

// Transform and score each property
const transformedProperties = attomData.property.map((prop, index) => {
  const address = prop.address?.line1 || 'Unknown';

  const transformed = {
    address: address,
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
    assessedValue: prop.assessment?.assessed?.assdttlvalue || null,
    lastSaleDate: prop.sale?.saleTransDate || null,
    lastSalePrice: prop.sale?.amount?.saleamt || prop.sale?.amount?.saleAmt || null,
    estimatedValue: prop.assessment?.market?.mktttlvalue || prop.assessment?.assessed?.assdttlvalue || null,
    foreclosure: false,
    preForeclosure: false,
    taxDelinquent: false,
    vacant: (prop.summary?.propclass || '').toLowerCase().includes('vacant'),
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

  const scoreResult = calculateMatchScore(prop, investorProfile);
  transformed.matchScore = scoreResult.score;

  // Log first 3 properties in detail
  if (index < 3) {
    console.log(\`\\nProperty #\${index + 1}: \${address}\`);
    console.log(\`  Score: \${scoreResult.score}\`);
    console.log(\`  Breakdown:\`, JSON.stringify(scoreResult.breakdown, null, 2));
  }

  return transformed;
});

// Filter by minimum match score
const minScore = user.minScore || 65;
const qualifiedProperties = transformedProperties.filter(p => p.matchScore >= minScore);

// Sort by match score
qualifiedProperties.sort((a, b) => b.matchScore - a.matchScore);

console.log(\`\\n=== RESULTS ===\`);
console.log(\`Total fetched: \${attomData.property.length}\`);
console.log(\`Qualified (>= \${minScore}): \${qualifiedProperties.length}\`);

if (transformedProperties.length > 0) {
  const scores = transformedProperties.map(p => p.matchScore);
  const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  const maxScore = Math.max(...scores);
  const minScoreFound = Math.min(...scores);

  console.log(\`Score range: \${minScoreFound} - \${maxScore} (avg: \${avgScore})\`);
}

if (qualifiedProperties.length > 0) {
  console.log(\`\\nTop 5 qualified properties:\`);
  qualifiedProperties.slice(0, 5).forEach((p, i) => {
    console.log(\`  \${i + 1}. [\${p.matchScore}] \${p.address}, \${p.city}\`);
  });
}

// Limit to top N
const leadPreferences = investorProfile?.leadPreferences || {};
const dailyMax = leadPreferences.dailyMaxLeads || 20;
const topProperties = qualifiedProperties.slice(0, dailyMax);

return [{
  json: {
    user: user,
    properties: topProperties,
    stats: {
      fetched: attomData.property.length,
      qualified: qualifiedProperties.length,
      ingesting: topProperties.length,
      minScore: minScore
    }
  }
}];
`;

  console.log('✅ Added detailed scoring debug\n');
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
  console.log('🔍 Adding scoring debug logic...\n');

  try {
    const workflow = await getWorkflow();
    await updateWorkflow(workflow);

    console.log('✅ Debug Logging Added!\n');
    console.log('📋 Next Steps:');
    console.log('   1. Execute the workflow again');
    console.log('   2. Check the Transform node execution logs');
    console.log('   3. Look for detailed score breakdowns for first 3 properties');
    console.log('   4. Share the log output to see why scores are low\n');
    console.log('🔗 https://primary-production-8b46.up.railway.app/workflow/EkhrKhMhfRyu00go\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
