const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const WORKFLOW_ID = 'npN26FVmNRsK2oR4';
const NEW_URL = 'https://d5c3cffd305d.ngrok-free.app';

async function updateWorkflowUrl() {
  console.log('🔄 Updating Budget Alert Workflow URL...\n');

  try {
    // Fetch current workflow
    const getResponse = await fetch(`${N8N_API_URL}/workflows/${WORKFLOW_ID}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
      },
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to fetch workflow: ${getResponse.status}`);
    }

    const workflow = await getResponse.json();

    // Update the Fetch Budget Status node URL
    let updated = false;
    workflow.nodes.forEach((node: any) => {
      if (node.name === 'Fetch Budget Status' && node.type === 'n8n-nodes-base.httpRequest') {
        const oldUrl = node.parameters.url;
        node.parameters.url = `${NEW_URL}/api/contractors/performance`;
        console.log(`✅ Updated "${node.name}" node`);
        console.log(`   Old URL: ${oldUrl}`);
        console.log(`   New URL: ${node.parameters.url}\n`);
        updated = true;
      }
    });

    if (!updated) {
      console.log('⚠️  Could not find "Fetch Budget Status" node to update');
      console.log('Available nodes:');
      workflow.nodes.forEach((node: any) => {
        console.log(`  - ${node.name} (${node.type})`);
      });
      return;
    }

    // Update workflow
    const updateResponse = await fetch(`${N8N_API_URL}/workflows/${WORKFLOW_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY,
      },
      body: JSON.stringify(workflow),
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new Error(`Failed to update workflow: ${updateResponse.status} ${error}`);
    }

    console.log('✅ Workflow URL updated successfully!');
    console.log(`\n🔗 Test workflow at: https://primary-production-8b46.up.railway.app/workflow/${WORKFLOW_ID}`);
    console.log(`\n📝 Note: This workflow currently uses /api/contractors/performance endpoint`);
    console.log(`   because /api/projects/budget-status is experiencing routing issues.`);
    console.log(`   You may want to update the "Process Flagged Projects" node logic`);
    console.log(`   to work with contractor data instead of project data.`);
  } catch (error) {
    console.error('❌ Error updating workflow:', error);
    throw error;
  }
}

updateWorkflowUrl();
