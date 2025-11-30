/**
 * Show ALL nodes in Data Refresh & Sync workflow
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

const WORKFLOW_ID = 'TwWfbKedznM8gPjr'; // Data Refresh & Sync

async function debugWorkflow() {
  console.log('🔍 All Nodes in Data Refresh & Sync Workflow\n');

  const response = await fetch(`${N8N_BASE_URL}/workflows/${WORKFLOW_ID}`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json'
    }
  });

  const workflow = await response.json();

  console.log(`Workflow: ${workflow.name}\n`);
  console.log('='.repeat(80));

  workflow.nodes.forEach((node: any, i: number) => {
    console.log(`\n${i + 1}. ${node.name} (${node.type})`);

    if (node.type === 'n8n-nodes-base.httpRequest') {
      console.log(`   URL: ${node.parameters.url}`);
      console.log(`   sendQuery: ${node.parameters.sendQuery}`);
      if (node.parameters.queryParameters) {
        console.log(`   Query Params:`, node.parameters.queryParameters.parameters);
      } else {
        console.log(`   Query Params: NONE`);
      }
    }
  });

  console.log('\n' + '='.repeat(80));
}

debugWorkflow().catch(error => {
  console.error('❌ Error:', error.message);
});
