#!/usr/bin/env tsx
/**
 * Fix n8n configuration via APIs
 * Since Railway CLI needs interactive login, we'll focus on n8n API fixes
 */

const N8N_URL = 'https://primary-production-8b46.up.railway.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5ODI3NTA1LCJleHAiOjE3NjI0MDUyMDB9.hlcaGCrFW8ItKSdCvo2giGx4WIzSofPRc7xo7cSmyAo';
const WORKFLOW_ID = 'qFVcWb9f6JmGZCFU';

async function applyFixes() {
  console.log('🔧 Applying n8n Fixes via API');
  console.log('==============================\n');

  try {
    // Step 1: Create a test workflow with Manual Trigger
    console.log('1️⃣ Creating test workflow with Manual Trigger...');
    
    const workflowResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });

    if (!workflowResponse.ok) {
      throw new Error('Failed to fetch workflow');
    }

    const workflow = await workflowResponse.json();
    
    // Clone the workflow for testing
    const testWorkflow = {
      name: workflow.name + ' - TEST',
      nodes: [...workflow.nodes],
      connections: { ...workflow.connections },
      settings: workflow.settings || {},
      active: false
    };

    // Replace Schedule Trigger with Manual Trigger
    const scheduleTriggerIndex = testWorkflow.nodes.findIndex((n: any) => 
      n.type === 'n8n-nodes-base.scheduleTrigger'
    );

    if (scheduleTriggerIndex !== -1) {
      const scheduleTrigger = testWorkflow.nodes[scheduleTriggerIndex];
      
      // Create manual trigger with same position
      const manualTrigger = {
        parameters: {},
        name: 'Manual Trigger',
        type: 'n8n-nodes-base.manualTrigger',
        typeVersion: 1,
        position: scheduleTrigger.position,
        id: scheduleTrigger.id
      };

      // Replace schedule with manual
      testWorkflow.nodes[scheduleTriggerIndex] = manualTrigger;

      // Update connections
      if (testWorkflow.connections[scheduleTrigger.name]) {
        testWorkflow.connections['Manual Trigger'] = testWorkflow.connections[scheduleTrigger.name];
        delete testWorkflow.connections[scheduleTrigger.name];
      }
    }

    // Fix Google Sheets node parameters (remove environment variable references)
    const sheetsNodeIndex = testWorkflow.nodes.findIndex((n: any) => 
      n.type === 'n8n-nodes-base.googleSheets'
    );

    if (sheetsNodeIndex !== -1) {
      testWorkflow.nodes[sheetsNodeIndex].parameters = {
        operation: 'read',
        resource: 'sheet',
        documentId: '1TwEzCOn-2FygrJ3jSTixzXgdknMmn-I_AiuHaCPjJKY',
        sheetName: 'Properties',
        options: {
          returnAllColumns: true,
          dataLocationOnSheet: 'headerRow',
          firstDataRow: 2
        }
      };
    }

    // Fix HTTP Request node
    const httpNodeIndex = testWorkflow.nodes.findIndex((n: any) => 
      n.type === 'n8n-nodes-base.httpRequest' && n.name?.includes('Send')
    );

    if (httpNodeIndex !== -1) {
      testWorkflow.nodes[httpNodeIndex].parameters = {
        url: 'http://192.168.1.192:3000/api/webhooks/sheets',
        method: 'POST',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ JSON.stringify($input.all()) }}',
        options: {}
      };
    }

    // Create the test workflow
    console.log('   Creating new test workflow...');
    const createResponse = await fetch(`${N8N_URL}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testWorkflow)
    });

    if (createResponse.ok) {
      const newWorkflow = await createResponse.json();
      console.log(`   ✅ Test workflow created!`);
      console.log(`   ID: ${newWorkflow.id}`);
      console.log(`   URL: ${N8N_URL}/workflow/${newWorkflow.id}\n`);

      // Activate the test workflow
      console.log('2️⃣ Activating test workflow...');
      const activateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${newWorkflow.id}/activate`, {
        method: 'POST',
        headers: { 'X-N8N-API-KEY': N8N_API_KEY }
      });

      if (activateResponse.ok) {
        console.log('   ✅ Test workflow activated!\n');
      }

      console.log('✅ SUCCESS! Test workflow created with:');
      console.log('   • Manual Trigger (no hanging on schedule)');
      console.log('   • Fixed Google Sheets parameters');
      console.log('   • Fixed webhook URL\n');
      
      console.log('🎯 Next Steps:');
      console.log('1. Go to: ' + N8N_URL + '/workflow/' + newWorkflow.id);
      console.log('2. Click "Execute Workflow"');
      console.log('3. It should run immediately!\n');
      
      console.log('📋 For Railway environment variables, you still need to:');
      console.log('1. Go to Railway dashboard');
      console.log('2. Select your n8n service');
      console.log('3. Go to Variables tab');
      console.log('4. Add/Update:');
      console.log('   EXECUTIONS_MODE=regular');
      console.log('   OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS=false');
      console.log('   N8N_RUNNERS_ENABLED=false');
      console.log('5. Redeploy the service\n');
      
      return newWorkflow.id;

    } else {
      const error = await createResponse.text();
      console.log('   ❌ Could not create test workflow:', error);
      
      // Save as JSON file instead
      console.log('\n3️⃣ Saving test workflow as JSON file...');
      const fs = require('fs');
      fs.writeFileSync('n8n-test-workflow-fixed.json', JSON.stringify(testWorkflow, null, 2));
      console.log('   ✅ Saved to: n8n-test-workflow-fixed.json');
      console.log('   Import this file manually in n8n\n');
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  }

  console.log('📝 Manual Railway Fix Instructions:');
  console.log('===================================\n');
  console.log('Since Railway CLI requires interactive login, please:');
  console.log('1. Go to https://railway.app/dashboard');
  console.log('2. Select your project');
  console.log('3. Click on the n8n service');
  console.log('4. Go to the "Variables" tab');
  console.log('5. Add or update these variables:');
  console.log('   EXECUTIONS_MODE=regular');
  console.log('   OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS=false');
  console.log('   N8N_RUNNERS_ENABLED=false');
  console.log('   GOOGLE_SHEET_ID=1TwEzCOn-2FygrJ3jSTixzXgdknMmn-I_AiuHaCPjJKY');
  console.log('   FO_API_BASE_URL=http://192.168.1.192:3000/api');
  console.log('6. Click "Deploy" to restart n8n with new settings');
}

applyFixes();
