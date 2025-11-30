/**
 * Fix the Slack notification node in the ATTOM workflow
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

async function fixSlackNode() {
  console.log('🔧 Fixing Slack Notification Node\n');
  console.log('=' .repeat(60) + '\n');

  try {
    // Step 1: Get the workflow
    console.log('STEP 1: Fetching ATTOM workflow...');
    const workflowResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!workflowResponse.ok) {
      throw new Error(`Failed to fetch workflows: ${workflowResponse.status}`);
    }

    const workflows = await workflowResponse.json();
    const attomWorkflow = workflows.data.find((w: any) =>
      w.name.includes('ATTOM') || w.name.includes('Property Discovery')
    );

    if (!attomWorkflow) {
      console.error('❌ Could not find ATTOM workflow');
      console.log('Available workflows:', workflows.data.map((w: any) => w.name));
      return;
    }

    console.log(`✅ Found workflow: "${attomWorkflow.name}" (ID: ${attomWorkflow.id})\n`);

    // Step 2: Get full workflow details
    console.log('STEP 2: Getting workflow details...');
    const detailResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${attomWorkflow.id}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!detailResponse.ok) {
      throw new Error(`Failed to fetch workflow details: ${detailResponse.status}`);
    }

    const workflow = await detailResponse.json();
    console.log(`✅ Retrieved workflow with ${workflow.nodes.length} nodes\n`);

    // Step 3: Find the Slack node
    console.log('STEP 3: Finding Slack notification node...');
    const slackNode = workflow.nodes.find((n: any) =>
      n.name.toLowerCase().includes('slack') ||
      n.type === 'n8n-nodes-base.slack'
    );

    if (!slackNode) {
      console.error('❌ Could not find Slack node');
      console.log('Available nodes:', workflow.nodes.map((n: any) => n.name));
      return;
    }

    console.log(`✅ Found Slack node: "${slackNode.name}"\n`);

    // Step 4: Update the Slack node configuration
    console.log('STEP 4: Updating Slack node configuration...');

    // Update to HTTP Request node with proper JSON payload
    slackNode.type = 'n8n-nodes-base.httpRequest';
    slackNode.typeVersion = 4.1;
    slackNode.parameters = {
      method: 'POST',
      url: 'https://hooks.slack.com/services/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',
      authentication: 'none',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          {
            name: 'Content-Type',
            value: 'application/json'
          }
        ]
      },
      sendBody: true,
      bodyParameters: {
        parameters: []
      },
      specifyBody: 'json',
      jsonBody: '={\n  "text": "🏠 *New Properties Found!*",\n  "blocks": [\n    {\n      "type": "header",\n      "text": {\n        "type": "plain_text",\n        "text": "🏠 New High-Score Properties Discovered",\n        "emoji": true\n      }\n    },\n    {\n      "type": "section",\n      "fields": [\n        {\n          "type": "mrkdwn",\n          "text": "*Total Unique:*\\n{{ $json.totalUnique }} properties"\n        },\n        {\n          "type": "mrkdwn",\n          "text": "*After Daily Limit:*\\n{{ $json.finalCount }} properties"\n        },\n        {\n          "type": "mrkdwn",\n          "text": "*Score Range:*\\n{{ $json.properties[0]?.score }}-{{ $json.properties[$json.properties.length-1]?.score }} pts"\n        },\n        {\n          "type": "mrkdwn",\n          "text": "*Workflow:*\\nATTOM Discovery"\n        }\n      ]\n    },\n    {\n      "type": "section",\n      "text": {\n        "type": "mrkdwn",\n        "text": "*Top Properties:*\\n{{ $json.properties.slice(0, 5).map(p => `• ${p.address} - ${p.score} pts`).join(\'\\\\n\') }}"\n      }\n    },\n    {\n      "type": "divider"\n    },\n    {\n      "type": "context",\n      "elements": [\n        {\n          "type": "mrkdwn",\n          "text": "📅 {{ new Date().toLocaleString() }}"\n        }\n      ]\n    }\n  ]\n}',
      options: {}
    };

    console.log('✅ Node configuration updated\n');

    // Step 5: Save the workflow
    console.log('STEP 5: Saving workflow...');
    const updateResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${attomWorkflow.id}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(workflow)
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update workflow: ${updateResponse.status} - ${errorText}`);
    }

    const updatedWorkflow = await updateResponse.json();
    console.log('✅ Workflow saved successfully!\n');

    console.log('=' .repeat(60));
    console.log('✅ SLACK NODE FIXED!');
    console.log('-'.repeat(60));
    console.log('The Slack notification node has been updated to:');
    console.log('  • Use HTTP Request with proper JSON payload');
    console.log('  • Send formatted message with blocks');
    console.log('  • Include property count, scores, and top properties');
    console.log('\nYou can now run the workflow and it should send Slack notifications successfully!');
    console.log('=' .repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

fixSlackNode().catch(console.error);
