#!/usr/bin/env tsx
/**
 * Force clear stuck executions
 */

const N8N_URL = 'https://primary-production-8b46.up.railway.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5ODI3NTA1LCJleHAiOjE3NjI0MDUyMDB9.hlcaGCrFW8ItKSdCvo2giGx4WIzSofPRc7xo7cSmyAo';
const WORKFLOW_ID = 'qFVcWb9f6JmGZCFU';

async function forceClear() {
  console.log('🧹 Force Clearing n8n Executions');
  console.log('=================================\n');

  try {
    // Get all executions
    console.log('1️⃣ Fetching all executions...');
    const execResponse = await fetch(`${N8N_URL}/api/v1/executions?limit=50`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (execResponse.ok) {
      const data = await execResponse.json();
      console.log(`   Found ${data.data?.length || 0} executions\n`);
      
      if (data.data && data.data.length > 0) {
        // Delete stuck executions
        console.log('2️⃣ Deleting stuck executions...');
        let deleted = 0;
        
        for (const exec of data.data) {
          if (!exec.finished) {
            try {
              const deleteResponse = await fetch(`${N8N_URL}/api/v1/executions/${exec.id}`, {
                method: 'DELETE',
                headers: {
                  'X-N8N-API-KEY': N8N_API_KEY
                }
              });
              
              if (deleteResponse.ok) {
                deleted++;
                console.log(`   ✅ Deleted execution ${exec.id}`);
              }
            } catch (err) {
              console.log(`   ⚠️ Could not delete ${exec.id}`);
            }
          }
        }
        
        console.log(`\n   Total deleted: ${deleted}\n`);
      }
    }
    
    // Stop all workflows
    console.log('3️⃣ Stopping all workflows...');
    const workflowsResponse = await fetch(`${N8N_URL}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });
    
    if (workflowsResponse.ok) {
      const workflows = await workflowsResponse.json();
      
      for (const workflow of workflows.data || []) {
        if (workflow.active) {
          await fetch(`${N8N_URL}/api/v1/workflows/${workflow.id}/deactivate`, {
            method: 'POST',
            headers: {
              'X-N8N-API-KEY': N8N_API_KEY
            }
          });
          console.log(`   ✅ Deactivated: ${workflow.name}`);
        }
      }
    }
    
    console.log('\n4️⃣ Waiting for system to clear...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Reactivate our workflow
    console.log('\n5️⃣ Reactivating FlipOps workflow...');
    const activateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });
    
    if (activateResponse.ok) {
      console.log('   ✅ Workflow reactivated!\n');
    }
    
    console.log('✨ System cleared!\n');
    console.log('The queue should now be clear. Try these steps:');
    console.log('1. Go to: ' + N8N_URL + '/workflow/' + WORKFLOW_ID);
    console.log('2. Click the workflow name to open it');
    console.log('3. Look for any red error indicators on nodes');
    console.log('4. Click "Execute Workflow" button (play icon)');
    console.log('5. Watch each node - they should turn green as they execute\n');
    console.log('If the Google Sheets node stays orange/yellow:');
    console.log('- Double-click it');
    console.log('- Click "Execute Node" to test just that node');
    console.log('- Check for credential errors');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

forceClear();
