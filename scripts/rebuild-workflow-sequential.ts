/**
 * Rebuild workflow to process users SEQUENTIALLY (one at a time)
 * This avoids Prisma connection crashes from concurrent requests
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

const NGROK_URL = 'https://cd8ced103c93.ngrok-free.app';
const WORKFLOW_ID = 'TwWfbKedznM8gPjr'; // Data Refresh & Sync

async function rebuild() {
  console.log('🔧 Rebuilding workflow for SEQUENTIAL processing\n');
  console.log('Architecture:');
  console.log('  1. Schedule Trigger');
  console.log('  2. Fetch Active Users');
  console.log('  3. Loop (Split In Batches - batch size 1) ← SEQUENTIAL!');
  console.log('  4. Fetch User Data');
  console.log('  5. IF has data → Send Slack');
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

    // 3. Loop Through Users (batch size 1 = sequential)
    {
      id: 'loop',
      name: 'Loop Through Users',
      type: 'n8n-nodes-base.splitInBatches',
      position: [680, 300],
      parameters: {
        batchSize: 1,  // Process ONE user at a time
        options: {
          reset: false
        }
      },
      typeVersion: 3
    },

    // 4. Extract User
    {
      id: 'extract',
      name: 'Extract User',
      type: 'n8n-nodes-base.code',
      position: [900, 300],
      parameters: {
        jsCode: `// Get the users array and current batch index
const response = $('Fetch Active Users').first().json;
const users = response.users || [];
const batchIndex = $('Loop Through Users').context.noItemsLeft ? 0 : ($('Loop Through Users').context.currentRunIndex || 0);

if (batchIndex >= users.length) {
  return [];
}

const user = users[batchIndex];

return {
  json: user
};`
      },
      typeVersion: 2
    },

    // 5. Fetch User Data
    {
      id: 'fetch-data',
      name: 'Fetch User Data',
      type: 'n8n-nodes-base.httpRequest',
      position: [1120, 300],
      parameters: {
        url: `${NGROK_URL}/api/deals/active`,
        method: 'GET',
        sendQuery: true,
        queryParameters: {
          parameters: [
            { name: 'userId', value: '={{ $json.id }}' }
          ]
        },
        options: {}
      },
      typeVersion: 4.2
    },

    // 6. Merge User + Data
    {
      id: 'merge',
      name: 'Merge User + Data',
      type: 'n8n-nodes-base.code',
      position: [1340, 300],
      parameters: {
        jsCode: `const user = $('Extract User').first().json;
const apiData = $json;

return {
  json: {
    user: user,
    data: apiData,
    itemCount: apiData.count || 0,
    hasData: (apiData.count || 0) > 0
  }
};`
      },
      typeVersion: 2
    },

    // 7. IF has data + webhook
    {
      id: 'filter',
      name: 'Has Data?',
      type: 'n8n-nodes-base.if',
      position: [1560, 300],
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
          conditions: [
            {
              leftValue: '={{ $json.itemCount }}',
              rightValue: 0,
              operator: { type: 'number', operation: 'gt' }
            },
            {
              leftValue: '={{ $json.user.slackWebhook }}',
              rightValue: '',
              operator: { type: 'string', operation: 'notEmpty' }
            }
          ],
          combinator: 'and'
        },
        options: {}
      },
      typeVersion: 2
    },

    // 8. Send Slack (true branch)
    {
      id: 'slack',
      name: 'Send Slack',
      type: 'n8n-nodes-base.httpRequest',
      position: [1780, 200],
      parameters: {
        url: '={{ $json.user.slackWebhook }}',
        method: 'POST',
        sendHeaders: true,
        headerParameters: {
          parameters: [{ name: 'Content-Type', value: 'application/json' }]
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={
  "text": "📊 " + $json.itemCount + " active deals",
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": "Data Refresh & Sync", "emoji": true }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*" + $json.user.name + "*\\n\\n📊 *Active Deals:* " + $json.itemCount
      }
    },
    { "type": "divider" },
    {
      "type": "context",
      "elements": [
        { "type": "mrkdwn", "text": "Generated: " + new Date().toLocaleString() }
      ]
    }
  ]
}`,
        options: {}
      },
      typeVersion: 4.2
    }
  ];

  const connections = {
    'Schedule Trigger': {
      main: [[{ node: 'Fetch Active Users', type: 'main', index: 0 }]]
    },
    'Fetch Active Users': {
      main: [[{ node: 'Loop Through Users', type: 'main', index: 0 }]]
    },
    'Loop Through Users': {
      main: [
        [{ node: 'Extract User', type: 'main', index: 0 }], // First output
        [] // Second output (loop done)
      ]
    },
    'Extract User': {
      main: [[{ node: 'Fetch User Data', type: 'main', index: 0 }]]
    },
    'Fetch User Data': {
      main: [[{ node: 'Merge User + Data', type: 'main', index: 0 }]]
    },
    'Merge User + Data': {
      main: [[{ node: 'Has Data?', type: 'main', index: 0 }]]
    },
    'Has Data?': {
      main: [
        [{ node: 'Send Slack', type: 'main', index: 0 }], // true
        [{ node: 'Loop Through Users', type: 'main', index: 0 }] // false - back to loop
      ]
    },
    'Send Slack': {
      main: [[{ node: 'Loop Through Users', type: 'main', index: 0 }]] // Back to loop
    }
  };

  const updatePayload = {
    name: 'Data Refresh & Sync',
    nodes: nodes,
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
  console.log('\nKey change: Split In Batches with batch size 1');
  console.log('This processes users ONE AT A TIME (sequential)');
  console.log('Avoids Prisma crashes from concurrent connections.');
}

rebuild().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
