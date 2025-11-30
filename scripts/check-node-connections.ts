/**
 * Check node connections in Data Refresh & Sync workflow
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

const WORKFLOW_ID = 'TwWfbKedznM8gPjr'; // Data Refresh & Sync

async function checkConnections() {
  console.log('🔍 Checking Node Connections\n');

  const response = await fetch(`${N8N_BASE_URL}/workflows/${WORKFLOW_ID}`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json'
    }
  });

  const workflow = await response.json();

  console.log('Workflow: Data Refresh & Sync');
  console.log(`Nodes: ${workflow.nodes.length}\n`);
  console.log('='.repeat(80));

  // Show all nodes
  workflow.nodes.forEach((node: any, i: number) => {
    console.log(`${i + 1}. ${node.name} (${node.id || 'no-id'})`);
  });

  console.log('\n='.repeat(80));
  console.log('CONNECTIONS:');
  console.log('='.repeat(80) + '\n');

  // Show connections
  Object.entries(workflow.connections).forEach(([sourceName, connections]: [string, any]) => {
    console.log(`📍 ${sourceName}`);

    if (connections.main && connections.main[0]) {
      connections.main[0].forEach((conn: any) => {
        console.log(`   → ${conn.node} (type: ${conn.type}, index: ${conn.index})`);
      });
    }
    console.log('');
  });

  console.log('='.repeat(80));
  console.log('DIAGNOSIS:');
  console.log('='.repeat(80) + '\n');

  // Check if Loop Through Users connects to Fetch Active Deals
  const loopConnections = workflow.connections['Loop Through Users'];

  if (!loopConnections) {
    console.log('❌ "Loop Through Users" has NO connections!');
    console.log('   The loop needs to connect to "Fetch Active Deals"\n');
  } else {
    console.log('✅ "Loop Through Users" has connections:');
    if (loopConnections.main && loopConnections.main[0]) {
      loopConnections.main[0].forEach((conn: any) => {
        console.log(`   → ${conn.node}`);
        if (conn.node === 'Fetch Active Deals') {
          console.log('   ✅ Correctly connected to Fetch Active Deals!');
        }
      });
    }
    console.log('');
  }

  // Show what the correct flow should be
  console.log('='.repeat(80));
  console.log('EXPECTED FLOW:');
  console.log('='.repeat(80));
  console.log(`
1. Schedule Trigger
   ↓
2. Fetch Active Users (GET /api/users?status=active)
   ↓
3. Loop Through Users (Split In Batches)
   ↓
4. Fetch Active Deals (GET /api/deals/active?userId={{from loop}})
   ↓
5. Check If Any Deals
   ↓
6. Refresh Deal Data
   ↓
7. Format Slack Message
   ↓
8. Send to Slack
  `);
}

checkConnections().catch(error => {
  console.error('❌ Error:', error.message);
});
