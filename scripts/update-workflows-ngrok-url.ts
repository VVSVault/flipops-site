/**
 * Update all workflows to use ngrok URL instead of localhost
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

const NGROK_URL = 'https://cd8ced103c93.ngrok-free.app';
const OLD_URL = 'https://7fcbc4a17dba.ngrok-free.app';

const WORKFLOWS_TO_UPDATE = [
  { id: 'bMguRTKgOG4fFMU2', name: 'G1 - Deal Approval Alert' },
  { id: '8hXMk1O6SlCjbOhs', name: 'G2 - Bid Spread Alert' },
  { id: 'vvqi4QEb16A2jHbo', name: 'G3 - Invoice & Budget Guardian' },
  { id: 'WXEtnLHedF2AVFAK', name: 'G4 - Change Order Gatekeeper' },
  { id: 'JiBPkO0jlvlCZfjT', name: 'Pipeline Monitoring' },
  { id: 'UlVCiQTkNNm5kvAL', name: 'Contractor Performance Tracking' },
  { id: 'TwWfbKedznM8gPjr', name: 'Data Refresh & Sync' }
];

async function updateWorkflow(workflowId: string, workflowName: string) {
  console.log(`\n🔧 Updating: ${workflowName}`);

  // Fetch workflow
  const response = await fetch(`${N8N_BASE_URL}/workflows/${workflowId}`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workflow: ${response.status}`);
  }

  const workflow = await response.json();

  let updated = false;

  // Update all HTTP Request nodes that point to localhost
  workflow.nodes.forEach((node: any) => {
    if (node.type === 'n8n-nodes-base.httpRequest' && node.parameters?.url) {
      if (node.parameters.url.includes(OLD_URL)) {
        console.log(`   Found localhost URL in node: ${node.name}`);
        node.parameters.url = node.parameters.url.replace(OLD_URL, NGROK_URL);
        console.log(`   ✅ Updated to: ${node.parameters.url}`);
        updated = true;
      }
    }
  });

  if (!updated) {
    console.log(`   ℹ️  No localhost URLs found - already updated or using different URL`);
    return;
  }

  // Save workflow
  const updatePayload = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings || {}
  };

  const updateResponse = await fetch(`${N8N_BASE_URL}/workflows/${workflowId}`, {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(updatePayload)
  });

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    throw new Error(`Failed to update workflow: ${updateResponse.status} - ${errorText}`);
  }

  console.log(`   ✅ ${workflowName} updated successfully!`);
}

async function main() {
  console.log('🌐 Updating Workflows with ngrok URL\n');
  console.log(`Old URL: ${OLD_URL}`);
  console.log(`New URL: ${NGROK_URL}\n`);
  console.log('='.repeat(80));

  for (const wf of WORKFLOWS_TO_UPDATE) {
    try {
      await updateWorkflow(wf.id, wf.name);
    } catch (error: any) {
      console.error(`   ❌ Failed to update ${wf.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ WORKFLOWS UPDATED');
  console.log('='.repeat(80));
  console.log(`\n📝 All workflows now point to: ${NGROK_URL}`);
  console.log('\n🧪 Next steps:');
  console.log('   1. Go to n8n dashboard: https://primary-production-8b46.up.railway.app');
  console.log('   2. Test "Data Refresh & Sync" workflow again');
  console.log('   3. Should now connect successfully!\n');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
