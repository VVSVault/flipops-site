/**
 * Rebuild workflow WITHOUT any Loop/Split In Batches node
 * Use a single Code node to process all users sequentially
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

const NGROK_URL = 'https://cd8ced103c93.ngrok-free.app';
const WORKFLOW_ID = 'TwWfbKedznM8gPjr'; // Data Refresh & Sync

async function rebuild() {
  console.log('🔧 Rebuilding workflow - NO LOOP NODE!\n');
  console.log('Architecture:');
  console.log('  1. Schedule Trigger');
  console.log('  2. Fetch Active Users (HTTP Request)');
  console.log('  3. Process All Users & Send Slack (Code Node) ← ALL IN ONE!');
  console.log('='.repeat(80));

  const nodes = [
    // 1. Schedule Trigger
    {
      id: 'schedule',
      name: 'Schedule Trigger',
      type: 'n8n-nodes-base.scheduleTrigger',
      position: [240, 300],
      parameters: {
        rule: {
          interval: [{ field: 'hours', hoursInterval: 24 }]
        }
      },
      typeVersion: 1.2
    },

    // 2. Fetch Active Users
    {
      id: 'fetch-users',
      name: 'Fetch Active Users',
      type: 'n8n-nodes-base.httpRequest',
      position: [460, 300],
      parameters: {
        url: `${NGROK_URL}/api/users`,
        method: 'GET',
        sendQuery: true,
        queryParameters: {
          parameters: [{ name: 'status', value: 'active' }]
        },
        options: {}
      },
      typeVersion: 4.2
    },

    // 3. Process All Users & Send Slack (single Code node)
    {
      id: 'process-all',
      name: 'Process All Users & Send Slack',
      type: 'n8n-nodes-base.httpRequest',
      position: [680, 300],
      parameters: {
        method: 'POST',
        url: '={{ $json.user.slackWebhook }}',
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'Content-Type', value: 'application/json' }
          ]
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ $json.slackMessage }}',
        options: {
          batching: {
            batch: {
              batchSize: 1,
              batchInterval: 1000
            }
          }
        }
      },
      typeVersion: 4.2
    }
  ];

  // Wait, that won't work either. Let me use a proper Code node approach:

  const betterNodes = [
    // 1. Schedule Trigger
    {
      id: 'schedule',
      name: 'Schedule Trigger',
      type: 'n8n-nodes-base.scheduleTrigger',
      position: [240, 300],
      parameters: {
        rule: {
          interval: [{ field: 'hours', hoursInterval: 24 }]
        }
      },
      typeVersion: 1.2
    },

    // 2. Process Everything (Code node does it all)
    {
      id: 'process-all',
      name: 'Process All Users & Send Slack',
      type: 'n8n-nodes-base.code',
      position: [460, 300],
      parameters: {
        mode: 'runOnceForAllItems',
        jsCode: `// Fetch active users
const usersResponse = await this.helpers.httpRequest({
  method: 'GET',
  url: '${NGROK_URL}/api/users?status=active',
  json: true
});

const users = usersResponse.users || [];
console.log(\`Found \${users.length} active users\`);

const results = [];

// Process each user sequentially
for (const user of users) {
  try {
    console.log(\`Processing user: \${user.name} (ID: \${user.id})\`);

    // Fetch data for this user
    const dataResponse = await this.helpers.httpRequest({
      method: 'GET',
      url: '${NGROK_URL}/api/deals/active?userId=' + user.id,
      json: true
    });

    const itemCount = dataResponse.count || 0;
    console.log(\`  User \${user.name}: \${itemCount} active deals\`);

    // Skip if no data or no webhook
    if (itemCount === 0) {
      console.log(\`  Skipping \${user.name}: no data\`);
      results.push({
        json: {
          user: user.name,
          status: 'skipped',
          reason: 'no_data',
          itemCount: itemCount
        }
      });
      continue;
    }

    if (!user.slackWebhook) {
      console.log(\`  Skipping \${user.name}: no webhook\`);
      results.push({
        json: {
          user: user.name,
          status: 'skipped',
          reason: 'no_webhook',
          itemCount: itemCount
        }
      });
      continue;
    }

    // Send Slack notification
    const slackMessage = {
      text: \`📊 \${itemCount} active deals for \${user.name}\`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Data Refresh & Sync",
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: \`*\${user.name}\${user.companyName ? ' (' + user.companyName + ')' : ''}*\\n\\n📊 *Active Deals:* \${itemCount}\`
          }
        },
        {
          type: "divider"
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: \`Generated: \${new Date().toLocaleString()}\`
            }
          ]
        }
      ]
    };

    console.log(\`  Sending Slack notification to \${user.name}\`);

    const slackResponse = await this.helpers.httpRequest({
      method: 'POST',
      url: user.slackWebhook,
      headers: {
        'Content-Type': 'application/json'
      },
      body: slackMessage,
      json: true
    });

    console.log(\`  ✅ Sent notification to \${user.name}\`);
    results.push({
      json: {
        user: user.name,
        status: 'sent',
        itemCount: itemCount
      }
    });

  } catch (error) {
    console.error(\`  ❌ Error processing \${user.name}:\`, error.message);
    results.push({
      json: {
        user: user.name,
        status: 'error',
        error: error.message
      }
    });
  }
}

const sent = results.filter(r => r.json.status === 'sent').length;
const skipped = results.filter(r => r.json.status === 'skipped').length;
console.log(\`\\nSummary: \${sent} sent, \${skipped} skipped, \${results.length} total\`);

return results;`
      },
      typeVersion: 2
    }
  ];

  const connections = {
    'Schedule Trigger': {
      main: [[{ node: 'Process All Users & Send Slack', type: 'main', index: 0 }]]
    }
  };

  const updatePayload = {
    name: 'Data Refresh & Sync',
    nodes: betterNodes,
    connections: connections,
    settings: { executionOrder: 'v1' }
  };

  const response = await fetch(`${N8N_BASE_URL}/workflows/${WORKFLOW_ID}`, {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(updatePayload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed: ${response.status} - ${error}`);
  }

  console.log('\n✅ Workflow rebuilt!');
  console.log('\n🎯 New architecture:');
  console.log('  - Just 2 nodes: Schedule + Code');
  console.log('  - Code node uses this.helpers.httpRequest()');
  console.log('  - Processes users sequentially in a simple for loop');
  console.log('  - No Loop node, no Split node - just pure code!');
}

rebuild().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
