/**
 * Rebuild Data Refresh workflow using HTTP Request nodes instead of Code nodes for API calls
 * Code nodes in n8n don't have fetch() or $http - must use HTTP Request nodes
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

const NGROK_URL = 'https://cd8ced103c93.ngrok-free.app';
const WORKFLOW_ID = 'TwWfbKedznM8gPjr'; // Data Refresh & Sync

async function rebuild() {
  console.log('🔧 Rebuilding Data Refresh & Sync workflow\n');
  console.log('New architecture:');
  console.log('  1. Schedule Trigger');
  console.log('  2. Fetch Active Users (HTTP Request)');
  console.log('  3. Split Out (Split Out node) - splits users into separate items');
  console.log('  4. Fetch User Data (HTTP Request) - uses {{ $json.id }} for userId');
  console.log('  5. Filter Has Data (IF node) - only pass items with count > 0');
  console.log('  6. Send Slack (HTTP Request) - uses {{ $json.user.slackWebhook }}');
  console.log('='.repeat(80));

  const nodes = [
    // 1. Schedule Trigger
    {
      id: 'schedule-trigger',
      name: 'Schedule Trigger',
      type: 'n8n-nodes-base.scheduleTrigger',
      position: [240, 300],
      parameters: {
        rule: {
          interval: [
            {
              field: 'hours',
              hoursInterval: 24
            }
          ]
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
          parameters: [
            {
              name: 'status',
              value: 'active'
            }
          ]
        },
        options: {}
      },
      typeVersion: 4.2
    },

    // 3. Split Out - converts users array to separate items
    {
      id: 'split-out',
      name: 'Split Out Users',
      type: 'n8n-nodes-base.splitOut',
      position: [680, 300],
      parameters: {
        fieldToSplitOut: 'users',
        options: {}
      },
      typeVersion: 1
    },

    // 4. Fetch User Data - makes API call for EACH user
    {
      id: 'fetch-data',
      name: 'Fetch User Data',
      type: 'n8n-nodes-base.httpRequest',
      position: [900, 300],
      parameters: {
        url: `${NGROK_URL}/api/deals/active`,
        method: 'GET',
        sendQuery: true,
        queryParameters: {
          parameters: [
            {
              name: 'userId',
              value: '={{ $json.id }}'
            }
          ]
        },
        options: {
          response: {
            response: {
              fullResponse: false,
              responseFormat: 'json'
            }
          }
        }
      },
      typeVersion: 4.2
    },

    // 5. Merge User + Data - combine user info with their data
    {
      id: 'merge-data',
      name: 'Merge User + Data',
      type: 'n8n-nodes-base.code',
      position: [1120, 300],
      parameters: {
        jsCode: `// Get user from first input (Split Out) and data from second input (Fetch User Data)
const user = $('Split Out Users').item.json;
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

    // 6. Filter - only items with data
    {
      id: 'filter',
      name: 'Filter Has Data',
      type: 'n8n-nodes-base.if',
      position: [1340, 300],
      parameters: {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: '',
            typeValidation: 'strict'
          },
          conditions: [
            {
              leftValue: '={{ $json.itemCount }}',
              rightValue: 0,
              operator: {
                type: 'number',
                operation: 'gt'
              }
            },
            {
              leftValue: '={{ $json.user.slackWebhook }}',
              rightValue: '',
              operator: {
                type: 'string',
                operation: 'notEmpty'
              }
            }
          ],
          combinator: 'and'
        },
        options: {}
      },
      typeVersion: 2
    },

    // 7. Send Slack
    {
      id: 'send-slack',
      name: 'Send Slack',
      type: 'n8n-nodes-base.httpRequest',
      position: [1560, 200],
      parameters: {
        url: '={{ $json.user.slackWebhook }}',
        method: 'POST',
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
        jsonBody: `={
  "text": "📊 " + $json.itemCount + " active deals for " + $json.user.name,
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Data Refresh & Sync",
        "emoji": true
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*" + $json.user.name + "*\\n\\n📊 *Active Deals:* " + $json.itemCount
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "Generated: " + new Date().toLocaleString()
        }
      ]
    }
  ]
}`,
        options: {}
      },
      typeVersion: 4.2
    }
  ];

  // Connections
  const connections = {
    'Schedule Trigger': {
      main: [[{ node: 'Fetch Active Users', type: 'main', index: 0 }]]
    },
    'Fetch Active Users': {
      main: [[{ node: 'Split Out Users', type: 'main', index: 0 }]]
    },
    'Split Out Users': {
      main: [[{ node: 'Fetch User Data', type: 'main', index: 0 }]]
    },
    'Fetch User Data': {
      main: [[{ node: 'Merge User + Data', type: 'main', index: 0 }]]
    },
    'Merge User + Data': {
      main: [[{ node: 'Filter Has Data', type: 'main', index: 0 }]]
    },
    'Filter Has Data': {
      main: [
        [{ node: 'Send Slack', type: 'main', index: 0 }], // true branch
        [] // false branch (no action)
      ]
    }
  };

  // Update workflow
  const updatePayload = {
    name: 'Data Refresh & Sync',
    nodes: nodes,
    connections: connections,
    settings: {
      executionOrder: 'v1'
    }
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
    throw new Error(`Failed to update: ${response.status} - ${error}`);
  }

  console.log('\n✅ Workflow rebuilt successfully!');
  console.log('\nNew flow:');
  console.log('  Schedule → Fetch Users → Split → Fetch Data (per user) → Merge → Filter → Slack');
  console.log('\nThis uses HTTP Request nodes (not Code) for all API calls.');
  console.log('Each user is processed as a separate item through the workflow.');
}

rebuild().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
