/**
 * Fix the Slack notification node in ATTOM workflow
 * Uses the same pattern we've been using successfully
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

async function fixSlackNode() {
  console.log('🔧 Fixing ATTOM Workflow Slack Node\n');

  // Step 1: Get all workflows
  const workflowsResponse = await fetch(`${N8N_BASE_URL}/workflows`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json'
    }
  });

  if (!workflowsResponse.ok) {
    throw new Error(`Failed to fetch workflows: ${workflowsResponse.status}`);
  }

  const { data: workflows } = await workflowsResponse.json();
  const attomWorkflow = workflows.find((w: any) => w.name === 'ATTOM Property Discovery');

  if (!attomWorkflow) {
    throw new Error('ATTOM Property Discovery workflow not found');
  }

  console.log(`✅ Found workflow: ${attomWorkflow.name} (ID: ${attomWorkflow.id})\n`);

  // Step 2: Get full workflow details
  const detailResponse = await fetch(`${N8N_BASE_URL}/workflows/${attomWorkflow.id}`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json'
    }
  });

  if (!detailResponse.ok) {
    throw new Error(`Failed to fetch workflow details: ${detailResponse.status}`);
  }

  const workflow = await detailResponse.json();
  console.log(`📋 Loaded workflow with ${workflow.nodes.length} nodes\n`);

  // Step 3: Find and update the Slack node
  const slackNode = workflow.nodes.find((n: any) =>
    n.name === 'Send to Slack' || n.id === 'send-slack'
  );

  if (!slackNode) {
    throw new Error('Slack node not found');
  }

  console.log(`🎯 Found Slack node: "${slackNode.name}" (ID: ${slackNode.id})\n`);

  // Update the node to use proper HTTP Request with JSON body
  slackNode.type = 'n8n-nodes-base.httpRequest';
  slackNode.typeVersion = 4.2;
  slackNode.parameters = {
    method: 'POST',
    url: 'https://hooks.slack.com/services/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',
    authentication: 'none',
    sendHeaders: true,
    headerParameters: {
      parameters: [{
        name: 'Content-Type',
        value: 'application/json'
      }]
    },
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={\n  "text": "🏠 *New Properties Found!*",\n  "blocks": [\n    {\n      "type": "header",\n      "text": {\n        "type": "plain_text",\n        "text": "🏠 New High-Score Properties Discovered",\n        "emoji": true\n      }\n    },\n    {\n      "type": "section",\n      "fields": [\n        {\n          "type": "mrkdwn",\n          "text": "*Total Unique:*\\n{{ $json.totalUnique }} properties"\n        },\n        {\n          "type": "mrkdwn",\n          "text": "*After Daily Limit:*\\n{{ $json.finalCount }} properties"\n        },\n        {\n          "type": "mrkdwn",\n          "text": "*Score Range:*\\n{{ $json.properties[0]?.score }}-{{ $json.properties[$json.properties.length-1]?.score }} pts"\n        },\n        {\n          "type": "mrkdwn",\n          "text": "*Workflow:*\\nATTOM Discovery"\n        }\n      ]\n    },\n    {\n      "type": "section",\n      "text": {\n        "type": "mrkdwn",\n        "text": "*Top 5 Properties:*\\n{{ $json.properties.slice(0, 5).map(p => `• ${p.address} - ${p.score} pts`).join(\'\\\\n\') }}"\n      }\n    },\n    {\n      "type": "divider"\n    },\n    {\n      "type": "context",\n      "elements": [\n        {\n          "type": "mrkdwn",\n          "text": "📅 {{ new Date().toLocaleString() }}"\n        }\n      ]\n    }\n  ]\n}',
    options: {}
  };

  console.log('✅ Updated Slack node configuration\n');

  // Step 4: Upload updated workflow (only send required fields)
  const updatePayload = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings || {}
  };

  const updateResponse = await fetch(`${N8N_BASE_URL}/workflows/${attomWorkflow.id}`, {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(updatePayload)
  });

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    throw new Error(`Failed to update workflow: ${updateResponse.status} - ${errorText}`);
  }

  console.log('✅ Successfully updated ATTOM workflow!\n');
  console.log('=' .repeat(60));
  console.log('The Slack node now sends properly formatted JSON to the webhook.');
  console.log('Run the workflow to test the Slack notifications.');
  console.log('=' .repeat(60));
}

fixSlackNode().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
