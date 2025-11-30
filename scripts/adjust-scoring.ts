/**
 * Adjust Scoring Algorithm
 *
 * Problem: Properties scoring 0/20 qualified (all below 65)
 *
 * Root cause: ATTOM sale/snapshot endpoint doesn't include:
 * - Foreclosure status (would be 10 points)
 * - Tax delinquent status (would be 8.5 points)
 * - Pre-foreclosure (would be 9.5 points)
 * - Bankruptcy (would be 6.5 points)
 *
 * That's 34.5 points we CAN'T get from this endpoint!
 *
 * Solutions:
 * 1. Adjust scoring to weight available data more heavily
 * 2. Lower the minimum threshold temporarily
 * 3. Call additional ATTOM endpoints for distress data
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
  console.log('🔧 Adjusting scoring algorithm...\n');

  const transformNode = workflow.nodes.find((n: any) => n.name === 'Transform & Calculate Match Score');

  if (!transformNode) {
    throw new Error('Transform node not found');
  }

  transformNode.parameters.jsCode = `
/**
 * STEP 2: Transform ATTOM Data & Calculate Match Score
 * ADJUSTED SCORING - weighted for available data
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

/**
 * ADJUSTED Calculate Match Score (0-100)
 *
 * Adjusted weights (since we don't have foreclosure/tax data):
 * - Price Match: 40 points (was 30) - we have this data
 * - Available Distress: 30 points (was 40) - only vacant/absentee available
 * - Property Characteristics: 20 points (was 15) - we have this data
 * - Equity Potential: 10 points (was 15) - harder to calculate without comps
 */
function calculateMatchScore(property, profile) {
  if (!profile) return 50;

  let score = 0;

  // 1. PRICE MATCH (40 points - INCREASED)
  const salePrice = property.sale?.amount?.saleamt || property.sale?.amount?.saleAmt || 0;
  if (salePrice > 0) {
    const priceRanges = profile.priceRanges || [];
    for (const range of priceRanges) {
      if (salePrice >= range.min && salePrice <= range.max) {
        score += 40 * range.weight;
        break;
      }
    }
  }

  // 2. AVAILABLE DISTRESS INDICATORS (30 points - we can only check 2 indicators)
  const distressWeights = profile.distressIndicators || {};
  const absenteeOwner = property.owner?.owner1?.mailingCareOfName ? true : false;
  const propertyClass = (property.summary?.propclass || '').toLowerCase();
  const isVacant = propertyClass.includes('vacant');

  // Give more weight to the indicators we CAN detect
  if (isVacant && distressWeights.vacant) {
    score += 15 * distressWeights.vacant; // Increased from 10
  }
  if (absenteeOwner && distressWeights.absenteeOwner) {
    score += 15 * distressWeights.absenteeOwner; // Increased from 10
  }

  // 3. PROPERTY CHARACTERISTICS (20 points - INCREASED)
  const preferredChar = profile.preferredCharacteristics || {};
  const beds = property.building?.rooms?.beds || 0;
  const sqft = property.building?.size?.bldgsize || 0;
  const yearBuilt = property.summary?.yearbuilt || 0;

  if (beds >= (preferredChar.minBedrooms || 0) && beds <= (preferredChar.maxBedrooms || 10)) {
    score += 7;
  }
  if (sqft >= (preferredChar.minSquareFeet || 0) && sqft <= (preferredChar.maxSquareFeet || 999999)) {
    score += 7;
  }
  if (yearBuilt >= (preferredChar.preferredYearBuilt?.min || 1900) &&
      yearBuilt <= (preferredChar.preferredYearBuilt?.max || 2025)) {
    score += 6;
  }

  // 4. EQUITY POTENTIAL (10 points - we have limited comp data)
  const assessedValue = property.assessment?.assessed?.assdttlvalue || 0;
  const marketValue = property.assessment?.market?.mktttlvalue || assessedValue;

  if (salePrice > 0 && marketValue > 0) {
    const equityPercent = ((marketValue - salePrice) / marketValue) * 100;
    const minEquity = profile.equityRequirements?.minEquityPercent || 20;
    const preferredEquity = profile.equityRequirements?.preferredEquityPercent || 30;

    if (equityPercent >= preferredEquity) {
      score += 10;
    } else if (equityPercent >= minEquity) {
      score += 5;
    }
  }

  return Math.round(Math.min(score, 100));
}

// Transform and score each property
const transformedProperties = attomData.property.map((prop, index) => {
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

  transformed.matchScore = calculateMatchScore(prop, investorProfile);

  // Log first 5 properties with scores
  if (index < 5) {
    const salePrice = prop.sale?.amount?.saleamt || prop.sale?.amount?.saleAmt || 0;
    console.log(\`Property #\${index + 1}: \${transformed.address}\`);
    console.log(\`  Score: \${transformed.matchScore}\`);
    console.log(\`  Sale Price: $\${salePrice?.toLocaleString()}\`);
    console.log(\`  Beds: \${transformed.bedrooms}, Sqft: \${transformed.squareFeet}, Year: \${transformed.yearBuilt}\`);
    console.log(\`  Vacant: \${transformed.vacant}, Absentee: \${transformed.absenteeOwner}\`);
  }

  return transformed;
});

// Filter by minimum match score (temporarily lowered from 65 to 50 for testing)
const minScore = 50; // TEMPORARY: Lower threshold to see what we're getting
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
  const minScoreActual = Math.min(...scores);

  console.log(\`Score range: \${minScoreActual} - \${maxScore} (avg: \${avgScore})\`);
}

if (qualifiedProperties.length > 0) {
  console.log(\`\\nTop 5 qualified properties:\`);
  qualifiedProperties.slice(0, 5).forEach((p, i) => {
    console.log(\`  \${i + 1}. [\${p.matchScore}] \${p.address}, \${p.city} - $\${p.lastSalePrice?.toLocaleString()}\`);
  });
} else {
  console.log(\`\\nWARNING: No properties scored above \${minScore}. This suggests:\`);
  console.log(\`   - Properties outside price range ($75k-$250k)\`);
  console.log(\`   - No distress indicators (ATTOM snapshot doesnt include foreclosure/tax data)\`);
  console.log(\`   - Need to call specialized ATTOM endpoints for full scoring\`);
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

  console.log('✅ Adjusted scoring algorithm\n');
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
  console.log('🔍 Adjusting scoring for available data...\n');

  try {
    const workflow = await getWorkflow();
    await updateWorkflow(workflow);

    console.log('✅ Scoring Adjusted!\n');
    console.log('📋 Changes:');
    console.log('   - Price Match: 30 → 40 points');
    console.log('   - Distress (vacant/absentee): 10 → 15 points each');
    console.log('   - Property Characteristics: 15 → 20 points');
    console.log('   - Min threshold: 65 → 50 (temporary for testing)');
    console.log('');
    console.log('🧪 Run workflow again and check:');
    console.log('   - How many properties qualify now?');
    console.log('   - What are the actual score ranges?');
    console.log('   - Are properties in the right price range?\n');
    console.log('🔗 https://primary-production-8b46.up.railway.app/workflow/EkhrKhMhfRyu00go\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
