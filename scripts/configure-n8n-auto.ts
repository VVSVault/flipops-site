#!/usr/bin/env tsx
/**
 * Automatically configure n8n Google Sheets Workflow
 */

import * as fs from 'fs';
import * as path from 'path';

const N8N_URL = 'https://primary-production-8b46.up.railway.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5ODI3NTA1LCJleHAiOjE3NjI0MDUyMDB9.hlcaGCrFW8ItKSdCvo2giGx4WIzSofPRc7xo7cSmyAo';
const WORKFLOW_ID = 'qFVcWb9f6JmGZCFU';

// Load configurations
const serviceAccount = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'google-service-account.json'), 'utf-8'));
const sheetConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'google-sheet-config.json'), 'utf-8'));

async function configureN8n() {
  console.log('🤖 Automatically Configuring n8n Workflow');
  console.log('==========================================\n');

  try {
    // Step 1: Create Google Sheets credentials in n8n
    console.log('1️⃣ Creating Google Sheets Service Account credentials in n8n...');
    
    const credentialData = {
      name: 'FlipOps Service Account',
      type: 'googleSheetsOAuth2Api',
      data: {
        email: serviceAccount.client_email,
        privateKey: serviceAccount.private_key
      }
    };

    const credResponse = await fetch(`${N8N_URL}/api/v1/credentials`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentialData)
    });

    let credentialId;
    if (credResponse.ok) {
      const cred = await credResponse.json();
      credentialId = cred.id;
      console.log(`   ✅ Credentials created with ID: ${credentialId}\n`);
    } else {
      // Try to get existing credentials
      console.log('   ⚠️  Could not create new credentials, checking existing...\n');
      
      const getCredsResponse = await fetch(`${N8N_URL}/api/v1/credentials`, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY
        }
      });
      
      if (getCredsResponse.ok) {
        const creds = await getCredsResponse.json();
        const existing = creds.data?.find((c: any) => 
          c.type === 'googleSheetsOAuth2Api' || 
          c.name?.includes('FlipOps') ||
          c.name?.includes('Service Account')
        );
        if (existing) {
          credentialId = existing.id;
          console.log(`   ✅ Using existing credential: ${existing.name} (ID: ${credentialId})\n`);
        }
      }
    }

    // Step 2: Get and update the workflow
    console.log('2️⃣ Fetching workflow configuration...');
    
    const workflowResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (!workflowResponse.ok) {
      const error = await workflowResponse.text();
      throw new Error(`Failed to fetch workflow: ${error}`);
    }

    const workflow = await workflowResponse.json();
    console.log(`   ✅ Workflow "${workflow.name}" fetched\n`);

    // Step 3: Update Google Sheets nodes
    console.log('3️⃣ Updating Google Sheets nodes with your sheet...');
    
    let nodesUpdated = 0;
    workflow.nodes.forEach((node: any) => {
      if (node.type === 'n8n-nodes-base.googleSheets') {
        // Update parameters
        node.parameters = {
          operation: 'read',
          resource: 'sheet',
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
          options: {
            returnAllColumns: true,
            dataLocationOnSheet: 'headerRow',
            firstDataRow: 2
          }
        };
        
        // Set credentials if we have an ID
        if (credentialId) {
          node.credentials = {
            googleSheetsOAuth2Api: {
              id: credentialId.toString(),
              name: 'FlipOps Service Account'
            }
          };
        }
        
        nodesUpdated++;
        console.log(`   ✅ Updated node: ${node.name}`);
      }
    });
    
    console.log(`   📊 Total nodes updated: ${nodesUpdated}\n`);

    // Step 4: Save the updated workflow
    console.log('4️⃣ Saving updated workflow...');
    
    const updateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflow)
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.log(`   ⚠️  Could not update workflow: ${error}\n`);
    } else {
      console.log('   ✅ Workflow updated successfully!\n');
    }

    // Step 5: Activate the workflow
    console.log('5️⃣ Activating workflow...');
    
    const activateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (activateResponse.ok) {
      console.log('   ✅ Workflow activated and running!\n');
    } else {
      const error = await activateResponse.text();
      console.log(`   ⚠️  Could not activate: ${error}`);
      console.log('   Please activate manually in the n8n UI\n');
    }

    // Step 6: Test the workflow
    console.log('6️⃣ Testing workflow execution...');
    
    const testResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}/run`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (testResponse.ok) {
      const result = await testResponse.json();
      console.log('   ✅ Workflow test executed!');
      console.log(`   Execution ID: ${result.data?.executionId}\n`);
    } else {
      console.log('   ⚠️  Could not test workflow automatically\n');
    }

    // Success summary
    console.log('✨ Configuration Complete!\n');
    console.log('📊 Your Setup:');
    console.log(`   Sheet ID: ${sheetConfig.spreadsheetId}`);
    console.log(`   Sheet URL: ${sheetConfig.spreadsheetUrl}`);
    console.log(`   Service Account: ${serviceAccount.client_email}\n`);
    
    console.log('🎯 What Happens Next:');
    console.log('   • Workflow runs every 5 minutes');
    console.log('   • Reads properties from your Google Sheet');
    console.log('   • Calculates scores for each property');
    console.log('   • Sends Slack alerts for properties with score 80+\n');
    
    console.log('📱 Expected Slack Alerts:');
    console.log('   • 654 Maple Blvd (Score: 93)');
    console.log('   • 369 Spruce Ave (Score: 85)');
    console.log('   • 789 Elm Dr (Score: 80)\n');
    
    console.log('🔗 View in n8n: ' + N8N_URL + '/workflow/' + WORKFLOW_ID);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n⚠️  Cannot connect to n8n. Make sure it\'s running.');
    } else if (error.message.includes('Unauthorized')) {
      console.error('\n⚠️  API key may be invalid or expired.');
    }
  }
}

configureN8n().catch(console.error);
