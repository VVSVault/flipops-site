/**
 * Fix Slack JSON syntax - use Code node to build tiers, then HTTP node to send
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

async function fixSlackJSON() {
  console.log('🔧 Fixing Slack JSON syntax\n');

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

  // Find Format Slack Message node
  const formatNode = workflow.nodes.find((n: any) => n.name === 'Format Slack Message');

  if (!formatNode) {
    throw new Error('Format Slack Message node not found');
  }

  console.log('✅ Found Format Slack Message node\n');

  // Change it to Code node that builds the tiered message
  formatNode.type = 'n8n-nodes-base.code';
  formatNode.typeVersion = 2;
  formatNode.parameters = {
    jsCode: `// Safety check for UI preview mode
if (!$input.all().length) {
  return [];
}

const data = $input.first().json;
const properties = data.properties || [];

// Categorize properties by score
const tier1 = properties.filter(p => p.score >= 75);
const tier2 = properties.filter(p => p.score >= 65 && p.score < 75);
const tier3 = properties.filter(p => p.score >= 55 && p.score < 65);
const tier4 = properties.filter(p => p.score < 55);

// Build blocks array
let blocks = [
  {
    type: "header",
    text: {
      type: "plain_text",
      text: "🏠 ATTOM Property Discovery Report",
      emoji: true
    }
  },
  {
    type: "section",
    fields: [
      {
        type: "mrkdwn",
        text: \`*Total Discovered:*\\n\${data.totalUnique} unique\`
      },
      {
        type: "mrkdwn",
        text: \`*Qualified:*\\n\${data.finalCount} leads\`
      },
      {
        type: "mrkdwn",
        text: \`*Score Range:*\\n\${properties[properties.length-1]?.score}-\${properties[0]?.score} pts\`
      },
      {
        type: "mrkdwn",
        text: "*Market:*\\nJacksonville, FL"
      }
    ]
  },
  { type: "divider" }
];

// Add tier 1 if exists
if (tier1.length > 0) {
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`🔥 *REACH OUT IMMEDIATELY* (75+ pts) - \${tier1.length} properties\\n\` +
        tier1.map((p, i) => \`\${i + 1}. *\${p.address}* - \${p.score} pts | \${p.city}, \${p.state}\`).join('\\n')
    }
  });
  blocks.push({ type: "divider" });
}

// Add tier 2 if exists
if (tier2.length > 0) {
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`⚡ *HIGH PRIORITY* (65-74 pts) - \${tier2.length} properties\\n\` +
        tier2.map((p, i) => \`\${i + 1}. *\${p.address}* - \${p.score} pts | \${p.city}, \${p.state}\`).join('\\n')
    }
  });
  blocks.push({ type: "divider" });
}

// Add tier 3 if exists
if (tier3.length > 0) {
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`✅ *QUALIFIED LEADS* (55-64 pts) - \${tier3.length} properties\\n\` +
        tier3.map((p, i) => \`\${i + 1}. *\${p.address}* - \${p.score} pts | \${p.city}, \${p.state}\`).join('\\n')
    }
  });
  blocks.push({ type: "divider" });
}

// Add tier 4 if exists
if (tier4.length > 0) {
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`📋 *REVIEW LATER* (50-54 pts) - \${tier4.length} properties\\n\` +
        tier4.map((p, i) => \`\${i + 1}. *\${p.address}* - \${p.score} pts | \${p.city}, \${p.state}\`).join('\\n')
    }
  });
  blocks.push({ type: "divider" });
}

// Add footer
blocks.push({
  type: "context",
  elements: [{
    type: "mrkdwn",
    text: \`📅 \${new Date().toLocaleString()} | 🔄 ATTOM Discovery\`
  }]
});

// Return the Slack message payload
return [{
  json: {
    text: \`🏠 \${data.finalCount} New Properties Discovered\`,
    blocks: blocks
  }
}];`
  };

  console.log('✅ Updated to Code node that builds proper JSON\n');

  // Now we need to add an HTTP Request node after this to send to Slack
  // First check if there's already a send node after it
  const sendNodeExists = workflow.connections['Format Slack Message']?.main?.[0]?.some(
    (conn: any) => workflow.nodes.find((n: any) => n.name === conn.node)?.type === 'n8n-nodes-base.httpRequest'
  );

  if (!sendNodeExists) {
    // Add HTTP Request node to send the message
    const sendNode = {
      parameters: {
        method: 'POST',
        url: 'https://hooks.slack.com/services/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',
        authentication: 'none',
        sendBody: true,
        contentType: 'json',
        bodyParameters: {
          parameters: []
        },
        options: {}
      },
      id: 'send-to-slack-final',
      name: 'Send to Slack',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [3320, 300]
    };

    workflow.nodes.push(sendNode);

    // Connect Format Slack Message -> Send to Slack
    workflow.connections['Format Slack Message'] = {
      main: [[{
        node: 'Send to Slack',
        type: 'main',
        index: 0
      }]]
    };

    console.log('✅ Added Send to Slack HTTP node\n');
  }

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

  console.log('✅ Slack JSON fixed!');
  console.log('Now using:');
  console.log('  1. Code node to build tiered JSON');
  console.log('  2. HTTP Request node to send to Slack');
}

fixSlackJSON().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
