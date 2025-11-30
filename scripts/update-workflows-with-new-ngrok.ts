const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const OLD_NGROK_URL = 'https://955b1c50add1.ngrok-free.app';
const NEW_NGROK_URL = 'https://d740f7483316.ngrok-free.app';

async function updateWorkflows() {
  console.log('🔄 Updating workflows with new ngrok URL...\n');
  console.log(`Old URL: ${OLD_NGROK_URL}`);
  console.log(`New URL: ${NEW_NGROK_URL}\n`);

  try {
    // Get all workflows
    const response = await fetch(`${N8N_API_URL}/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workflows: ${response.status}`);
    }

    const data = await response.json();
    const workflows = data.data;

    console.log(`Found ${workflows.length} workflows\n`);

    let updatedCount = 0;

    for (const workflow of workflows) {
      // Convert workflow to JSON string to search for old URL
      const workflowJson = JSON.stringify(workflow);

      if (workflowJson.includes(OLD_NGROK_URL)) {
        console.log(`📝 Updating: ${workflow.name} (${workflow.id})`);

        // Replace all occurrences of old URL with new URL
        const updatedWorkflowJson = workflowJson.replace(
          new RegExp(OLD_NGROK_URL, 'g'),
          NEW_NGROK_URL
        );
        const updatedWorkflow = JSON.parse(updatedWorkflowJson);

        // Only send the fields that n8n expects for update (exclude read-only fields)
        const updatePayload = {
          name: updatedWorkflow.name,
          nodes: updatedWorkflow.nodes,
          connections: updatedWorkflow.connections,
          settings: updatedWorkflow.settings,
          staticData: updatedWorkflow.staticData,
        };

        // Update the workflow
        const updateResponse = await fetch(`${N8N_API_URL}/workflows/${workflow.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-N8N-API-KEY': N8N_API_KEY,
          },
          body: JSON.stringify(updatePayload),
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.log(`   ❌ Failed to update: ${errorText}`);
        } else {
          console.log(`   ✅ Updated successfully`);
          updatedCount++;
        }
      } else {
        console.log(`⏭️  Skipping: ${workflow.name} (no old URL found)`);
      }
    }

    console.log(`\n✅ Update complete!`);
    console.log(`   Updated: ${updatedCount} workflows`);
    console.log(`   Skipped: ${workflows.length - updatedCount} workflows\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

updateWorkflows();
