/**
 * Add Detailed Logging to Batch Enrich Node
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
  if (!response.ok) throw new Error(`Failed to fetch workflow: ${response.status}`);
  return response.json();
}

async function updateWorkflow(workflow: any) {
  console.log('🔧 Adding detailed logging to batch enrich...\n');

  const batchNode = workflow.nodes.find((n: any) => n.name === 'Batch Enrich & Score');
  if (!batchNode) throw new Error('Batch node not found');

  // Find the line where we log scored properties and add detailed stats
  const originalCode = batchNode.parameters.jsCode;

  // Insert detailed logging after scoring
  const newCode = originalCode.replace(
    `console.log(\`Scored \${transformedProperties.length} properties\`);`,
    `console.log(\`Scored \${transformedProperties.length} properties\`);

// DETAILED SCORE ANALYSIS
const scores = transformedProperties.map(p => p.matchScore);
const scoreDistribution = {
  '0-20': scores.filter(s => s < 20).length,
  '20-40': scores.filter(s => s >= 20 && s < 40).length,
  '40-60': scores.filter(s => s >= 40 && s < 60).length,
  '60-80': scores.filter(s => s >= 60 && s < 80).length,
  '80-100': scores.filter(s => s >= 80).length
};

console.log(\`\\n=== SCORE DISTRIBUTION ===\`);
console.log(\`  0-20:   \${scoreDistribution['0-20']} properties\`);
console.log(\`  20-40:  \${scoreDistribution['20-40']} properties\`);
console.log(\`  40-60:  \${scoreDistribution['40-60']} properties\`);
console.log(\`  60-80:  \${scoreDistribution['60-80']} properties (TARGET)\`);
console.log(\`  80-100: \${scoreDistribution['80-100']} properties\`);

const avgScore = (scores.reduce((a,b) => a+b, 0) / scores.length).toFixed(1);
const maxScore = Math.max(...scores);
const minScoreFound = Math.min(...scores);

console.log(\`\\nScore Stats:\`);
console.log(\`  Min: \${minScoreFound}, Max: \${maxScore}, Avg: \${avgScore}\`);

// Distress indicators analysis
const distressStats = {
  taxDelinquent: transformedProperties.filter(p => p.taxDelinquent).length,
  vacant: transformedProperties.filter(p => p.vacant).length,
  absenteeOwner: transformedProperties.filter(p => p.absenteeOwner).length,
  hasLiens: transformedProperties.filter(p => p.hasLiens).length
};

console.log(\`\\n=== DISTRESS INDICATORS ===\`);
console.log(\`Tax Delinquent: \${distressStats.taxDelinquent} / \${transformedProperties.length}\`);
console.log(\`Vacant: \${distressStats.vacant} / \${transformedProperties.length}\`);
console.log(\`Absentee Owner: \${distressStats.absenteeOwner} / \${transformedProperties.length}\`);
console.log(\`Has Liens: \${distressStats.hasLiens} / \${transformedProperties.length}\`);

// Show top 10 properties
console.log(\`\\n=== TOP 10 PROPERTIES ===\`);
const sorted = [...transformedProperties].sort((a,b) => b.matchScore - a.matchScore);
sorted.slice(0, 10).forEach((p, i) => {
  console.log(\`\${i+1}. [\${p.matchScore}] \${p.address}, \${p.city} - $\${p.lastSalePrice?.toLocaleString()}\`);
  console.log(\`   Tax Del: \${p.taxDelinquent}, Vacant: \${p.vacant}, Absentee: \${p.absenteeOwner}, Liens: \${p.hasLiens}\`);
});`
  );

  batchNode.parameters.jsCode = newCode;

  console.log('✅ Added detailed logging\n');
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
  console.log('🔍 Adding detailed score analysis logging...\n');

  try {
    const workflow = await getWorkflow();
    await updateWorkflow(workflow);

    console.log('✅ Logging Added!\n');
    console.log('📋 Will now show:');
    console.log('   - Score distribution across all ranges');
    console.log('   - Min/Max/Average scores');
    console.log('   - Distress indicator counts');
    console.log('   - Top 10 properties with details\n');
    console.log('🧪 Run workflow and check Batch Enrich & Score logs');
    console.log('🔗 https://primary-production-8b46.up.railway.app/workflow/EkhrKhMhfRyu00go\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
