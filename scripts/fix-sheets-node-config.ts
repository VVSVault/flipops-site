#!/usr/bin/env tsx
/**
 * Fix Google Sheets node configuration with proper Sheet ID
 */

import * as fs from 'fs';
import * as path from 'path';

const N8N_URL = 'https://primary-production-8b46.up.railway.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5ODI3NTA1LCJleHAiOjE3NjI0MDUyMDB9.hlcaGCrFW8ItKSdCvo2giGx4WIzSofPRc7xo7cSmyAo';
const WORKFLOW_ID = 'qFVcWb9f6JmGZCFU';
const SHEET_ID = '1TwEzCOn-2FygrJ3jSTixzXgdknMmn-I_AiuHaCPjJKY';

async function fixSheetsNode() {
  console.log('🔧 Fixing Google Sheets Node Configuration');
  console.log('==========================================\n');

  try {
    // Get current workflow
    console.log('1️⃣ Fetching workflow...');
    const workflowResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (!workflowResponse.ok) {
      throw new Error('Could not fetch workflow');
    }

    const workflow = await workflowResponse.json();
    console.log(`   ✅ Workflow: ${workflow.name}\n`);

    // Update Google Sheets nodes
    console.log('2️⃣ Updating Google Sheets nodes...');
    let updated = false;
    
    workflow.nodes.forEach((node: any) => {
      if (node.type === 'n8n-nodes-base.googleSheets') {
        console.log(`   Found node: ${node.name}`);
        
        // Set proper parameters
        node.parameters = {
          operation: 'read',
          resource: 'sheet',
          documentId: SHEET_ID,  // Direct string value
          sheetName: 'Properties',  // Direct string value
          options: {
            returnAllColumns: true,
            dataLocationOnSheet: 'headerRow'
          }
        };
        
        console.log(`   ✅ Updated with Sheet ID: ${SHEET_ID}`);
        updated = true;
      }
      
      // Also update HTTP Request node URL
      if (node.type === 'n8n-nodes-base.httpRequest') {
        if (node.name?.includes('FlipOps') || node.name?.includes('Send')) {
          node.parameters = {
            ...node.parameters,
            url: 'http://192.168.1.192:3000/api/webhooks/sheets',
            method: 'POST',
            authentication: 'none',
            sendBody: true,
            bodyParametersUi: {
              parameter: []
            },
            bodyParametersJson: '={{ $json }}',
            options: {
              batching: {
                batch: {
                  batchSize: 50
                }
              }
            }
          };
          console.log(`   ✅ Updated HTTP node: ${node.name}`);
        }
      }
    });

    if (!updated) {
      console.log('   ⚠️  No Google Sheets nodes found\n');
    }

    // Save updated workflow
    console.log('\n3️⃣ Saving workflow...');
    
    // First deactivate
    await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}/deactivate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });
    
    const updateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: workflow.id,
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings,
        staticData: workflow.staticData,
        active: false
      })
    });

    if (updateResponse.ok) {
      console.log('   ✅ Workflow saved!\n');
    } else {
      const error = await updateResponse.text();
      console.log(`   ⚠️  Save issue: ${error}\n`);
    }

    // Reactivate
    console.log('4️⃣ Reactivating workflow...');
    const activateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (activateResponse.ok) {
      console.log('   ✅ Workflow activated!\n');
    }

    console.log('✨ Configuration Fixed!\n');
    console.log('📋 Settings Applied:');
    console.log(`   Sheet ID: ${SHEET_ID}`);
    console.log('   Sheet Name: Properties');
    console.log('   Range: All columns');
    console.log('   Webhook: http://192.168.1.192:3000/api/webhooks/sheets\n');
    
    console.log('🎯 Now try executing:');
    console.log('1. Go to: ' + N8N_URL + '/workflow/' + WORKFLOW_ID);
    console.log('2. Click "Execute Workflow"');
    console.log('3. The Google Sheets node should now work!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

fixSheetsNode();
