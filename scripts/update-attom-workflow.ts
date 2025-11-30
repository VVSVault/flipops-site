/**
 * Update existing ATTOM Property Discovery Workflow
 * Fixes the authentication issue in the "Fetch Active Users" node
 */

const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const WORKFLOW_ID = 'SXZfQaNGiRoGj5CL';

async function updateWorkflow() {
  console.log('🔧 Updating ATTOM Property Discovery Workflow...\n');

  try {
    // First, fetch the existing workflow
    console.log('📥 Fetching existing workflow...');
    const getResponse = await fetch(`${N8N_API_URL}/workflows/${WORKFLOW_ID}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (!getResponse.ok) {
      const error = await getResponse.text();
      throw new Error(`Failed to fetch workflow: ${getResponse.status} - ${error}`);
    }

    const existingWorkflow = await getResponse.json();
    console.log(`✅ Found workflow: ${existingWorkflow.name}\n`);

    // Update the "Fetch Active Users" node
    const updatedNodes = existingWorkflow.nodes.map((node: any) => {
      if (node.id === 'fetch-users') {
        console.log('🔧 Updating "Fetch Active Users" node...');
        return {
          ...node,
          parameters: {
            url: node.parameters.url,
            method: 'GET',
            options: {}
          }
        };
      }
      return node;
    });

    // Update the workflow
    console.log('📤 Sending update to n8n...\n');
    const updateResponse = await fetch(`${N8N_API_URL}/workflows/${WORKFLOW_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify({
        ...existingWorkflow,
        nodes: updatedNodes
      })
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new Error(`Failed to update workflow: ${updateResponse.status} - ${error}`);
    }

    const updatedWorkflow = await updateResponse.json();
    console.log('✅ Workflow Updated Successfully!');
    console.log(`   ID: ${updatedWorkflow.id}`);
    console.log(`   Name: ${updatedWorkflow.name}`);
    console.log('');
    console.log('🔧 Fixed:');
    console.log('   ✅ Removed Basic Auth requirement from "Fetch Active Users"');
    console.log('   ✅ Set method to GET explicitly');
    console.log('');
    console.log(`🔗 View in n8n: ${N8N_API_URL.replace('/api/v1', '')}/workflow/${updatedWorkflow.id}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

updateWorkflow();
