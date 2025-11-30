/**
 * Debug the Data Refresh & Sync workflow to see why Slack isn't being sent
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

const WORKFLOW_ID = 'TwWfbKedznM8gPjr'; // Data Refresh & Sync

async function debug() {
  console.log('🔍 Debugging Data Refresh & Sync workflow\n');

  // 1. Get the workflow
  const workflowResponse = await fetch(`${N8N_BASE_URL}/workflows/${WORKFLOW_ID}`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json'
    }
  });

  const workflow = await workflowResponse.json();

  // 2. Check the "Process All Users" code
  const processNode = workflow.nodes.find((n: any) => n.name === 'Process All Users');
  console.log('📝 Process All Users Code:');
  console.log('='.repeat(80));
  console.log(processNode?.parameters?.jsCode || 'NO CODE FOUND');
  console.log('='.repeat(80));
  console.log();

  // 3. Check the "Send Slack Notifications" code
  const slackNode = workflow.nodes.find((n: any) => n.name === 'Send Slack Notifications');
  console.log('📝 Send Slack Notifications Code:');
  console.log('='.repeat(80));
  console.log(slackNode?.parameters?.jsCode || 'NO CODE FOUND');
  console.log('='.repeat(80));
  console.log();

  // 4. Get recent executions
  console.log('📊 Recent Executions:');
  console.log('='.repeat(80));

  const executionsResponse = await fetch(`${N8N_BASE_URL}/executions?workflowId=${WORKFLOW_ID}&limit=5`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json'
    }
  });

  const executions = await executionsResponse.json();

  if (executions.data && executions.data.length > 0) {
    for (const exec of executions.data) {
      console.log(`\n🔸 Execution ${exec.id}:`);
      console.log(`   Status: ${exec.status}`);
      console.log(`   Started: ${exec.startedAt}`);
      console.log(`   Finished: ${exec.stoppedAt}`);

      // Get detailed execution data
      const detailResponse = await fetch(`${N8N_BASE_URL}/executions/${exec.id}`, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Accept': 'application/json'
        }
      });

      const detail = await detailResponse.json();

      if (detail.data?.resultData?.runData) {
        const runData = detail.data.resultData.runData;

        // Check each node's output
        for (const [nodeName, nodeData] of Object.entries(runData)) {
          const data = nodeData as any[];
          console.log(`\n   📌 ${nodeName}:`);

          if (data && data[0]?.data?.main?.[0]) {
            const items = data[0].data.main[0];
            console.log(`      Items: ${items.length}`);

            if (items.length > 0) {
              console.log(`      First item:`, JSON.stringify(items[0].json, null, 2).substring(0, 500));
            }
          } else {
            console.log(`      No output data`);
          }
        }
      }
    }
  } else {
    console.log('No recent executions found.');
  }

  console.log('\n' + '='.repeat(80));
}

debug().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
