/**
 * Fix userId expression in all workflows to properly reference Loop Through Users node
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

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

  // Find nodes that have userId parameter
  workflow.nodes.forEach((node: any) => {
    if (node.type === 'n8n-nodes-base.httpRequest' &&
        node.parameters?.queryParameters?.parameters) {

      node.parameters.queryParameters.parameters.forEach((param: any) => {
        if (param.name === 'userId') {
          const oldValue = param.value;

          // Fix the expression to properly reference Loop Through Users
          if (param.value === '={{ $json.id }}') {
            param.value = '={{ $("Loop Through Users").item.json.id }}';
            console.log(`   ${node.name}: Updated userId expression`);
            console.log(`      Old: ${oldValue}`);
            console.log(`      New: ${param.value}`);
            updated = true;
          } else if (param.value !== '={{ $("Loop Through Users").item.json.id }}') {
            console.log(`   ${node.name}: Has different userId expression: ${param.value}`);
          } else {
            console.log(`   ${node.name}: Already using correct expression`);
          }
        }
      });
    }
  });

  if (!updated) {
    console.log(`   ℹ️  No updates needed`);
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
  console.log('🔧 Fixing userId Expression in All Workflows\n');
  console.log('Old: ={{ $json.id }}');
  console.log('New: ={{ $("Loop Through Users").item.json.id }}\n');
  console.log('='.repeat(80));

  for (const wf of WORKFLOWS_TO_UPDATE) {
    try {
      await updateWorkflow(wf.id, wf.name);
    } catch (error: any) {
      console.error(`   ❌ Failed to update ${wf.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ ALL WORKFLOWS UPDATED');
  console.log('='.repeat(80));
  console.log('\n🧪 Test again - userId should now be passed correctly!\n');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
