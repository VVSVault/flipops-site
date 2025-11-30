/**
 * Update Slack message to show all properties (not just top 5)
 * And add summary stats
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

async function updateSlackMessage() {
  console.log('🔧 Updating Slack message format\n');

  // Get workflow
  const workflowsResponse = await fetch(`${N8N_BASE_URL}/workflows`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json'
    }
  });

  const { data: workflows } = await workflowsResponse.json();
  const attomWorkflow = workflows.find((w: any) => w.name === 'ATTOM Property Discovery');

  const detailResponse = await fetch(`${N8N_BASE_URL}/workflows/${attomWorkflow.id}`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json'
    }
  });

  const workflow = await detailResponse.json();

  // Find the Format Slack Message node
  const slackNode = workflow.nodes.find((n: any) => n.name === 'Format Slack Message');

  if (!slackNode) {
    throw new Error('Format Slack Message node not found');
  }

  console.log(`✅ Found: ${slackNode.name}\n`);

  // Update to show more properties with better formatting
  slackNode.parameters.jsonBody = `={\n  "text": "🏠 New Properties Found: {{ $json.finalCount }} qualified leads",\n  "blocks": [\n    {\n      "type": "header",\n      "text": {\n        "type": "plain_text",\n        "text": "🏠 ATTOM Property Discovery Report",\n        "emoji": true\n      }\n    },\n    {\n      "type": "section",\n      "fields": [\n        {\n          "type": "mrkdwn",\n          "text": "*Total Discovered:*\\n{{ $json.totalUnique }} unique properties"\n        },\n        {\n          "type": "mrkdwn",\n          "text": "*Qualified Leads:*\\n{{ $json.finalCount }} properties"\n        },\n        {\n          "type": "mrkdwn",\n          "text": "*Score Range:*\\n{{ $json.properties[$json.properties.length-1]?.score }} - {{ $json.properties[0]?.score }} points"\n        },\n        {\n          "type": "mrkdwn",\n          "text": "*Market:*\\nJacksonville, FL"\n        }\n      ]\n    },\n    {\n      "type": "divider"\n    },\n    {\n      "type": "section",\n      "text": {\n        "type": "mrkdwn",\n        "text": "*🏆 All Qualified Properties:*\\n{{ $json.properties.map((p, i) => \`\${i + 1}. *\${p.address}* - \${p.score} pts | \${p.city}, \${p.state} \${p.zip}\`).join('\\\\n') }}"\n      }\n    },\n    {\n      "type": "divider"\n    },\n    {\n      "type": "context",\n      "elements": [\n        {\n          "type": "mrkdwn",\n          "text": "📅 {{ new Date().toLocaleString() }} | 🔄 Workflow: ATTOM Discovery"\n        }\n      ]\n    }\n  ]\n}`;

  console.log('✅ Updated message to show ALL properties\n');

  // Update workflow
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

  console.log('✅ Slack message updated!');
  console.log('\nNow showing:');
  console.log('  - Total unique properties discovered');
  console.log('  - All qualified properties (not just top 5)');
  console.log('  - Full address with city/state/zip for each');
  console.log('  - Numbered list for easy reference');
}

updateSlackMessage().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
