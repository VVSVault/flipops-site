/**
 * Inspect the ATTOM workflow nodes to see the structure
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

async function inspectNodes() {
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

  console.log('📋 All nodes in workflow:\n');
  workflow.nodes.forEach((node: any, i: number) => {
    console.log(`${i + 1}. ${node.name} (ID: ${node.id}, Type: ${node.type})`);
    if (node.name.toLowerCase().includes('slack')) {
      console.log(`   Parameters:`, JSON.stringify(node.parameters, null, 2));
    }
  });

  console.log('\n🔗 Connections:\n');
  Object.keys(workflow.connections).forEach(nodeName => {
    const connections = workflow.connections[nodeName];
    console.log(`${nodeName} →`, JSON.stringify(connections, null, 2));
  });
}

inspectNodes().catch(console.error);
