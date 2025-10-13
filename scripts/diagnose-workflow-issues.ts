#!/usr/bin/env tsx
/**
 * Diagnose and fix workflow issues
 */

const N8N_URL = 'https://primary-production-8b46.up.railway.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5ODI3NTA1LCJleHAiOjE3NjI0MDUyMDB9.hlcaGCrFW8ItKSdCvo2giGx4WIzSofPRc7xo7cSmyAo';
const WORKFLOW_ID = 'qFVcWb9f6JmGZCFU';

async function diagnoseIssues() {
  console.log('🔍 Diagnosing Workflow Issues');
  console.log('==============================\n');

  try {
    // Get workflow
    const response = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch workflow');
    }

    const workflow = await response.json();

    console.log('📋 Workflow Analysis:\n');
    console.log(`Name: ${workflow.name}`);
    console.log(`Active: ${workflow.active}`);
    console.log(`Nodes: ${workflow.nodes.length}\n`);

    // Check each node for issues
    console.log('🔍 Checking each node for issues:\n');

    const issues: string[] = [];

    workflow.nodes.forEach((node: any, index: number) => {
      console.log(`${index + 1}. ${node.name} (${node.type})`);

      // Check for missing credentials
      if (node.credentials) {
        Object.keys(node.credentials).forEach(credType => {
          const cred = node.credentials[credType];
          if (!cred.id || cred.id === 'null') {
            issues.push(`   ❌ ${node.name}: Missing ${credType} credentials`);
            console.log(`   ❌ Missing credentials: ${credType}`);
          } else {
            console.log(`   ✅ Has credentials: ${credType}`);
          }
        });
      }

      // Check for missing parameters
      if (node.type === 'n8n-nodes-base.googleSheets') {
        const docId = node.parameters.documentId;
        if (!docId || (typeof docId === 'object' && docId.value?.includes('$env'))) {
          issues.push(`   ❌ ${node.name}: Document ID uses environment variable or is missing`);
          console.log(`   ❌ Document ID issue: ${JSON.stringify(docId)}`);
        }
        if (!node.parameters.sheetName) {
          issues.push(`   ❌ ${node.name}: Sheet name is missing`);
          console.log(`   ❌ Sheet name missing`);
        }
      }

      if (node.type === 'n8n-nodes-base.httpRequest') {
        if (!node.parameters.url || node.parameters.url.includes('$env')) {
          issues.push(`   ❌ ${node.name}: URL uses environment variable or is missing`);
          console.log(`   ❌ URL issue: ${node.parameters.url}`);
        }
      }

      if (node.type === 'n8n-nodes-base.slack') {
        if (!node.credentials?.slackApi?.id) {
          issues.push(`   ❌ ${node.name}: Missing Slack credentials`);
          console.log(`   ❌ Missing Slack credentials`);
        }
        if (!node.parameters.channel) {
          issues.push(`   ❌ ${node.name}: Channel not specified`);
          console.log(`   ❌ Channel not specified`);
        }
      }

      console.log('');
    });

    // Check connections
    console.log('🔗 Checking connections:\n');
    const connections = workflow.connections;
    let hasStartNode = false;

    Object.keys(connections).forEach(fromNode => {
      const node = workflow.nodes.find((n: any) => n.name === fromNode);
      if (node && (node.type.includes('Trigger') || node.type.includes('trigger'))) {
        hasStartNode = true;
        console.log(`   ✅ Start node found: ${fromNode}`);
      }
    });

    if (!hasStartNode) {
      issues.push('   ❌ No trigger/start node found');
      console.log('   ❌ No trigger/start node found');
    }

    // Summary of issues
    console.log('\n❗ ISSUES FOUND:');
    console.log('================\n');

    if (issues.length === 0) {
      console.log('No critical issues found.\n');
    } else {
      issues.forEach(issue => console.log(issue));
      console.log('');
    }

    // Generate fixes
    console.log('🔧 FIXES NEEDED:');
    console.log('================\n');

    console.log('1. Google Sheets Node:');
    console.log('   - Document ID: Replace {{ $env.GOOGLE_SHEET_ID }} with:');
    console.log('     1TwEzCOn-2FygrJ3jSTixzXgdknMmn-I_AiuHaCPjJKY');
    console.log('   - Sheet Name: Properties');
    console.log('   - Make sure Google Sheets credentials are set\n');

    console.log('2. HTTP Request Node:');
    console.log('   - URL: Replace {{ $env.FO_API_BASE_URL }}/webhooks/n8n with:');
    console.log('     http://192.168.1.192:3000/api/webhooks/sheets');
    console.log('   - Method: POST');
    console.log('   - Authentication: None\n');

    console.log('3. Slack Node (if present):');
    console.log('   - Add Slack credentials');
    console.log('   - Channel: #guardrail-alerts or C09JDCY5SKH\n');

    console.log('4. Trigger Node:');
    console.log('   - For testing, right-click Schedule Trigger → Execute Node');
    console.log('   - Or add a Manual Trigger node\n');

    // Create a minimal working workflow
    console.log('💾 Creating minimal test workflow...\n');

    const minimalWorkflow = {
      name: 'FlipOps Test - Minimal',
      nodes: [
        {
          parameters: {},
          name: 'Manual Trigger',
          type: 'n8n-nodes-base.manualTrigger',
          typeVersion: 1,
          position: [250, 300]
        },
        {
          parameters: {
            operation: 'read',
            resource: 'sheet',
            documentId: '1TwEzCOn-2FygrJ3jSTixzXgdknMmn-I_AiuHaCPjJKY',
            sheetName: 'Properties',
            options: {
              returnAllColumns: true,
              dataLocationOnSheet: 'headerRow'
            }
          },
          name: 'Read Google Sheet',
          type: 'n8n-nodes-base.googleSheets',
          typeVersion: 2,
          position: [450, 300],
          credentials: {
            googleSheetsOAuth2Api: {
              id: null,
              name: 'Google Sheets account'
            }
          }
        },
        {
          parameters: {
            url: 'http://192.168.1.192:3000/api/webhooks/sheets',
            method: 'POST',
            sendBody: true,
            specifyBody: 'json',
            jsonBody: '={{ JSON.stringify($input.all()) }}',
            options: {}
          },
          name: 'Send to Webhook',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 3,
          position: [650, 300]
        }
      ],
      connections: {
        'Manual Trigger': {
          main: [[{ node: 'Read Google Sheet', type: 'main', index: 0 }]]
        },
        'Read Google Sheet': {
          main: [[{ node: 'Send to Webhook', type: 'main', index: 0 }]]
        }
      }
    };

    const fs = require('fs');
    fs.writeFileSync('minimal-test-workflow.json', JSON.stringify(minimalWorkflow, null, 2));
    console.log('✅ Created minimal-test-workflow.json');
    console.log('   This workflow has only 3 nodes:');
    console.log('   Manual Trigger → Read Sheet → Send Webhook\n');

    console.log('📝 TO FIX THE WORKFLOW:');
    console.log('======================\n');
    console.log('Option 1: Fix existing workflow');
    console.log('   1. Go to the workflow in n8n');
    console.log('   2. Update each node with the values shown above');
    console.log('   3. Save and test\n');

    console.log('Option 2: Import minimal test workflow');
    console.log('   1. Import minimal-test-workflow.json');
    console.log('   2. Add Google Sheets credentials');
    console.log('   3. Execute to test\n');

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

diagnoseIssues();