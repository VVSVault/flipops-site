const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const WORKFLOW_ID = 'bLWihIQA3uTQ2tbB';

async function testExecution() {
  console.log('🧪 Testing Budget Alert workflow execution...\n');

  try {
    // Get the latest execution
    const executionsResponse = await fetch(
      `${N8N_API_URL}/executions?workflowId=${WORKFLOW_ID}&limit=1`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
        },
      }
    );

    if (!executionsResponse.ok) {
      throw new Error(`Failed to fetch executions: ${executionsResponse.status}`);
    }

    const executions = await executionsResponse.json();

    if (executions.data && executions.data.length > 0) {
      const latestExecution = executions.data[0];
      console.log('📊 Latest Execution:');
      console.log(`   • Execution ID: ${latestExecution.id}`);
      console.log(`   • Status: ${latestExecution.status}`);
      console.log(`   • Started: ${latestExecution.startedAt}`);
      console.log(`   • Finished: ${latestExecution.stoppedAt}`);

      if (latestExecution.status === 'success') {
        console.log('\n✅ Workflow executed successfully!');
        console.log('📬 Check your Slack channel for the performance alert notification');
      } else if (latestExecution.status === 'error') {
        console.log('\n❌ Workflow execution failed');
        console.log('Error:', latestExecution.data?.resultData?.error);
      }
    } else {
      console.log('⚠️  No executions found yet');
      console.log('🔗 Open workflow and click "Execute Workflow":');
      console.log(`   https://primary-production-8b46.up.railway.app/workflow/${WORKFLOW_ID}`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

testExecution();
