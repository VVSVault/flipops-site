/**
 * Complete Workflow Fix - Proper Context Passing
 *
 * The real issue: When ATTOM API node executes, it returns ONLY the API response,
 * losing all the user context we passed through from previous nodes.
 *
 * Solution: We need to add a merge node OR update Transform node to handle this properly
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
  console.log('🔧 Fixing workflow context passing...\n');

  // FIX 1: Update "Fetch from ATTOM API" to preserve context in response headers
  const fetchNode = workflow.nodes.find((n: any) => n.name === 'Fetch from ATTOM API');
  if (fetchNode) {
    console.log('✅ Fix 1: Configure ATTOM API node to include response headers');

    // Enable "Include Response Headers and Status" option
    if (!fetchNode.parameters.options) {
      fetchNode.parameters.options = {};
    }
    fetchNode.parameters.options.response = {
      response: {
        fullResponse: false,
        neverError: false,
        responseFormat: 'json'
      }
    };
  }

  // FIX 2: Update Transform node to use $('Loop Through ZIPs') to access user context
  const transformNode = workflow.nodes.find((n: any) => n.name === 'Transform & Calculate Match Score');
  if (transformNode) {
    console.log('✅ Fix 2: Update Transform node to access user context from previous node');

    transformNode.parameters.jsCode = `
/**
 * STEP 2: Transform ATTOM Data & Calculate Match Score
 * Access user context from "Loop Through ZIPs" node
 */

// Get ATTOM API response from current input
const attomData = $input.first().json;

// Get user context from the "Loop Through ZIPs" node
const loopData = $('Loop Through ZIPs').first().json;
const user = loopData.user;

console.log(\`Processing properties for user: \${user.name}\`);

// Parse investorProfile if it's a string
let investorProfile = user.investorProfile;
if (typeof investorProfile === 'string') {
  investorProfile = JSON.parse(investorProfile);
}

if (!attomData || !attomData.property || attomData.property.length === 0) {
  console.log('No properties found in this ZIP');
  return [];
}

console.log(\`Processing \${attomData.property.length} properties from ATTOM\`);

/**
 * Calculate Match Score (0-100)
 */
function calculateMatchScore(property, profile) {
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
  const absenteeOwner = property.owner?.owner1?.mailingCareOfName ? true : false;
  const propertyClass = (property.summary?.propclass || '').toLowerCase();
  const isVacant = propertyClass.includes('vacant');

  if (isVacant && distressWeights.vacant) score += 10 * distressWeights.vacant;
  if (absenteeOwner && distressWeights.absenteeOwner) score += 10 * distressWeights.absenteeOwner;

  // 3. PROPERTY CHARACTERISTICS (15 points)
  const preferredChar = profile.preferredCharacteristics || {};
  const beds = property.building?.rooms?.beds || 0;
  const sqft = property.building?.size?.bldgsize || 0;
  const yearBuilt = property.summary?.yearbuilt || 0;

  if (beds >= (preferredChar.minBedrooms || 0) && beds <= (preferredChar.maxBedrooms || 10)) {
    score += 5;
  }
  if (sqft >= (preferredChar.minSquareFeet || 0) && sqft <= (preferredChar.maxSquareFeet || 999999)) {
    score += 5;
  }
  if (yearBuilt >= (preferredChar.preferredYearBuilt?.min || 1900) &&
      yearBuilt <= (preferredChar.preferredYearBuilt?.max || 2025)) {
    score += 5;
  }

  // 4. EQUITY POTENTIAL (15 points)
  const assessedValue = property.assessment?.assessed?.assdttlvalue || 0;
  const marketValue = property.assessment?.market?.mktttlvalue || assessedValue;
  if (salePrice > 0 && marketValue > 0) {
    const equityPercent = ((marketValue - salePrice) / marketValue) * 100;
    const minEquity = profile.equityRequirements?.minEquityPercent || 20;
    const preferredEquity = profile.equityRequirements?.preferredEquityPercent || 30;

    if (equityPercent >= preferredEquity) {
      score += 15;
    } else if (equityPercent >= minEquity) {
      score += 8;
    }
  }

  return Math.round(Math.min(score, 100));
}

// Transform and score each property
const transformedProperties = attomData.property.map(prop => {
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
  return transformed;
});

// Filter by minimum match score
const minScore = user.minScore || 65;
const qualifiedProperties = transformedProperties.filter(p => p.matchScore >= minScore);

// Sort by match score
qualifiedProperties.sort((a, b) => b.matchScore - a.matchScore);

console.log(\`Qualified: \${qualifiedProperties.length} (score >= \${minScore})\`);
if (qualifiedProperties.length > 0) {
  console.log(\`Top score: \${qualifiedProperties[0].matchScore} - \${qualifiedProperties[0].address}\`);
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
  }

  console.log('✅ Fixes applied\n');
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
  console.log('🔍 Applying complete workflow fix...\n');

  try {
    const workflow = await getWorkflow();
    await updateWorkflow(workflow);

    console.log('✅ Workflow Fixed!\n');
    console.log('🔧 Key Change:');
    console.log('   - Transform node now uses $("Loop Through ZIPs") to access user context');
    console.log('   - This preserves user data even after ATTOM API response\n');
    console.log('🧪 Ready to test!');
    console.log('🔗 https://primary-production-8b46.up.railway.app/workflow/EkhrKhMhfRyu00go\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
