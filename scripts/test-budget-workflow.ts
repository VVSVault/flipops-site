const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const WORKFLOW_ID = 'npN26FVmNRsK2oR4';

async function testBudgetWorkflow() {
  console.log('🧪 Testing Budget Alert Workflow...\n');

  try {
    // Execute the workflow
    console.log('📤 Triggering workflow execution...');
    const response = await fetch(`${N8N_API_URL}/workflows/${WORKFLOW_ID}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to execute workflow: ${response.status} ${error}`);
    }

    const result = await response.json();
    console.log('✅ Workflow execution started!\n');
    console.log('📊 Execution Details:');
    console.log(`   • Execution ID: ${result.id || result.executionId || 'Unknown'}`);
    console.log(`   • Status: ${result.status || result.finished ? 'completed' : 'running'}`);

    if (result.data) {
      console.log(`   • Nodes executed: ${result.data.resultData?.runData ? Object.keys(result.data.resultData.runData).length : 'N/A'}`);
    }

    console.log('\n✅ Workflow test complete!');
    console.log('📬 Check your Slack channel for the budget alert notification');

    return result;
  } catch (error) {
    console.error('❌ Error testing workflow:', error);
    throw error;
  }
}

testBudgetWorkflow();
