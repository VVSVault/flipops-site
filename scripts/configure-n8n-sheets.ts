#!/usr/bin/env tsx
/**
 * Configure n8n Google Sheets Sync Workflow
 */

import * as fs from 'fs';
import * as path from 'path';

const N8N_URL = 'https://primary-production-8b46.up.railway.app';
const N8N_API_KEY = 'n8n_api_dfd4ee60f1b42e0e1e56e712e90c31f1bb1b7c2d1d8c3c1e7c18c7f9a86fdc23';
const WORKFLOW_ID = 'qFVcWb9f6JmGZCFU'; // FlipOps Google Sheets Sync workflow

// Load service account and sheet config
const serviceAccountPath = path.join(process.cwd(), 'google-service-account.json');
const sheetConfigPath = path.join(process.cwd(), 'google-sheet-config.json');

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
const sheetConfig = JSON.parse(fs.readFileSync(sheetConfigPath, 'utf-8'));

async function configureWorkflow() {
  console.log('🔧 Configuring n8n Google Sheets Workflow');
  console.log('=========================================\n');

  try {
    // First, get the current workflow
    console.log('1️⃣ Fetching current workflow configuration...');
    const getResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to fetch workflow: ${getResponse.statusText}`);
    }

    const workflow = await getResponse.json();
    console.log('   ✅ Workflow fetched successfully\n');

    // Find and update the Google Sheets node
    console.log('2️⃣ Updating Google Sheets node configuration...');
    
    let updated = false;
    workflow.nodes.forEach((node: any) => {
      if (node.type === 'n8n-nodes-base.googleSheets') {
        // Update the parameters
        node.parameters = {
          ...node.parameters,
          documentId: {
            __rl: true,
            value: sheetConfig.spreadsheetId,
            mode: 'id'
          },
          sheetName: {
            __rl: true,
            value: 'Properties',
            mode: 'name'
          },
          operation: 'read',
          resource: 'sheet'
        };
        
        // Update credentials reference (this won't create new credentials, just reference)
        node.credentials = {
          googleSheetsOAuth2Api: {
            id: null, // Will need to be set in UI
            name: 'Google Sheets Service Account'
          }
        };
        
        updated = true;
        console.log(`   ✅ Updated node: ${node.name}`);
      }
    });

    if (!updated) {
      console.log('   ⚠️  No Google Sheets nodes found to update');
    }

    console.log('\n3️⃣ Saving updated workflow...');
    const updateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(workflow)
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new Error(`Failed to update workflow: ${error}`);
    }

    console.log('   ✅ Workflow updated successfully!\n');

    // Prepare credential information for manual entry
    console.log('4️⃣ Manual Steps Required in n8n UI:\n');
    console.log('   Since credentials contain sensitive data, you need to:');
    console.log('   1. Go to: ' + N8N_URL);
    console.log('   2. Open "FlipOps Google Sheets Sync" workflow');
    console.log('   3. Double-click the "Get Properties from Sheet" node');
    console.log('   4. Under Credential, click "Create New"');
    console.log('   5. Choose "Service Account" method');
    console.log('   6. Enter these details:\n');
    
    console.log('   📋 Service Account Credentials:');
    console.log('   ├─ Email: ' + serviceAccount.client_email);
    console.log('   ├─ Private Key: (copy from below, INCLUDING the BEGIN/END lines)');
    console.log('   └─ Impersonate Email: (leave empty)\n');
    
    console.log('   📄 Private Key to Copy:');
    console.log('   ┌────────────────────────────────────');
    console.log(serviceAccount.private_key.split('\n').map((line: string) => '   │ ' + line).join('\n'));
    console.log('   └────────────────────────────────────\n');
    
    console.log('   7. Click "Save" on the credential');
    console.log('   8. The following should already be set:');
    console.log('      - Document ID: ' + sheetConfig.spreadsheetId);
    console.log('      - Range: Properties!A:K');
    console.log('   9. Click "Execute node" to test');
    console.log('   10. If successful, save the workflow');
    console.log('   11. Toggle the workflow to "Active"\n');

    // Try to activate the workflow
    console.log('5️⃣ Attempting to activate workflow...');
    const activateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (activateResponse.ok) {
      console.log('   ✅ Workflow activated!\n');
    } else {
      console.log('   ⚠️  Could not activate - please activate manually after adding credentials\n');
    }

    console.log('✨ Configuration Complete!\n');
    console.log('📊 Sheet Information:');
    console.log('   Sheet ID: ' + sheetConfig.spreadsheetId);
    console.log('   Sheet URL: ' + sheetConfig.spreadsheetUrl);
    console.log('   Shared with: ' + serviceAccount.client_email + '\n');
    
    console.log('🎯 Expected Results:');
    console.log('   The workflow will run every 5 minutes and send alerts for:');
    console.log('   • Properties with score 80+');
    console.log('   • Expected: 654 Maple Blvd (93), 369 Spruce Ave (85), 789 Elm Dr (80)\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n⚠️  Cannot connect to n8n');
      console.error('   Make sure your n8n instance is running at:', N8N_URL);
    }
  }
}

configureWorkflow().catch(console.error);
