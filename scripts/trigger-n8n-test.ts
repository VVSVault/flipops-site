#!/usr/bin/env tsx
/**
 * Trigger n8n workflow execution and monitor results
 */

const N8N_URL = 'https://primary-production-8b46.up.railway.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5ODI3NTA1LCJleHAiOjE3NjI0MDUyMDB9.hlcaGCrFW8ItKSdCvo2giGx4WIzSofPRc7xo7cSmyAo';
const WORKFLOW_ID = 'qFVcWb9f6JmGZCFU';

async function triggerAndMonitor() {
  console.log('🚀 Triggering n8n Workflow Test');
  console.log('=================================\n');

  try {
    // Step 1: Trigger workflow execution
    console.log('1️⃣ Triggering workflow execution...');
    const triggerResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}/run`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (!triggerResponse.ok) {
      const error = await triggerResponse.text();
      console.log('   ❌ Could not trigger workflow');
      console.log('   Error:', error);
      
      // Try manual trigger via webhook
      console.log('\n2️⃣ Attempting webhook trigger...');
      const webhookUrl = `${N8N_URL}/webhook/qFVcWb9f6JmGZCFU`;
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true })
      });
      
      if (webhookResponse.ok) {
        console.log('   ✅ Webhook triggered successfully!\n');
      } else {
        console.log('   ⚠️  Webhook trigger failed\n');
      }
    } else {
      const result = await triggerResponse.json();
      console.log('   ✅ Workflow triggered successfully!');
      console.log(`   Execution ID: ${result.data?.executionId || 'Unknown'}\n`);
    }

    // Step 2: Wait a moment for execution
    console.log('3️⃣ Waiting for execution to complete...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 3: Check recent executions
    console.log('\n4️⃣ Checking execution results...');
    const executionsResponse = await fetch(`${N8N_URL}/api/v1/executions?workflowId=${WORKFLOW_ID}&limit=3`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (executionsResponse.ok) {
      const executions = await executionsResponse.json();
      
      if (executions.data && executions.data.length > 0) {
        console.log(`   Found ${executions.data.length} recent executions:\n`);
        
        executions.data.forEach((exec: any, index: number) => {
          const status = exec.finished ? 
            (exec.stoppedAt && !exec.data?.resultData?.error ? '✅ Success' : '❌ Failed') : 
            '⏳ Running';
          
          console.log(`   ${index + 1}. ${status}`);
          console.log(`      Started: ${new Date(exec.startedAt).toLocaleString()}`);
          
          if (exec.data?.resultData?.error) {
            console.log(`      ❌ Error: ${exec.data.resultData.error.message}`);
            if (exec.data.resultData.error.description) {
              console.log(`      Details: ${exec.data.resultData.error.description}`);
            }
          } else if (exec.finished && exec.stoppedAt) {
            console.log(`      ✅ Completed successfully`);
            
            // Try to get output data
            if (exec.data?.resultData?.runData) {
              const nodes = Object.keys(exec.data.resultData.runData);
              console.log(`      Nodes executed: ${nodes.length}`);
            }
          }
          console.log('');
        });
        
        // Check if the most recent execution was successful
        const latestExec = executions.data[0];
        if (latestExec.finished && !latestExec.data?.resultData?.error) {
          console.log('✨ Latest execution completed successfully!\n');
          console.log('📊 What should happen next:');
          console.log('   • Properties were read from Google Sheet');
          console.log('   • Scores were calculated for each property');
          console.log('   • High-scoring properties (80+) trigger Slack alerts');
          console.log('   • Check #guardrail-alerts channel for notifications\n');
        }
      } else {
        console.log('   No executions found yet');
        console.log('   The workflow may still be initializing\n');
      }
    }

    // Step 4: Check workflow status
    console.log('5️⃣ Checking workflow configuration...');
    const workflowResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (workflowResponse.ok) {
      const workflow = await workflowResponse.json();
      console.log(`   Workflow: ${workflow.name}`);
      console.log(`   Status: ${workflow.active ? '🟢 ACTIVE' : '🔴 INACTIVE'}`);
      console.log(`   Settings: Runs every 5 minutes`);
      console.log(`   Last updated: ${new Date(workflow.updatedAt).toLocaleString()}\n`);
    }

    console.log('🔗 View in n8n:');
    console.log(`   Dashboard: ${N8N_URL}/workflow/${WORKFLOW_ID}`);
    console.log(`   Executions: ${N8N_URL}/executions`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

triggerAndMonitor().catch(console.error);
