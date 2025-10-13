#!/usr/bin/env tsx
/**
 * Execute n8n workflow via API
 */

const N8N_URL = 'https://primary-production-8b46.up.railway.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5ODI3NTA1LCJleHAiOjE3NjI0MDUyMDB9.hlcaGCrFW8ItKSdCvo2giGx4WIzSofPRc7xo7cSmyAo';
const WORKFLOW_ID = 'qFVcWb9f6JmGZCFU';

async function executeWorkflow() {
  console.log('🚀 Executing n8n Workflow via API');
  console.log('==================================\n');

  try {
    // First check workflow status
    console.log('1️⃣ Checking workflow status...');
    const statusResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (statusResponse.ok) {
      const workflow = await statusResponse.json();
      console.log(`   ✅ Workflow: ${workflow.name}`);
      console.log(`   Status: ${workflow.active ? '🟢 ACTIVE' : '🔴 INACTIVE'}`);
      
      if (!workflow.active) {
        console.log('\n2️⃣ Activating workflow first...');
        const activateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}/activate`, {
          method: 'POST',
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY
          }
        });
        
        if (activateResponse.ok) {
          console.log('   ✅ Workflow activated\n');
        }
      }
    } else {
      console.log('   ❌ Could not fetch workflow status\n');
    }

    // Execute the workflow
    console.log('3️⃣ Executing workflow...');
    const executeResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}/execute`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (executeResponse.ok) {
      const result = await executeResponse.json();
      console.log('   ✅ Execution started!');
      console.log(`   Execution ID: ${result.id || 'Unknown'}\n`);
      
      // Wait for execution to complete
      console.log('4️⃣ Waiting for execution to complete...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check execution result
      if (result.id) {
        console.log('5️⃣ Checking execution result...');
        const executionResponse = await fetch(`${N8N_URL}/api/v1/executions/${result.id}`, {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY
          }
        });
        
        if (executionResponse.ok) {
          const execution = await executionResponse.json();
          
          if (execution.finished) {
            if (execution.data?.resultData?.error) {
              console.log('   ❌ Execution failed:');
              console.log(`   ${execution.data.resultData.error.message}`);
            } else {
              console.log('   ✅ Execution completed successfully!');
              
              // Check for output data
              if (execution.data?.resultData?.runData) {
                const nodes = Object.keys(execution.data.resultData.runData);
                console.log(`   Nodes executed: ${nodes.join(', ')}\n`);
                
                // Show data from each node
                nodes.forEach(nodeName => {
                  const nodeData = execution.data.resultData.runData[nodeName];
                  if (nodeData && nodeData[0]?.data?.main?.[0]) {
                    const items = nodeData[0].data.main[0];
                    console.log(`   📊 ${nodeName}: ${items.length} items processed`);
                  }
                });
              }
            }
          } else {
            console.log('   ⏳ Execution still running...');
            console.log('   Check n8n UI for details');
          }
        }
      }
      
    } else {
      const errorText = await executeResponse.text();
      console.log('   ❌ Could not execute workflow');
      console.log(`   Error: ${errorText}\n`);
      
      // Try alternative execution method
      console.log('6️⃣ Trying alternative execution method...');
      const runResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}/run`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ startNode: 'Get Properties from Sheet' })
      });
      
      if (runResponse.ok) {
        const runResult = await runResponse.json();
        console.log('   ✅ Alternative execution started!');
        console.log(`   Run data: ${JSON.stringify(runResult, null, 2)}`);
      } else {
        const runError = await runResponse.text();
        console.log('   ❌ Alternative method also failed');
        console.log(`   Error: ${runError}`);
      }
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Check your dev server console for webhook hits');
    console.log('2. Look for lines starting with "🔥 HIGH-SCORE PROPERTY"');
    console.log('3. Go to n8n UI to see execution details:');
    console.log(`   ${N8N_URL}/executions`);
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

executeWorkflow();
