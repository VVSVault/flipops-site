/**
 * Verify Data Quality
 *
 * Check that we're:
 * 1. Processing the expected number of properties
 * 2. Getting assessment data with tax delinquency info
 * 3. Getting varied score distributions
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
  console.log('🔧 Adding detailed data quality logging...\n');

  // Update Aggregate node with extensive logging
  const aggregateNode = workflow.nodes.find((n: any) => n.name === 'Aggregate Scored Properties');

  if (!aggregateNode) {
    throw new Error('Aggregate node not found');
  }

  aggregateNode.parameters.jsCode = `
/**
 * Aggregate with DETAILED LOGGING
 */

const allInputs = $input.all();

console.log(\`\\n=== DATA QUALITY CHECK ===\`);
console.log(\`Total properties received: \${allInputs.length}\`);

if (allInputs.length === 0) {
  console.log('❌ NO PROPERTIES RECEIVED - Check upstream nodes!');
  return [];
}

// Get user
const user = allInputs[0].json.user;
const minScore = user.minScore || 65;

console.log(\`User: \${user.name}\`);
console.log(\`Min score threshold: \${minScore}\`);

// Collect all properties
const allProperties = allInputs.map(item => item.json.property);

// DETAILED ANALYSIS
console.log(\`\\n=== PROPERTY ANALYSIS ===\`);

// Score distribution
const scores = allProperties.map(p => p.matchScore);
const scoresByRange = {
  '0-20': scores.filter(s => s < 20).length,
  '20-40': scores.filter(s => s >= 20 && s < 40).length,
  '40-60': scores.filter(s => s >= 40 && s < 60).length,
  '60-80': scores.filter(s => s >= 60 && s < 80).length,
  '80-100': scores.filter(s => s >= 80).length
};

console.log(\`Score Distribution:\`);
console.log(\`  0-20:   \${scoresByRange['0-20']} properties\`);
console.log(\`  20-40:  \${scoresByRange['20-40']} properties\`);
console.log(\`  40-60:  \${scoresByRange['40-60']} properties\`);
console.log(\`  60-80:  \${scoresByRange['60-80']} properties ← Target range\`);
console.log(\`  80-100: \${scoresByRange['80-100']} properties\`);

const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
const maxScore = Math.max(...scores);
const minScoreFound = Math.min(...scores);

console.log(\`\\nScore Stats:\`);
console.log(\`  Min:     \${minScoreFound}\`);
console.log(\`  Max:     \${maxScore}\`);
console.log(\`  Average: \${avgScore}\`);
console.log(\`  Median:  \${scores.sort((a,b) => a-b)[Math.floor(scores.length/2)]}\`);

// Distress indicator analysis
const distressStats = {
  taxDelinquent: allProperties.filter(p => p.taxDelinquent).length,
  vacant: allProperties.filter(p => p.vacant).length,
  absenteeOwner: allProperties.filter(p => p.absenteeOwner).length,
  hasLiens: allProperties.filter(p => p.hasLiens).length
};

console.log(\`\\n=== DISTRESS INDICATORS ===\`);
console.log(\`Tax Delinquent:  \${distressStats.taxDelinquent} / \${allProperties.length} (\${((distressStats.taxDelinquent/allProperties.length)*100).toFixed(1)}%)\`);
console.log(\`Vacant:          \${distressStats.vacant} / \${allProperties.length} (\${((distressStats.vacant/allProperties.length)*100).toFixed(1)}%)\`);
console.log(\`Absentee Owner:  \${distressStats.absenteeOwner} / \${allProperties.length} (\${((distressStats.absenteeOwner/allProperties.length)*100).toFixed(1)}%)\`);
console.log(\`Has Liens:       \${distressStats.hasLiens} / \${allProperties.length} (\${((distressStats.hasLiens/allProperties.length)*100).toFixed(1)}%)\`);

// Enrichment verification
const enriched = allProperties.filter(p => p.metadata?.enriched).length;
console.log(\`\\n=== ENRICHMENT STATUS ===\`);
console.log(\`Enriched:        \${enriched} / \${allProperties.length} (\${((enriched/allProperties.length)*100).toFixed(1)}%)\`);

// Show top 10 properties with full details
console.log(\`\\n=== TOP 10 PROPERTIES (by score) ===\`);
const sortedProperties = [...allProperties].sort((a, b) => b.matchScore - a.matchScore);
sortedProperties.slice(0, 10).forEach((p, i) => {
  console.log(\`\\n\${i + 1}. [\${p.matchScore}] \${p.address}, \${p.city}\`);
  console.log(\`   Price: $\${p.lastSalePrice?.toLocaleString()} | Equity: \${p.scoreBreakdown?.equityPercent}%\`);
  console.log(\`   Tax Delinquent: \${p.taxDelinquent ? 'YES' : 'no'} | Vacant: \${p.vacant ? 'YES' : 'no'}\`);
  console.log(\`   Absentee: \${p.absenteeOwner ? 'YES' : 'no'} | Liens: \${p.hasLiens ? 'YES' : 'no'}\`);
  if (p.scoreBreakdown) {
    console.log(\`   Breakdown: Price=\${p.scoreBreakdown.priceMatch} Distress=\${p.scoreBreakdown.distressTotal} Char=\${p.scoreBreakdown.characteristics} Equity=\${p.scoreBreakdown.equity}\`);
  }
});

// Filter by minimum match score
const qualifiedProperties = allProperties.filter(p => p.matchScore >= minScore);

// Sort by match score
qualifiedProperties.sort((a, b) => b.matchScore - a.matchScore);

console.log(\`\\n=== QUALIFICATION RESULTS ===\`);
console.log(\`Qualified (>= \${minScore}): \${qualifiedProperties.length} / \${allProperties.length}\`);

if (qualifiedProperties.length === 0) {
  console.log(\`\\nWARNING: NO PROPERTIES QUALIFIED\`);
  console.log(\`Highest score was \${maxScore}, needed \${minScore}\`);
  console.log(\`Consider:\`);
  console.log(\`  1. Lower threshold temporarily to \${Math.max(30, maxScore - 5)} to test workflow\`);
  console.log(\`  2. Process more ZIPs to find distressed properties\`);
  console.log(\`  3. Verify tax delinquency data is being captured\`);
}

// Limit to top N
const investorProfile = typeof user.investorProfile === 'string'
  ? JSON.parse(user.investorProfile)
  : user.investorProfile;

const dailyMax = investorProfile?.leadPreferences?.dailyMaxLeads || 20;
const topProperties = qualifiedProperties.slice(0, dailyMax);

return [{
  json: {
    user: user,
    properties: topProperties,
    stats: {
      fetched: allProperties.length,
      qualified: qualifiedProperties.length,
      ingesting: topProperties.length,
      minScore: minScore,
      avgScore: avgScore,
      maxScore: maxScore,
      distressStats: distressStats
    }
  }
}];
`;

  console.log('✅ Added comprehensive data quality logging\n');
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
  console.log('🔍 Adding data quality verification...\n');

  try {
    const workflow = await getWorkflow();
    await updateWorkflow(workflow);

    console.log('✅ Data Quality Logging Added!\n');
    console.log('📋 This will show you:');
    console.log('   - Exact number of properties processed');
    console.log('   - Score distribution (how many in each range)');
    console.log('   - Distress indicator percentages');
    console.log('   - Top 10 properties with full details');
    console.log('   - Why properties are not qualifying\n');
    console.log('🧪 Run workflow and check the Aggregate node logs');
    console.log('🔗 https://primary-production-8b46.up.railway.app/workflow/EkhrKhMhfRyu00go\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
