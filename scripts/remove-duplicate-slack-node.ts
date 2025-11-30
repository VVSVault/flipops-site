/**
 * Remove the duplicate "Send to Slack" node
 * The "Format Slack Message" node is already sending to Slack
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

async function fixDuplicateSlack() {
  console.log('🔧 Removing duplicate Slack node\n');

  // Get workflow
  const workflowsResponse = await fetch(`${N8N_BASE_URL}/workflows`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json'
    }
  });

  const { data: workflows } = await workflowsResponse.json();
  const attomWorkflow = workflows.find((w: any) => w.name === 'ATTOM Property Discovery');

  const detailResponse = await fetch(`${N8N_BASE_URL}/workflows/${attomWorkflow.id}`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json'
    }
  });

  const workflow = await detailResponse.json();

  console.log(`📋 Original: ${workflow.nodes.length} nodes\n`);

  // Remove the "Send to Slack" node (keep "Format Slack Message")
  workflow.nodes = workflow.nodes.filter((n: any) => n.id !== 'send-slack');

  // Remove connection from "Format Slack Message" to "Send to Slack"
  if (workflow.connections['Format Slack Message']) {
    delete workflow.connections['Format Slack Message'];
  }

  console.log(`✅ After cleanup: ${workflow.nodes.length} nodes\n`);
  console.log('Keeping only "Format Slack Message" which already sends to Slack\n');

  // Update workflow
  const updatePayload = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings || {}
  };

  const updateResponse = await fetch(`${N8N_BASE_URL}/workflows/${attomWorkflow.id}`, {
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

  console.log('✅ Duplicate Slack node removed!');
  console.log('Now only one Slack message will be sent per workflow execution.');
}

fixDuplicateSlack().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
