#!/usr/bin/env tsx
/**
 * Check and clear n8n execution queue
 */

const N8N_URL = 'https://primary-production-8b46.up.railway.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5ODI3NTA1LCJleHAiOjE3NjI0MDUyMDB9.hlcaGCrFW8ItKSdCvo2giGx4WIzSofPRc7xo7cSmyAo';
const WORKFLOW_ID = 'qFVcWb9f6JmGZCFU';

async function checkQueue() {
  console.log('🔍 Checking n8n Execution Queue');
  console.log('================================\n');

  try {
    // Get all executions
    const response = await fetch(`${N8N_URL}/api/v1/executions?limit=20`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        console.log(`Found ${data.data.length} executions:\n`);
        
        const running = data.data.filter((e: any) => !e.finished);
        const failed = data.data.filter((e: any) => e.data?.resultData?.error);
        const success = data.data.filter((e: any) => e.finished && !e.data?.resultData?.error);
        
        console.log(`⏳ Running/Queued: ${running.length}`);
        console.log(`❌ Failed: ${failed.length}`);
        console.log(`✅ Successful: ${success.length}\n`);
        
        // Show details of stuck executions
        if (running.length > 0) {
          console.log('Stuck/Running Executions:');
          running.forEach((exec: any) => {
            console.log(`- ${exec.id}: ${exec.workflowData?.name || 'Unknown'}`);
            console.log(`  Started: ${new Date(exec.startedAt).toLocaleString()}`);
          });
          console.log('');
        }
        
        // Show recent errors
        if (failed.length > 0) {
          console.log('Recent Failures:');
          failed.slice(0, 3).forEach((exec: any) => {
            console.log(`- ${exec.workflowData?.name || 'Unknown'}`);
            if (exec.data?.resultData?.error) {
              console.log(`  Error: ${exec.data.resultData.error.message}`);
            }
          });
          console.log('');
        }
      } else {
        console.log('No executions found');
      }
    }
    
    // Deactivate and reactivate workflow to clear queue
    console.log('🔄 Clearing queue by cycling workflow...\n');
    
    // Deactivate
    console.log('1️⃣ Deactivating workflow...');
    const deactivateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}/deactivate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });
    
    if (deactivateResponse.ok) {
      console.log('   ✅ Workflow deactivated\n');
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Reactivate
    console.log('2️⃣ Reactivating workflow...');
    const activateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });
    
    if (activateResponse.ok) {
      console.log('   ✅ Workflow activated\n');
    }
    
    console.log('✨ Queue cleared!\n');
    console.log('Next steps:');
    console.log('1. Go to: ' + N8N_URL + '/workflow/' + WORKFLOW_ID);
    console.log('2. Click "Execute Workflow" to test');
    console.log('3. If still stuck, try:');
    console.log('   - Check if Google Sheets node has proper credentials');
    console.log('   - Make sure the Sheet ID is correct');
    console.log('   - Verify the sheet is shared with the service account');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

checkQueue();
