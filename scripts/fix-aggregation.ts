/**
 * Fix Property Aggregation
 *
 * Problem: Transform node now processes properties one-by-one,
 * but downstream nodes expect batched properties
 *
 * Solution: Add aggregation node to collect all scored properties
 * back into a single output for the user
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
  console.log('🔧 Fixing property aggregation...\n');

  // Update Transform node to work with single properties
  const transformNode = workflow.nodes.find((n: any) => n.name === 'Transform & Calculate Match Score');

  if (!transformNode) {
    throw new Error('Transform node not found');
  }

  console.log('✅ Updating Transform node to return single property...');

  // Transform node stays the same but we'll add logging
  // (Already outputs single property)

  // Add new Aggregate Properties node AFTER Transform
  const aggregateNode = {
    parameters: {
      jsCode: `
/**
 * Aggregate all scored properties for a user
 * Collect individual properties back into a batch
 */

const allInputs = $input.all();

console.log(\`\\n=== Aggregating \${allInputs.length} scored properties ===\`);

if (allInputs.length === 0) {
  console.log('No properties to aggregate');
  return [];
}

// Get user from first property (all have same user)
const user = allInputs[0].json.user;
const minScore = user.minScore || 65;

console.log(\`User: \${user.name}\`);
console.log(\`Min score threshold: \${minScore}\`);

// Collect all properties
const allProperties = allInputs.map(item => item.json.property);

// Filter by minimum score
const qualifiedProperties = allProperties.filter(p => p.matchScore >= minScore);

// Sort by match score (highest first)
qualifiedProperties.sort((a, b) => b.matchScore - a.matchScore);

console.log(\`Total properties: \${allProperties.length}\`);
console.log(\`Qualified (>= \${minScore}): \${qualifiedProperties.length}\`);

if (allProperties.length > 0) {
  const scores = allProperties.map(p => p.matchScore);
  const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  const maxScore = Math.max(...scores);
  const minScoreFound = Math.min(...scores);

  console.log(\`Score range: \${minScoreFound} - \${maxScore} (avg: \${avgScore})\`);
}

if (qualifiedProperties.length > 0) {
  console.log(\`\\nTop 5 qualified properties:\`);
  qualifiedProperties.slice(0, 5).forEach((p, i) => {
    console.log(\`  \${i + 1}. [\${p.matchScore}] \${p.address}, \${p.city} - $\${p.lastSalePrice?.toLocaleString()}\`);
  });
} else {
  console.log(\`\\nNo properties scored above \${minScore}\`);
  console.log(\`Sample scores: \${allProperties.slice(0, 5).map(p => p.matchScore).join(', ')}\`);
}

// Limit to top N per user preferences
const investorProfile = typeof user.investorProfile === 'string'
  ? JSON.parse(user.investorProfile)
  : user.investorProfile;

const dailyMax = investorProfile?.leadPreferences?.dailyMaxLeads || 20;
const topProperties = qualifiedProperties.slice(0, dailyMax);

// Return aggregated result (same format as before)
return [{
  json: {
    user: user,
    properties: topProperties,
    stats: {
      fetched: allProperties.length,
      qualified: qualifiedProperties.length,
      ingesting: topProperties.length,
      minScore: minScore,
      avgScore: allProperties.length > 0
        ? (allProperties.map(p => p.matchScore).reduce((a, b) => a + b, 0) / allProperties.length).toFixed(1)
        : 0
    }
  }
}];
`
    },
    id: 'aggregate-properties',
    name: 'Aggregate Scored Properties',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [2650, 300]
  };

  // Find the "Has Qualified Properties?" node
  const hasQualifiedNode = workflow.nodes.find((n: any) => n.name === 'Has Qualified Properties?');

  if (hasQualifiedNode) {
    // Update its position
    hasQualifiedNode.position = [2850, 300];
  }

  // Add aggregate node
  const existingAggregate = workflow.nodes.find((n: any) => n.name === 'Aggregate Scored Properties');
  if (!existingAggregate) {
    workflow.nodes.push(aggregateNode);
    console.log('✅ Added Aggregate Properties node');
  } else {
    // Update existing
    Object.assign(existingAggregate, aggregateNode);
    console.log('✅ Updated existing Aggregate node');
  }

  // Update connections
  console.log('✅ Updating connections...');

  // Transform -> Aggregate (instead of Transform -> Has Qualified)
  workflow.connections['Transform & Calculate Match Score'] = {
    main: [[{ node: 'Aggregate Scored Properties', type: 'main', index: 0 }]]
  };

  // Aggregate -> Has Qualified
  workflow.connections['Aggregate Scored Properties'] = {
    main: [[{ node: 'Has Qualified Properties?', type: 'main', index: 0 }]]
  };

  console.log('✅ Aggregation flow complete\n');
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
  console.log('🔍 Fixing property aggregation...\n');

  try {
    const workflow = await getWorkflow();
    await updateWorkflow(workflow);

    console.log('✅ Aggregation Fixed!\n');
    console.log('📋 Updated Flow:');
    console.log('   Transform & Calculate Match Score (per property)');
    console.log('   ↓');
    console.log('   Aggregate Scored Properties ← NEW: Collects all properties');
    console.log('   ↓');
    console.log('   Has Qualified Properties? (batch check)');
    console.log('   ↓');
    console.log('   Ingest Properties\n');
    console.log('🧪 Test now - properties should flow to Ingest node!');
    console.log('🔗 https://primary-production-8b46.up.railway.app/workflow/EkhrKhMhfRyu00go\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
