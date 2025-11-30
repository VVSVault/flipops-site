/**
 * Fix ngrok URL in Code nodes (they weren't updated by the HTTP node update script)
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

const NEW_NGROK_URL = 'https://cd8ced103c93.ngrok-free.app';
const OLD_NGROK_URL = 'https://7fcbc4a17dba.ngrok-free.app';

const WORKFLOWS = [
  'TwWfbKedznM8gPjr', // Data Refresh & Sync
  'bMguRTKgOG4fFMU2', // G1
  '8hXMk1O6SlCjbOhs', // G2
  'vvqi4QEb16A2jHbo', // G3
  'WXEtnLHedF2AVFAK', // G4
  'JiBPkO0jlvlCZfjT', // Pipeline Monitoring
  'UlVCiQTkNNm5kvAL'  // Contractor Performance
];

async function fixWorkflow(workflowId: string) {
  // Get workflow
  const response = await fetch(`${N8N_BASE_URL}/workflows/${workflowId}`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json'
    }
  });

  const workflow = await response.json();

  let updated = false;

  // Find all Code nodes and update URLs in their jsCode
  for (const node of workflow.nodes) {
    if (node.type === 'n8n-nodes-base.code' && node.parameters?.jsCode) {
      const oldCode = node.parameters.jsCode;

      // Replace old ngrok URL with new one
      const newCode = oldCode.replace(
        new RegExp(OLD_NGROK_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        NEW_NGROK_URL
      );

      if (newCode !== oldCode) {
        node.parameters.jsCode = newCode;
        updated = true;
        console.log(`   ✅ Updated ${node.name}`);
      }
    }
  }

  if (!updated) {
    console.log(`   ⏭️  No Code nodes needed updating`);
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
    throw new Error(`Failed to update: ${updateResponse.status}`);
  }

  console.log(`   💾 Saved ${workflow.name}`);
}

async function main() {
  console.log('🔧 Fixing ngrok URLs in Code nodes\n');
  console.log(`Old URL: ${OLD_NGROK_URL}`);
  console.log(`New URL: ${NEW_NGROK_URL}`);
  console.log('='.repeat(80));

  for (const workflowId of WORKFLOWS) {
    console.log(`\n🔸 Workflow ${workflowId}:`);
    try {
      await fixWorkflow(workflowId);
    } catch (error: any) {
      console.error(`   ❌ Failed: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ ALL CODE NODES UPDATED');
  console.log('='.repeat(80));
  console.log('\n🧪 Test the workflow again - it should now call the correct API!\n');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
