/**
 * Debug script to fetch workflow JSON and identify the issue
 */

const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';
const WORKFLOW_ID = 'ORNrSAWVXWeNqAb4';

async function debugWorkflow() {
  console.log('Fetching workflow from n8n API...\n');

  const response = await fetch(`${N8N_API_URL}/workflows/${WORKFLOW_ID}`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY
    }
  });

  if (!response.ok) {
    console.error('Failed to fetch workflow:', response.status);
    return;
  }

  const workflow = await response.json();

  console.log('Workflow Name:', workflow.name);
  console.log('Number of Nodes:', workflow.nodes.length);
  console.log('\nSearching for problematic patterns...\n');

  // Check each node for the problematic pattern
  for (const node of workflow.nodes) {
    const nodeStr = JSON.stringify(node);

    // Check for propertyValues, itemName, or parameters array issues
    if (nodeStr.includes('propertyValues') || nodeStr.includes('itemName')) {
      console.log('❌ Found problematic pattern in node:', node.name);
      console.log('   Type:', node.type);
      console.log('   Parameters:', JSON.stringify(node.parameters, null, 2));
      console.log('\n');
    }

    // Check for headerParameters or bodyParameters
    if (node.parameters?.headerParameters || node.parameters?.bodyParameters) {
      console.log('⚠️  Found headerParameters/bodyParameters in:', node.name);
      console.log('   Type:', node.type);
      console.log('   Parameters:', JSON.stringify(node.parameters, null, 2));
      console.log('\n');
    }

    // Check for parameters.parameters pattern
    if (node.parameters?.parameters) {
      console.log('⚠️  Found parameters.parameters pattern in:', node.name);
      console.log('   Type:', node.type);
      console.log('   Structure:', JSON.stringify(node.parameters, null, 2));
      console.log('\n');
    }
  }

  // Save full workflow to file
  const fs = require('fs');
  fs.writeFileSync('workflow-debug.json', JSON.stringify(workflow, null, 2));
  console.log('✅ Full workflow saved to workflow-debug.json');
}

debugWorkflow().catch(console.error);
