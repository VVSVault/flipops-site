#!/usr/bin/env tsx
/**
 * Test n8n workflow and check execution status
 */

const N8N_URL = 'https://primary-production-8b46.up.railway.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5ODI3NTA1LCJleHAiOjE3NjI0MDUyMDB9.hlcaGCrFW8ItKSdCvo2giGx4WIzSofPRc7xo7cSmyAo';
const WORKFLOW_ID = 'qFVcWb9f6JmGZCFU';

async function testWorkflow() {
  console.log('🧪 Testing n8n Workflow Status');
  console.log('================================\n');

  try {
    // Check workflow status
    console.log('1️⃣ Checking workflow status...');
    const statusResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (statusResponse.ok) {
      const workflow = await statusResponse.json();
      console.log(`   ✅ Workflow: ${workflow.name}`);
      console.log(`   📊 Status: ${workflow.active ? '🟢 ACTIVE' : '🔴 INACTIVE'}`);
      console.log(`   🔗 View: ${N8N_URL}/workflow/${WORKFLOW_ID}\n`);
    }

    // Check recent executions
    console.log('2️⃣ Checking recent executions...');
    const executionsResponse = await fetch(`${N8N_URL}/api/v1/executions?workflowId=${WORKFLOW_ID}&limit=5`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (executionsResponse.ok) {
      const executions = await executionsResponse.json();
      if (executions.data && executions.data.length > 0) {
        console.log(`   Found ${executions.data.length} recent executions:\n`);
        executions.data.forEach((exec: any, index: number) => {
          const status = exec.finished ? (exec.stoppedAt ? '✅ Success' : '❌ Failed') : '⏳ Running';
          console.log(`   ${index + 1}. ${status} - ${new Date(exec.startedAt).toLocaleString()}`);
          if (exec.data?.resultData?.error) {
            console.log(`      Error: ${exec.data.resultData.error.message}`);
          }
        });
      } else {
        console.log('   No recent executions found');
        console.log('   The workflow may need credentials configured\n');
      }
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Go to: ' + N8N_URL);
    console.log('2. Open the workflow: "FlipOps Google Sheets Sync"');
    console.log('3. Add Google Sheets credentials (Service Account)');
    console.log('4. The workflow will run every 5 minutes automatically');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

testWorkflow().catch(console.error);
