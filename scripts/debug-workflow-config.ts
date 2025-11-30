/**
 * Debug Data Refresh & Sync workflow to see exact node configuration
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

const WORKFLOW_ID = 'TwWfbKedznM8gPjr'; // Data Refresh & Sync

async function debugWorkflow() {
  console.log('🔍 Debugging: Data Refresh & Sync Workflow\n');
  console.log('='.repeat(80));

  const response = await fetch(`${N8N_BASE_URL}/workflows/${WORKFLOW_ID}`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workflow: ${response.status}`);
  }

  const workflow = await response.json();

  console.log(`\n📋 Workflow: ${workflow.name}`);
  console.log(`Total Nodes: ${workflow.nodes.length}\n`);

  // Find the "Fetch Active Deals" node
  const fetchDealsNode = workflow.nodes.find((n: any) =>
    n.name.includes('Fetch Active Deals') || n.name.includes('Active')
  );

  if (!fetchDealsNode) {
    console.log('❌ Could not find "Fetch Active Deals" node');
    return;
  }

  console.log('='.repeat(80));
  console.log(`\n🔎 Node: ${fetchDealsNode.name}`);
  console.log(`Type: ${fetchDealsNode.type}`);
  console.log(`\n📊 Current Configuration:`);
  console.log(JSON.stringify(fetchDealsNode.parameters, null, 2));

  // Check what's wrong
  console.log('\n' + '='.repeat(80));
  console.log('🔍 DIAGNOSIS:');
  console.log('='.repeat(80));

  if (!fetchDealsNode.parameters.sendQuery) {
    console.log('❌ sendQuery is FALSE or undefined - query params will NOT be sent');
  } else {
    console.log('✅ sendQuery is enabled');
  }

  if (!fetchDealsNode.parameters.queryParameters) {
    console.log('❌ queryParameters is missing');
  } else if (!fetchDealsNode.parameters.queryParameters.parameters ||
             fetchDealsNode.parameters.queryParameters.parameters.length === 0) {
    console.log('❌ queryParameters.parameters is empty');
  } else {
    console.log(`✅ Query parameters configured (${fetchDealsNode.parameters.queryParameters.parameters.length} params):`);
    fetchDealsNode.parameters.queryParameters.parameters.forEach((p: any) => {
      console.log(`   - ${p.name}: ${p.value}`);
    });
  }

  // Show the fix
  console.log('\n' + '='.repeat(80));
  console.log('🔧 RECOMMENDED FIX:');
  console.log('='.repeat(80));
  console.log(`
The node should be configured as:
{
  "method": "GET",
  "url": "https://7fcbc4a17dba.ngrok-free.app/api/deals/active",
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "userId",
        "value": "={{ $json.id }}"
      }
    ]
  }
}
  `);
}

debugWorkflow().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
