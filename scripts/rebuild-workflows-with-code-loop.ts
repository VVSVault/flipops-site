/**
 * Rebuild workflows WITHOUT Loop node - use Code node to process all users at once
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

const WORKFLOWS = [
  {
    id: 'TwWfbKedznM8gPjr',
    name: 'Data Refresh & Sync',
    apiEndpoint: '/api/deals/active',
    checkField: 'count'
  },
  {
    id: 'bMguRTKgOG4fFMU2',
    name: 'G1 - Deal Approval Alert',
    apiEndpoint: '/api/deals/approve/status',
    checkField: 'summary.total'
  },
  {
    id: '8hXMk1O6SlCjbOhs',
    name: 'G2 - Bid Spread Alert',
    apiEndpoint: '/api/deals/bid-spread/status',
    checkField: 'summary.total'
  },
  {
    id: 'vvqi4QEb16A2jHbo',
    name: 'G3 - Invoice & Budget Guardian',
    apiEndpoint: '/api/deals/budget-variance/status',
    checkField: 'summary.total'
  },
  {
    id: 'WXEtnLHedF2AVFAK',
    name: 'G4 - Change Order Gatekeeper',
    apiEndpoint: '/api/deals/change-orders/status',
    checkField: 'summary.total'
  },
  {
    id: 'JiBPkO0jlvlCZfjT',
    name: 'Pipeline Monitoring',
    apiEndpoint: '/api/deals/stalled',
    checkField: 'summary.total'
  },
  {
    id: 'UlVCiQTkNNm5kvAL',
    name: 'Contractor Performance Tracking',
    apiEndpoint: '/api/contractors/performance',
    checkField: 'flaggedCount'
  }
];

async function rebuildWorkflow(workflow: typeof WORKFLOWS[0]) {
  console.log(`\n🔨 Rebuilding: ${workflow.name}`);
  console.log('='.repeat(80));

  // Create completely new workflow structure
  const nodes = [
    // 1. Schedule Trigger
    {
      id: 'schedule',
      name: 'Schedule Trigger',
      type: 'n8n-nodes-base.scheduleTrigger',
      typeVersion: 1.2,
      position: [100, 300],
      parameters: {
        rule: {
          interval: [{ field: 'hours', hoursInterval: 24 }]
        }
      }
    },

    // 2. Fetch Active Users
    {
      id: 'fetch-users',
      name: 'Fetch Active Users',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [300, 300],
      parameters: {
        method: 'GET',
        url: 'https://7fcbc4a17dba.ngrok-free.app/api/users',
        sendQuery: true,
        queryParameters: {
          parameters: [{ name: 'status', value: 'active' }]
        },
        options: {}
      }
    },

    // 3. Process All Users (Code node - NO LOOP!)
    {
      id: 'process-users',
      name: 'Process All Users',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [500, 300],
      parameters: {
        jsCode: `
// Get users from previous node
const usersResponse = $input.first().json;
const users = usersResponse.users || [];

console.log(\`Processing \${users.length} users\`);

// Process each user and make API calls
const results = [];

for (const user of users) {
  try {
    // Make API call for this user
    const response = await fetch(
      \`https://7fcbc4a17dba.ngrok-free.app${workflow.apiEndpoint}?userId=\${user.id}\`,
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      }
    );

    const data = await response.json();

    // Check if this user has violations/data
    const hasData = ${workflow.checkField.includes('.') ?
      `data.${workflow.checkField} > 0` :
      `data.${workflow.checkField} > 0`
    };

    if (hasData) {
      // Add user info and data to results
      results.push({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          slackWebhook: user.slackWebhook
        },
        data: data,
        hasViolations: true
      });

      console.log(\`User \${user.name}: Has data (\${${workflow.checkField.includes('.') ?
        `data.${workflow.checkField}` :
        `data.${workflow.checkField}`
      }} items)\`);
    } else {
      console.log(\`User \${user.name}: No data to report\`);
    }
  } catch (error) {
    console.error(\`Error processing user \${user.name}:\`, error.message);
  }
}

console.log(\`Finished processing. \${results.length} users with data to notify.\`);

// Return array of results (one item per user with data)
return results;
`
      }
    },

    // 4. Send Slack Notifications (Code node)
    {
      id: 'send-slack',
      name: 'Send Slack Notifications',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [700, 300],
      parameters: {
        jsCode: `
// Get all user results from previous node
const items = $input.all();

console.log(\`Sending notifications to \${items.length} users\`);

const results = [];

for (const item of items) {
  const { user, data } = item.json;

  if (!user.slackWebhook) {
    console.log(\`User \${user.name} has no Slack webhook - skipping\`);
    continue;
  }

  try {
    // Build Slack message based on workflow type
    const message = {
      text: \`📊 Alert for \${user.name}\`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: \`${workflow.name}\`,
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: \`*User:* \${user.name}\\n*Total Items:* \${${workflow.checkField.includes('.') ?
              `data.${workflow.checkField}` :
              `data.${workflow.checkField}`
            }}\`
          }
        }
      ]
    };

    // Send to Slack
    const response = await fetch(user.slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    if (response.ok) {
      console.log(\`✅ Sent notification to \${user.name}\`);
      results.push({ user: user.name, status: 'sent' });
    } else {
      console.log(\`❌ Failed to send to \${user.name}: \${response.status}\`);
      results.push({ user: user.name, status: 'failed', error: response.status });
    }
  } catch (error) {
    console.error(\`Error sending to \${user.name}:\`, error.message);
    results.push({ user: user.name, status: 'error', error: error.message });
  }
}

return results;
`
      }
    }
  ];

  // Simple linear connections
  const connections = {
    'Schedule Trigger': {
      main: [[{ node: 'Fetch Active Users', type: 'main', index: 0 }]]
    },
    'Fetch Active Users': {
      main: [[{ node: 'Process All Users', type: 'main', index: 0 }]]
    },
    'Process All Users': {
      main: [[{ node: 'Send Slack Notifications', type: 'main', index: 0 }]]
    }
  };

  const updatePayload = {
    name: workflow.name,
    nodes: nodes,
    connections: connections,
    settings: {}
  };

  console.log(`   Created ${nodes.length} nodes with code-based processing`);
  console.log(`   Flow: Schedule → Fetch Users → Process All (Code) → Send Slack (Code)`);

  // Update workflow
  const response = await fetch(`${N8N_BASE_URL}/workflows/${workflow.id}`, {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(updatePayload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update: ${response.status} - ${errorText}`);
  }

  console.log(`   ✅ ${workflow.name} rebuilt successfully!`);
}

async function main() {
  console.log('🚀 Rebuilding Workflows WITHOUT Loop Node\n');
  console.log('Strategy: Use Code nodes to process all users with fetch() in JavaScript');
  console.log('Benefits:');
  console.log('  ✅ No problematic Loop node');
  console.log('  ✅ All processing in 2 simple Code nodes');
  console.log('  ✅ Full control over API calls and error handling');
  console.log('  ✅ Easy to debug with console.log');
  console.log('='.repeat(80));

  for (const wf of WORKFLOWS) {
    try {
      await rebuildWorkflow(wf);
    } catch (error: any) {
      console.error(`\n   ❌ Failed: ${wf.name} - ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ ALL WORKFLOWS REBUILT');
  console.log('='.repeat(80));
  console.log('\n📋 New Structure (all workflows):');
  console.log('   1. Schedule Trigger');
  console.log('   2. Fetch Active Users (HTTP)');
  console.log('   3. Process All Users (Code - fetches data for each user)');
  console.log('   4. Send Slack Notifications (Code - sends to each user)');
  console.log('\n🧪 Test now - no more loop issues!\n');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
