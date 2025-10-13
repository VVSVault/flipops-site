#!/usr/bin/env tsx
/**
 * Automatically set up all n8n credentials
 */

import * as fs from 'fs';
import * as path from 'path';

const N8N_URL = 'https://primary-production-8b46.up.railway.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5ODI3NTA1LCJleHAiOjE3NjI0MDUyMDB9.hlcaGCrFW8ItKSdCvo2giGx4WIzSofPRc7xo7cSmyAo';
const WORKFLOW_ID = 'qFVcWb9f6JmGZCFU';

// Load configurations
const envPath = path.join(process.cwd(), '.env.production.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const SLACK_TOKEN = envContent.match(/SLACK_BOT_TOKEN=(.+)/)?.[1] || '';
const GMAIL_ADDRESS = 'tannercarlson@vvsvault.com';
const GMAIL_PASSWORD = 'jvoh xths nlwa mjlf';
const FO_API_KEY = 'fo_live_10177805c8d743e1a6e1860515dc2b3f';

async function setupCredentials() {
  console.log('🔐 Setting up n8n Credentials via API');
  console.log('======================================\n');

  const credentialsToCreate = [
    {
      name: 'FlipOps Webhook Auth',
      type: 'httpHeaderAuth',
      data: {
        name: 'X-API-Key',
        value: FO_API_KEY
      }
    },
    {
      name: 'FlipOps Slack Bot',
      type: 'slackApi',
      data: {
        accessToken: SLACK_TOKEN
      }
    },
    {
      name: 'FlipOps Gmail',
      type: 'gmail',
      data: {
        email: GMAIL_ADDRESS,
        privateKey: GMAIL_PASSWORD
      }
    }
  ];

  const createdCredentials: any = {};

  // Create each credential
  for (const cred of credentialsToCreate) {
    console.log(`Creating credential: ${cred.name}...`);
    
    try {
      const response = await fetch(`${N8N_URL}/api/v1/credentials`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cred)
      });

      if (response.ok) {
        const result = await response.json();
        createdCredentials[cred.type] = result.id;
        console.log(`   ✅ Created: ${cred.name} (ID: ${result.id})`);
      } else {
        console.log(`   ⚠️  Could not create ${cred.name} - may already exist`);
      }
    } catch (error: any) {
      console.log(`   ❌ Error creating ${cred.name}: ${error.message}`);
    }
  }

  console.log('\n📝 Updating workflow nodes with credentials...\n');

  // Get the workflow
  const workflowResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY
    }
  });

  if (!workflowResponse.ok) {
    console.error('Could not fetch workflow');
    return;
  }

  const workflow = await workflowResponse.json();

  // Update nodes with credentials
  workflow.nodes.forEach((node: any) => {
    // Update HTTP Request nodes
    if (node.type === 'n8n-nodes-base.httpRequest') {
      // Set to no authentication for local webhook
      node.parameters.authentication = 'none';
      
      // Update URL to use local network IP
      if (node.parameters.url?.includes('webhook')) {
        node.parameters.url = 'http://192.168.1.192:3000/api/webhooks/sheets';
        console.log(`   ✅ Updated ${node.name} - URL and removed auth`);
      }
    }
    
    // Update Slack nodes
    if (node.type === 'n8n-nodes-base.slack') {
      if (createdCredentials['slackApi']) {
        node.credentials = {
          slackApi: {
            id: createdCredentials['slackApi'],
            name: 'FlipOps Slack Bot'
          }
        };
        console.log(`   ✅ Updated ${node.name} - Added Slack credentials`);
      }
      
      // Set channel
      node.parameters.channel = 'C09JDCY5SKH'; // #guardrail-alerts
    }
    
    // Update Email nodes
    if (node.type === 'n8n-nodes-base.emailSend' || node.type === 'n8n-nodes-base.gmail') {
      if (createdCredentials['gmail']) {
        node.credentials = {
          gmail: {
            id: createdCredentials['gmail'],
            name: 'FlipOps Gmail'
          }
        };
        console.log(`   ✅ Updated ${node.name} - Added Gmail credentials`);
      }
    }
  });

  // Save the updated workflow
  console.log('\n💾 Saving updated workflow...');
  
  const updateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(workflow)
  });

  if (updateResponse.ok) {
    console.log('   ✅ Workflow updated successfully!\n');
  } else {
    const error = await updateResponse.text();
    console.log(`   ⚠️  Could not fully update workflow: ${error}\n`);
  }

  // Reactivate the workflow
  console.log('🚀 Activating workflow...');
  
  const activateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}/activate`, {
    method: 'POST',
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY
    }
  });

  if (activateResponse.ok) {
    console.log('   ✅ Workflow activated!\n');
  } else {
    console.log('   ⚠️  Could not activate - please activate manually\n');
  }

  console.log('✨ Setup Complete!\n');
  console.log('Next steps:');
  console.log('1. Go to n8n: ' + N8N_URL + '/workflow/' + WORKFLOW_ID);
  console.log('2. Click "Execute Workflow" to test');
  console.log('3. Check your console for webhook hits');
  console.log('4. Check Slack #guardrail-alerts for notifications');
}

setupCredentials().catch(console.error);
