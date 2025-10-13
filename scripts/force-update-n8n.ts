#!/usr/bin/env tsx
/**
 * Force update n8n workflow with direct parameter replacement
 */

const N8N_URL = 'https://primary-production-8b46.up.railway.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5ODI3NTA1LCJleHAiOjE3NjI0MDUyMDB9.hlcaGCrFW8ItKSdCvo2giGx4WIzSofPRc7xo7cSmyAo';
const WORKFLOW_ID = 'qFVcWb9f6JmGZCFU';

async function forceUpdate() {
  console.log('🔨 Force Updating n8n Workflow');
  console.log('===============================\n');

  try {
    // Step 1: Get the workflow
    console.log('1️⃣ Getting workflow...');
    const getResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });

    if (!getResponse.ok) {
      throw new Error('Failed to get workflow');
    }

    const workflow = await getResponse.json();
    console.log(`   ✅ Got workflow: ${workflow.name}\n`);

    // Step 2: Deactivate workflow
    console.log('2️⃣ Deactivating workflow...');
    await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}/deactivate`, {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });
    console.log('   ✅ Deactivated\n');

    // Step 3: Modify nodes directly
    console.log('3️⃣ Modifying nodes...');
    
    // Find and update Google Sheets node
    const sheetsNode = workflow.nodes.find((n: any) => n.type === 'n8n-nodes-base.googleSheets');
    if (sheetsNode) {
      console.log(`   Found: ${sheetsNode.name}`);
      
      // Replace the entire parameters object with simple values
      sheetsNode.parameters = {
        operation: 'read',
        resource: 'sheet',
        documentId: '1TwEzCOn-2FygrJ3jSTixzXgdknMmn-I_AiuHaCPjJKY',
        sheetName: 'Properties',
        options: {}
      };
      
      console.log('   ✅ Updated Google Sheets node\n');
    }

    // Find and update HTTP Request node
    const httpNode = workflow.nodes.find((n: any) => 
      n.type === 'n8n-nodes-base.httpRequest' && n.name.includes('Send')
    );
    if (httpNode) {
      console.log(`   Found: ${httpNode.name}`);
      
      httpNode.parameters = {
        url: 'http://192.168.1.192:3000/api/webhooks/sheets',
        method: 'POST',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ JSON.stringify($items) }}',
        options: {}
      };
      
      console.log('   ✅ Updated HTTP Request node\n');
    }

    // Step 4: Clean the workflow object for saving
    console.log('4️⃣ Preparing workflow for save...');
    
    // Create a minimal workflow object with only required fields
    const minimalWorkflow = {
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings || {},
      staticData: workflow.staticData || {},
      active: false
    };

    console.log('   ✅ Cleaned workflow object\n');

    // Step 5: Save the workflow
    console.log('5️⃣ Saving workflow...');
    
    const saveResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(minimalWorkflow)
    });

    if (saveResponse.ok) {
      console.log('   ✅ Workflow saved successfully!\n');
    } else {
      const errorText = await saveResponse.text();
      console.log('   ⚠️  Save response:', errorText, '\n');
      
      // Try alternative: PATCH instead of PUT
      console.log('6️⃣ Trying PATCH method...');
      
      const patchResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
        method: 'PATCH',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nodes: workflow.nodes
        })
      });
      
      if (patchResponse.ok) {
        console.log('   ✅ PATCH successful!\n');
      } else {
        console.log('   ❌ PATCH also failed\n');
      }
    }

    // Step 7: Reactivate workflow
    console.log('7️⃣ Reactivating workflow...');
    const activateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}/activate`, {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });
    
    if (activateResponse.ok) {
      console.log('   ✅ Workflow activated!\n');
    }

    // Step 8: Verify the changes
    console.log('8️⃣ Verifying changes...');
    const verifyResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });
    
    if (verifyResponse.ok) {
      const updatedWorkflow = await verifyResponse.json();
      const updatedSheetsNode = updatedWorkflow.nodes.find((n: any) => 
        n.type === 'n8n-nodes-base.googleSheets'
      );
      
      if (updatedSheetsNode) {
        console.log('   Current Google Sheets parameters:');
        console.log('   Document ID:', updatedSheetsNode.parameters.documentId);
        console.log('   Sheet Name:', updatedSheetsNode.parameters.sheetName);
        
        if (updatedSheetsNode.parameters.documentId === '1TwEzCOn-2FygrJ3jSTixzXgdknMmn-I_AiuHaCPjJKY') {
          console.log('\n   🎉 SUCCESS! Parameters were updated!');
        } else {
          console.log('\n   ⚠️  Parameters still using environment variables');
          console.log('   You may need to update them manually in the UI');
        }
      }
    }

    console.log('\n✅ Update process complete!');
    console.log('\nNext steps:');
    console.log('1. Go to:', N8N_URL + '/workflow/' + WORKFLOW_ID);
    console.log('2. Check if the Document ID shows the actual value');
    console.log('3. If not, manually replace {{ $env.GOOGLE_SHEET_ID }} with:');
    console.log('   1TwEzCOn-2FygrJ3jSTixzXgdknMmn-I_AiuHaCPjJKY');
    console.log('4. Execute the workflow to test');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

forceUpdate();
