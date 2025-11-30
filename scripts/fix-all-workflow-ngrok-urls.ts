const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const CURRENT_NGROK_URL = 'https://d740f7483316.ngrok-free.app';

// Regex to match ANY ngrok URL pattern
const NGROK_URL_PATTERN = /https:\/\/[a-z0-9]+\.ngrok-free\.app/g;

async function fixAllWorkflowNgrokUrls() {
  console.log('🔧 Fixing all workflow ngrok URLs...\n');
  console.log(`Current ngrok URL: ${CURRENT_NGROK_URL}\n`);

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
    let skippedCount = 0;

    for (const workflow of workflows) {
      // Convert workflow to JSON string to search for ngrok URLs
      const workflowJson = JSON.stringify(workflow);

      // Find all ngrok URLs in this workflow
      const foundUrls = workflowJson.match(NGROK_URL_PATTERN);
      const uniqueUrls = foundUrls ? [...new Set(foundUrls)] : [];

      if (uniqueUrls.length > 0) {
        console.log(`📝 ${workflow.name} (${workflow.id})`);
        console.log(`   Found ngrok URLs: ${uniqueUrls.join(', ')}`);

        // Check if any URL needs updating
        const needsUpdate = uniqueUrls.some(url => url !== CURRENT_NGROK_URL);

        if (!needsUpdate) {
          console.log(`   ✅ Already using current URL - skipping\n`);
          skippedCount++;
          continue;
        }

        // Replace ALL ngrok URLs with current one
        let updatedWorkflowJson = workflowJson;
        uniqueUrls.forEach(oldUrl => {
          if (oldUrl !== CURRENT_NGROK_URL) {
            console.log(`   Replacing: ${oldUrl} → ${CURRENT_NGROK_URL}`);
            updatedWorkflowJson = updatedWorkflowJson.replace(
              new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
              CURRENT_NGROK_URL
            );
          }
        });

        const updatedWorkflow = JSON.parse(updatedWorkflowJson);

        // Only send the fields that n8n expects for update
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
          console.log(`   ❌ Failed to update: ${errorText}\n`);
        } else {
          console.log(`   ✅ Updated successfully\n`);
          updatedCount++;
        }
      } else {
        console.log(`⏭️  ${workflow.name}: No ngrok URLs found\n`);
        skippedCount++;
      }
    }

    console.log('═'.repeat(70));
    console.log('✅ Fix complete!\n');
    console.log(`   Updated: ${updatedCount} workflows`);
    console.log(`   Skipped: ${skippedCount} workflows (no changes needed)`);
    console.log(`   Total: ${workflows.length} workflows\n`);
    console.log('All workflows now point to:', CURRENT_NGROK_URL);
    console.log('═'.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

fixAllWorkflowNgrokUrls();
