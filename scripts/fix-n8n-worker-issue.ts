#!/usr/bin/env tsx
/**
 * Fix n8n execution hanging by updating workflow to use Manual Trigger
 * and providing instructions for environment variable fixes
 */

const N8N_URL = 'https://primary-production-8b46.up.railway.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5ODI3NTA1LCJleHAiOjE3NjI0MDUyMDB9.hlcaGCrFW8ItKSdCvo2giGx4WIzSofPRc7xo7cSmyAo';
const WORKFLOW_ID = 'qFVcWb9f6JmGZCFU';

async function fixWorkerIssue() {
  console.log('🔧 Fixing n8n Worker/Execution Issue');
  console.log('=====================================\n');

  console.log('📋 IMMEDIATE FIX - Railway Environment Variables:');
  console.log('================================================\n');
  console.log('Go to Railway → n8n service → Variables tab\n');
  console.log('ADD or UPDATE these variables:\n');
  console.log('   EXECUTIONS_MODE=regular');
  console.log('   (or remove EXECUTIONS_MODE entirely)\n');
  console.log('   OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS=false');
  console.log('   (or remove this variable entirely)\n');
  console.log('   N8N_RUNNERS_ENABLED=false');
  console.log('   (or remove this variable entirely)\n');
  console.log('Then click "Redeploy" on the n8n service.\n');
  console.log('This will make executions run in-process instead of waiting for a non-existent worker.\n');

  try {
    // Get workflow
    const response = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });

    if (response.ok) {
      const workflow = await response.json();
      
      console.log('📝 WORKFLOW FIX - Add Manual Trigger:');
      console.log('======================================\n');
      
      // Check if there's a schedule trigger
      const scheduleTrigger = workflow.nodes.find((n: any) => 
        n.type === 'n8n-nodes-base.scheduleTrigger'
      );
      
      if (scheduleTrigger) {
        console.log('Found Schedule Trigger in workflow.\n');
        console.log('For testing, you have two options:\n');
        console.log('Option 1: Execute the Schedule Trigger directly');
        console.log('   - In the workflow, right-click the Schedule Trigger node');
        console.log('   - Select "Execute Node"\n');
        console.log('Option 2: Add a Manual Trigger for testing');
        console.log('   - Add a "Manual Trigger" node');
        console.log('   - Connect it to the same nodes as Schedule Trigger');
        console.log('   - Use this for testing\n');
      }
      
      // Create a test workflow with Manual Trigger
      const testWorkflow = JSON.parse(JSON.stringify(workflow));
      
      // Find or add a manual trigger
      let manualTrigger = testWorkflow.nodes.find((n: any) => 
        n.type === 'n8n-nodes-base.manualTrigger'
      );
      
      if (!manualTrigger) {
        manualTrigger = {
          parameters: {},
          name: 'Manual Test Trigger',
          type: 'n8n-nodes-base.manualTrigger',
          typeVersion: 1,
          position: [250, 300],
          id: 'manual-trigger-' + Date.now()
        };
        testWorkflow.nodes.push(manualTrigger);
        
        // Update connections to include manual trigger
        if (scheduleTrigger && testWorkflow.connections[scheduleTrigger.name]) {
          testWorkflow.connections[manualTrigger.name] = testWorkflow.connections[scheduleTrigger.name];
        }
      }
      
      console.log('💾 SAVE THIS TEST WORKFLOW:');
      console.log('===========================\n');
      console.log('A test version with Manual Trigger has been created.');
      console.log('Saved to: n8n-test-workflow.json\n');
      
      // Save test workflow
      const fs = require('fs');
      fs.writeFileSync('n8n-test-workflow.json', JSON.stringify(testWorkflow, null, 2));
    }

    console.log('🚀 COMPLETE FIX STEPS:');
    console.log('======================\n');
    console.log('1. Update Railway environment variables (shown above)');
    console.log('2. Wait for n8n to redeploy (1-2 minutes)');
    console.log('3. Go to: ' + N8N_URL + '/workflow/' + WORKFLOW_ID);
    console.log('4. Either:');
    console.log('   a) Right-click Schedule Trigger → Execute Node');
    console.log('   b) Import n8n-test-workflow.json with Manual Trigger');
    console.log('5. Click "Execute Workflow"\n');
    console.log('The workflow should now execute immediately without hanging!\n');
    
    console.log('🎯 ALSO REMEMBER TO:');
    console.log('====================\n');
    console.log('Update the Google Sheets node:');
    console.log('   Document ID: 1TwEzCOn-2FygrJ3jSTixzXgdknMmn-I_AiuHaCPjJKY');
    console.log('   Sheet Name: Properties\n');
    console.log('Update the HTTP Request node:');
    console.log('   URL: http://192.168.1.192:3000/api/webhooks/sheets');

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

fixWorkerIssue();
