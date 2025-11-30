#!/bin/bash

# ATTOM workflow ID
WORKFLOW_ID="ORNrSAWVXWeNqAb4"
N8N_BASE_URL="https://primary-production-8b46.up.railway.app"
N8N_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8"

echo "🔧 Fetching ATTOM workflow..."

# Get the workflow
curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Accept: application/json" \
  "$N8N_BASE_URL/api/v1/workflows/$WORKFLOW_ID" \
  -o attom-workflow.json

echo "✅ Workflow fetched, updating Slack node..."

# Use Node.js to modify the JSON
node << 'EOF'
const fs = require('fs');
const workflow = JSON.parse(fs.readFileSync('attom-workflow.json', 'utf8'));

// Find the Slack node
const slackNode = workflow.nodes.find(n =>
  n.id === 'send-slack' || n.name.toLowerCase().includes('slack')
);

if (!slackNode) {
  console.error('❌ Could not find Slack node');
  process.exit(1);
}

console.log(`✅ Found Slack node: "${slackNode.name}"`);

// Update the node
slackNode.parameters.url = 'https://hooks.slack.com/services/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';
slackNode.parameters.sendHeaders = true;
slackNode.parameters.headerParameters = {
  parameters: [{
    name: 'Content-Type',
    value: 'application/json'
  }]
};
slackNode.parameters.sendBody = true;
slackNode.parameters.specifyBody = 'json';
slackNode.parameters.jsonBody = '={\n  "text": "🏠 *New Properties Found!*",\n  "blocks": [\n    {\n      "type": "header",\n      "text": {\n        "type": "plain_text",\n        "text": "🏠 New High-Score Properties Discovered",\n        "emoji": true\n      }\n    },\n    {\n      "type": "section",\n      "fields": [\n        {\n          "type": "mrkdwn",\n          "text": "*Total Unique:*\\n{{ $json.totalUnique }} properties"\n        },\n        {\n          "type": "mrkdwn",\n          "text": "*After Daily Limit:*\\n{{ $json.finalCount }} properties"\n        },\n        {\n          "type": "mrkdwn",\n          "text": "*Score Range:*\\n{{ $json.properties[0]?.score }}-{{ $json.properties[$json.properties.length-1]?.score }} pts"\n        },\n        {\n          "type": "mrkdwn",\n          "text": "*Workflow:*\\nATTOM Discovery"\n        }\n      ]\n    },\n    {\n      "type": "section",\n      "text": {\n        "type": "mrkdwn",\n        "text": "*Top 5 Properties:*\\n{{ $json.properties.slice(0, 5).map(p => `• ${p.address} - ${p.score} pts`).join(\'\\\\n\') }}"\n      }\n    },\n    {\n      "type": "divider"\n    },\n    {\n      "type": "context",\n      "elements": [\n        {\n          "type": "mrkdwn",\n          "text": "📅 {{ new Date().toLocaleString() }}"\n        }\n      ]\n    }\n  ]\n}';

fs.writeFileSync('attom-workflow-updated.json', JSON.stringify(workflow, null, 2));
console.log('✅ Node configuration updated');
EOF

echo "🚀 Uploading updated workflow to n8n..."

# Upload the updated workflow
curl -X PUT \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  --data @attom-workflow-updated.json \
  "$N8N_BASE_URL/api/v1/workflows/$WORKFLOW_ID"

echo ""
echo "✅ Slack node updated successfully!"
echo ""
echo "Clean up temporary files..."
rm attom-workflow.json attom-workflow-updated.json

echo "✅ Done! Your ATTOM workflow Slack node is now fixed."
EOF
chmod +x flipops-site/scripts/update-attom-slack.sh
