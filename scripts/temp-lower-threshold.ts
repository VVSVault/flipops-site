/**
 * Temporarily Lower Score Threshold for Testing
 *
 * Set minScore to 40 temporarily to verify workflow works end-to-end
 * We can raise it back to 65 once we confirm ingestion works
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
  console.log('🔧 Temporarily lowering threshold for testing...\n');

  const aggregateNode = workflow.nodes.find((n: any) => n.name === 'Aggregate Scored Properties');

  if (!aggregateNode) {
    throw new Error('Aggregate node not found');
  }

  // Update the minScore in the aggregate node
  aggregateNode.parameters.jsCode = aggregateNode.parameters.jsCode.replace(
    'const minScore = user.minScore || 65;',
    'const minScore = 40; // TEMPORARY: Lower threshold for testing'
  );

  console.log('✅ Set threshold to 40 (temporary)\n');
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
  console.log('🔍 Lowering threshold for end-to-end test...\n');

  try {
    const workflow = await getWorkflow();
    await updateWorkflow(workflow);

    console.log('✅ Threshold Lowered to 40!\n');
    console.log('📋 This allows you to:');
    console.log('   1. Verify properties flow to Ingest node');
    console.log('   2. Test Slack notifications');
    console.log('   3. Confirm full workflow works');
    console.log('');
    console.log('⚠️  REMEMBER: Raise back to 65 for production!');
    console.log('');
    console.log('🧪 Run workflow now - properties scoring 40+ will be ingested');
    console.log('🔗 https://primary-production-8b46.up.railway.app/workflow/EkhrKhMhfRyu00go\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
