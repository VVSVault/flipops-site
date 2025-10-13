#!/usr/bin/env tsx
/**
 * Check current workflow state and patch it directly
 */

const N8N_URL = 'https://primary-production-8b46.up.railway.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5ODI3NTA1LCJleHAiOjE3NjI0MDUyMDB9.hlcaGCrFW8ItKSdCvo2giGx4WIzSofPRc7xo7cSmyAo';
const WORKFLOW_ID = 'qFVcWb9f6JmGZCFU';
const SHEET_ID = '1TwEzCOn-2FygrJ3jSTixzXgdknMmn-I_AiuHaCPjJKY';

async function checkAndPatch() {
  console.log('🔍 Checking Current Workflow State');
  console.log('====================================\n');

  try {
    // Get current workflow
    const response = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    const workflow = await response.json();
    
    console.log('📋 Current Google Sheets Node Configuration:\n');
    
    // Find and display Google Sheets node
    const sheetsNode = workflow.nodes.find((n: any) => n.type === 'n8n-nodes-base.googleSheets');
    
    if (sheetsNode) {
      console.log('Node Name:', sheetsNode.name);
      console.log('Current Parameters:');
      console.log(JSON.stringify(sheetsNode.parameters, null, 2));
      
      console.log('\n❌ Problem Identified:');
      if (!sheetsNode.parameters.documentId || sheetsNode.parameters.documentId !== SHEET_ID) {
        console.log('   - Document ID is missing or incorrect');
        console.log('   - Current:', sheetsNode.parameters.documentId);
        console.log('   - Should be:', SHEET_ID);
      }
      
      console.log('\n🔧 Manual Fix Instructions:');
      console.log('Since the API isn\'t updating properly, you need to manually fix this:\n');
      console.log('1. Go to: ' + N8N_URL + '/workflow/' + WORKFLOW_ID);
      console.log('2. Double-click the "Get Properties from Sheet" node');
      console.log('3. In the Document ID field, paste this EXACT value:');
      console.log('\n   ' + SHEET_ID + '\n');
      console.log('4. In the Sheet Name field, enter: Properties');
      console.log('5. Under Options:');
      console.log('   - Data Location on Sheet: Header Row');
      console.log('   - First Data Row: 2');
      console.log('6. Click the back arrow to save the node');
      console.log('7. Save the workflow (Ctrl+S or Cmd+S)');
      console.log('8. Click "Execute Workflow" to test\n');
      
      // Also check HTTP node
      const httpNode = workflow.nodes.find((n: any) => 
        n.type === 'n8n-nodes-base.httpRequest' && 
        (n.name?.includes('FlipOps') || n.name?.includes('Send'))
      );
      
      if (httpNode) {
        console.log('📋 HTTP Webhook Node Configuration:');
        console.log('Current URL:', httpNode.parameters.url);
        console.log('\nIf the URL is wrong, update it to:');
        console.log('   http://192.168.1.192:3000/api/webhooks/sheets');
        console.log('   (Use your actual local IP address)\n');
      }
      
      // Create a direct workflow JSON you can import
      console.log('🔄 Alternative: Import this configuration directly:\n');
      console.log('1. Copy the JSON below');
      console.log('2. In n8n, go to Workflows → Import from File');
      console.log('3. Paste this JSON:\n');
      
      // Create a minimal fix
      const fixedNode = {
        ...sheetsNode,
        parameters: {
          operation: 'read',
          resource: 'sheet',
          documentId: SHEET_ID,
          sheetName: 'Properties',
          options: {
            returnAllColumns: true,
            dataLocationOnSheet: 'headerRow',
            firstDataRow: 2
          }
        }
      };
      
      console.log('Fixed Google Sheets node parameters:');
      console.log(JSON.stringify(fixedNode.parameters, null, 2));
      
    } else {
      console.log('❌ No Google Sheets node found in workflow!');
    }
    
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

checkAndPatch();
