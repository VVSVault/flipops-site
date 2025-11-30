/**
 * Update Slack message to categorize properties by score tier
 * with actionable categories
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

async function updateSlackWithTiers() {
  console.log('🔧 Adding property score tiers to Slack message\n');

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

  // Update with tiered categorization
  slackNode.parameters.jsonBody = `={\n  "text": "🏠 {{ $json.finalCount }} New Properties Discovered",\n  "blocks": [\n    {\n      "type": "header",\n      "text": {\n        "type": "plain_text",\n        "text": "🏠 ATTOM Property Discovery Report",\n        "emoji": true\n      }\n    },\n    {\n      "type": "section",\n      "fields": [\n        {\n          "type": "mrkdwn",\n          "text": "*Total Discovered:*\\n{{ $json.totalUnique }} unique"\n        },\n        {\n          "type": "mrkdwn",\n          "text": "*Qualified:*\\n{{ $json.finalCount }} leads"\n        },\n        {\n          "type": "mrkdwn",\n          "text": "*Score Range:*\\n{{ $json.properties[$json.properties.length-1]?.score }}-{{ $json.properties[0]?.score }} pts"\n        },\n        {\n          "type": "mrkdwn",\n          "text": "*Market:*\\nJacksonville, FL"\n        }\n      ]\n    },\n    {\n      "type": "divider"\n    },\n    {{ (() => {\n      const props = $json.properties || [];\n      const tier1 = props.filter(p => p.score >= 75);\n      const tier2 = props.filter(p => p.score >= 65 && p.score < 75);\n      const tier3 = props.filter(p => p.score >= 55 && p.score < 65);\n      const tier4 = props.filter(p => p.score < 55);\n      \n      let blocks = [];\n      \n      if (tier1.length > 0) {\n        blocks.push({\n          "type": "section",\n          "text": {\n            "type": "mrkdwn",\n            "text": \`🔥 *REACH OUT IMMEDIATELY* (75+ pts) - \${tier1.length} properties\\\\n\` + tier1.map((p, i) => \`\${i + 1}. *\${p.address}* - \${p.score} pts | \${p.city}, \${p.state}\`).join('\\\\n')\n          }\n        });\n        blocks.push({"type": "divider"});\n      }\n      \n      if (tier2.length > 0) {\n        blocks.push({\n          "type": "section",\n          "text": {\n            "type": "mrkdwn",\n            "text": \`⚡ *HIGH PRIORITY* (65-74 pts) - \${tier2.length} properties\\\\n\` + tier2.map((p, i) => \`\${i + 1}. *\${p.address}* - \${p.score} pts | \${p.city}, \${p.state}\`).join('\\\\n')\n          }\n        });\n        blocks.push({"type": "divider"});\n      }\n      \n      if (tier3.length > 0) {\n        blocks.push({\n          "type": "section",\n          "text": {\n            "type": "mrkdwn",\n            "text": \`✅ *QUALIFIED LEADS* (55-64 pts) - \${tier3.length} properties\\\\n\` + tier3.map((p, i) => \`\${i + 1}. *\${p.address}* - \${p.score} pts | \${p.city}, \${p.state}\`).join('\\\\n')\n          }\n        });\n        blocks.push({"type": "divider"});\n      }\n      \n      if (tier4.length > 0) {\n        blocks.push({\n          "type": "section",\n          "text": {\n            "type": "mrkdwn",\n            "text": \`📋 *REVIEW LATER* (50-54 pts) - \${tier4.length} properties\\\\n\` + tier4.map((p, i) => \`\${i + 1}. *\${p.address}* - \${p.score} pts | \${p.city}, \${p.state}\`).join('\\\\n')\n          }\n        });\n        blocks.push({"type": "divider"});\n      }\n      \n      return JSON.stringify(blocks).slice(1, -1);\n    })() }}\n    {\n      "type": "context",\n      "elements": [\n        {\n          "type": "mrkdwn",\n          "text": "📅 {{ new Date().toLocaleString() }} | 🔄 ATTOM Discovery"\n        }\n      ]\n    }\n  ]\n}`;

  console.log('✅ Updated with tiered categories:\n');
  console.log('   🔥 REACH OUT IMMEDIATELY (75+ pts)');
  console.log('   ⚡ HIGH PRIORITY (65-74 pts)');
  console.log('   ✅ QUALIFIED LEADS (55-64 pts)');
  console.log('   📋 REVIEW LATER (50-54 pts)\n');

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

  console.log('✅ Slack message updated with actionable tiers!');
}

updateSlackWithTiers().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
