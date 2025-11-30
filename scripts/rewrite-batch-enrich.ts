/**
 * Complete Rewrite of Batch Enrich Node
 * Clean, working code with proper error handling
 */

const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const WORKFLOW_ID = 'EkhrKhMhfRyu00go';
const ATTOM_API_KEY = '72403894efb4b2cfeb4b5b41f105a53a';

async function getWorkflow() {
  const response = await fetch(`${N8N_API_URL}/workflows/${WORKFLOW_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_API_KEY }
  });
  if (!response.ok) throw new Error(`Failed to fetch workflow: ${response.status}`);
  return response.json();
}

async function updateWorkflow(workflow: any) {
  console.log('🔧 Rewriting Batch Enrich node with clean code...\n');

  const batchNode = workflow.nodes.find((n: any) => n.name === 'Batch Enrich & Score');
  if (!batchNode) throw new Error('Batch node not found');

  // Complete rewrite with proper code
  batchNode.parameters.jsCode = `
const salesData = $input.first().json;
const loopData = $('Loop Through ZIPs').first().json;
const user = loopData.user;

if (!salesData || !salesData.property || salesData.property.length === 0) {
  console.log('No properties to enrich');
  return [];
}

const properties = salesData.property;
console.log('Processing ' + properties.length + ' properties');

let investorProfile = user.investorProfile;
if (typeof investorProfile === 'string') {
  investorProfile = JSON.parse(investorProfile);
}

const ATTOM_KEY = '${ATTOM_API_KEY}';

async function enrichOne(prop) {
  const attomId = prop.identifier?.attomId;
  const addr = prop.address?.line1;

  if (!attomId) {
    return { sales: prop, assessment: null, avm: null };
  }

  let assessment = null;
  let avm = null;

  try {
    const assessUrl = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0/assessment/detail?attomid=' + attomId;
    const assessRes = await fetch(assessUrl, {
      headers: { 'apikey': ATTOM_KEY, 'Accept': 'application/json' }
    });

    console.log(addr + ' - Assessment: ' + assessRes.status);

    if (assessRes.ok) {
      const data = await assessRes.json();
      assessment = data?.property?.[0] || null;
    }
  } catch (err) {
    console.log(addr + ' - Assessment error: ' + err.message);
  }

  try {
    const avmUrl = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0/avm/detail?attomid=' + attomId;
    const avmRes = await fetch(avmUrl, {
      headers: { 'apikey': ATTOM_KEY, 'Accept': 'application/json' }
    });

    console.log(addr + ' - AVM: ' + avmRes.status);

    if (avmRes.ok) {
      const data = await avmRes.json();
      avm = data?.property?.[0] || null;
    }
  } catch (err) {
    console.log(addr + ' - AVM error: ' + err.message);
  }

  return { sales: prop, assessment: assessment, avm: avm };
}

console.log('Making API calls...');
const enriched = await Promise.all(properties.map(enrichOne));
console.log('Enrichment complete');

const withAssessment = enriched.filter(e => e.assessment !== null).length;
const withAVM = enriched.filter(e => e.avm !== null).length;
console.log('Got assessment data: ' + withAssessment + '/' + enriched.length);
console.log('Got AVM data: ' + withAVM + '/' + enriched.length);

function calcScore(property, assessmentData, avmData, profile) {
  if (!profile) return 50;

  let score = 0;

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

  const distressWeights = profile.distressIndicators || {};
  let distressPoints = 0;

  const taxDelinquent = assessmentData?.tax?.taxdelinquentyear ? true : false;
  if (taxDelinquent && distressWeights.taxDelinquent) {
    distressPoints += 10 * distressWeights.taxDelinquent;
  }

  const propertyClass = (property.summary?.propclass || '').toLowerCase();
  const isVacant = propertyClass.includes('vacant');
  if (isVacant && distressWeights.vacant) {
    distressPoints += 10 * distressWeights.vacant;
  }

  const absenteeOwner = property.owner?.owner1?.mailingCareOfName ? true : false;
  if (absenteeOwner && distressWeights.absenteeOwner) {
    distressPoints += 10 * distressWeights.absenteeOwner;
  }

  const hasLiens = assessmentData?.assessment?.tax?.taxamt > 0;
  if (hasLiens) {
    distressPoints += 5;
  }

  score += distressPoints;

  const preferredChar = profile.preferredCharacteristics || {};
  const beds = property.building?.rooms?.beds || 0;
  const sqft = property.building?.size?.bldgsize || 0;
  const yearBuilt = property.summary?.yearbuilt || 0;

  let charPoints = 0;
  if (beds >= (preferredChar.minBedrooms || 0) && beds <= (preferredChar.maxBedrooms || 10)) charPoints += 5;
  if (sqft >= (preferredChar.minSquareFeet || 0) && sqft <= (preferredChar.maxSquareFeet || 999999)) charPoints += 5;
  if (yearBuilt >= (preferredChar.preferredYearBuilt?.min || 1900) && yearBuilt <= (preferredChar.preferredYearBuilt?.max || 2025)) charPoints += 5;

  score += charPoints;

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

const transformed = enriched.map(function(item) {
  const prop = item.sales;
  const assessment = item.assessment;
  const avm = item.avm;
  const matchScore = calcScore(prop, assessment, avm, investorProfile);

  return {
    address: prop.address?.line1 || 'Unknown',
    city: prop.address?.locality || 'Unknown',
    state: prop.address?.countrySubd || 'FL',
    zip: prop.address?.postal1 || 'Unknown',
    county: prop.area?.countrySecSubd || null,
    apn: prop.identifier?.apn || null,
    ownerName: (prop.owner?.owner1?.firstName || '') + ' ' + (prop.owner?.owner1?.lastName || ''),
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

console.log('Scored ' + transformed.length + ' properties');

const minScore = user.minScore || 65;
const qualified = transformed.filter(function(p) { return p.matchScore >= minScore; });
qualified.sort(function(a, b) { return b.matchScore - a.matchScore; });

console.log('Qualified: ' + qualified.length + ' (>= ' + minScore + ')');

if (qualified.length > 0) {
  console.log('Top score: ' + qualified[0].matchScore);
} else {
  const scores = transformed.map(function(p) { return p.matchScore; });
  const maxScore = Math.max.apply(null, scores);
  console.log('No properties qualified. Max score: ' + maxScore);
}

const dailyMax = investorProfile?.leadPreferences?.dailyMaxLeads || 20;
const topProperties = qualified.slice(0, dailyMax);

return [{
  json: {
    user: user,
    properties: topProperties,
    stats: {
      fetched: transformed.length,
      qualified: qualified.length,
      ingesting: topProperties.length,
      minScore: minScore
    },
    enrichmentCounts: {
      total: enriched.length,
      withAssessment: withAssessment,
      withAVM: withAVM
    }
  }
}];
`;

  console.log('✅ Rewrote batch enrich with clean code\n');
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
  console.log('🔧 Rewriting Batch Enrich node...\n');

  try {
    const workflow = await getWorkflow();
    await updateWorkflow(workflow);

    console.log('✅ Clean Rewrite Complete!\n');
    console.log('📋 Will now log:');
    console.log('   - HTTP status for each API call');
    console.log('   - How many got assessment/AVM data');
    console.log('   - Qualified count and scores\n');
    console.log('🧪 Run workflow now!');
    console.log('🔗 https://primary-production-8b46.up.railway.app/workflow/EkhrKhMhfRyu00go\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
