/**
 * Fix the Code nodes to properly output items in n8n format
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

const WORKFLOWS = [
  {
    id: 'TwWfbKedznM8gPjr',
    name: 'Data Refresh & Sync',
    apiEndpoint: '/api/deals/active',
    dataField: 'deals'
  },
  {
    id: 'bMguRTKgOG4fFMU2',
    name: 'G1 - Deal Approval Alert',
    apiEndpoint: '/api/deals/approve/status',
    dataField: 'blockedDeals'
  },
  {
    id: '8hXMk1O6SlCjbOhs',
    name: 'G2 - Bid Spread Alert',
    apiEndpoint: '/api/deals/bid-spread/status',
    dataField: 'violations'
  },
  {
    id: 'vvqi4QEb16A2jHbo',
    name: 'G3 - Invoice & Budget Guardian',
    apiEndpoint: '/api/deals/budget-variance/status',
    dataField: 'violations'
  },
  {
    id: 'WXEtnLHedF2AVFAK',
    name: 'G4 - Change Order Gatekeeper',
    apiEndpoint: '/api/deals/change-orders/status',
    dataField: 'pendingApprovals'
  },
  {
    id: 'JiBPkO0jlvlCZfjT',
    name: 'Pipeline Monitoring',
    apiEndpoint: '/api/deals/stalled',
    dataField: 'stalledDeals'
  },
  {
    id: 'UlVCiQTkNNm5kvAL',
    name: 'Contractor Performance Tracking',
    apiEndpoint: '/api/contractors/performance',
    dataField: 'contractors'
  }
];

async function fixWorkflow(wf: typeof WORKFLOWS[0]) {
  console.log(`\n🔧 Fixing: ${wf.name}`);

  const response = await fetch(`${N8N_BASE_URL}/workflows/${wf.id}`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json'
    }
  });

  const workflow = await response.json();

  // Find the Process All Users node
  const processNode = workflow.nodes.find((n: any) => n.name === 'Process All Users');
  if (!processNode) {
    console.log('   ❌ Process All Users node not found');
    return;
  }

  // Update the code to properly return n8n items
  processNode.parameters.jsCode = `
// Get users from previous node
const usersResponse = $input.first().json;
const users = usersResponse.users || [];

console.log(\`Processing \${users.length} users\`);

// Process each user and make API calls
const results = [];

for (const user of users) {
  try {
    console.log(\`Fetching data for user: \${user.name} (ID: \${user.id})\`);

    // Make API call for this user
    const response = await fetch(
      \`https://7fcbc4a17dba.ngrok-free.app${wf.apiEndpoint}?userId=\${user.id}\`,
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      }
    );

    if (!response.ok) {
      console.log(\`API returned \${response.status} for user \${user.name}\`);
      continue;
    }

    const data = await response.json();

    // Check if this user has data
    const items = data.${wf.dataField} || [];
    const count = Array.isArray(items) ? items.length : (data.count || 0);

    console.log(\`User \${user.name}: \${count} items\`);

    if (count > 0) {
      // Add result for this user
      results.push({
        json: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            slackWebhook: user.slackWebhook,
            companyName: user.companyName
          },
          data: data,
          itemCount: count
        }
      });
    }
  } catch (error) {
    console.error(\`Error processing user \${user.name}:\`, error.message);
  }
}

console.log(\`Finished. \${results.length} users with data to notify.\`);

// Return n8n items format
return results;
`;

  console.log('   ✅ Updated Process All Users code');

  // Find and update Send Slack node
  const slackNode = workflow.nodes.find((n: any) => n.name === 'Send Slack Notifications');
  if (slackNode) {
    slackNode.parameters.jsCode = `
// Get all user results from previous node
const items = $input.all();

console.log(\`Sending notifications to \${items.length} users\`);

const results = [];

for (const item of items) {
  const { user, data, itemCount } = item.json;

  if (!user.slackWebhook) {
    console.log(\`User \${user.name} has no Slack webhook - skipping\`);
    continue;
  }

  try {
    // Build Slack message
    const userHeader = user.companyName ? \`\${user.name} (\${user.companyName})\` : user.name;

    const message = {
      text: \`📊 \${itemCount} items for \${user.name}\`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "${wf.name}",
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: \`*\${userHeader}*\\n\\n📊 *Total Items:* \${itemCount}\`
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

    console.log(\`Sending to \${user.name}: \${itemCount} items\`);

    // Send to Slack
    const response = await fetch(user.slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    if (response.ok) {
      console.log(\`✅ Sent notification to \${user.name}\`);
      results.push({
        json: {
          user: user.name,
          status: 'sent',
          itemCount: itemCount
        }
      });
    } else {
      const errorText = await response.text();
      console.log(\`❌ Failed to send to \${user.name}: \${response.status} - \${errorText}\`);
      results.push({
        json: {
          user: user.name,
          status: 'failed',
          error: response.status
        }
      });
    }
  } catch (error) {
    console.error(\`Error sending to \${user.name}:\`, error.message);
    results.push({
      json: {
        user: user.name,
        status: 'error',
        error: error.message
      }
    });
  }
}

console.log(\`Sent \${results.filter(r => r.json.status === 'sent').length} of \${results.length} notifications\`);

return results;
`;

    console.log('   ✅ Updated Send Slack Notifications code');
  }

  // Save workflow
  const updatePayload = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings || {}
  };

  const updateResponse = await fetch(`${N8N_BASE_URL}/workflows/${wf.id}`, {
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
    throw new Error(`Failed to update: ${updateResponse.status} - ${errorText}`);
  }

  console.log(`   ✅ ${wf.name} fixed successfully!`);
}

async function main() {
  console.log('🔧 Fixing Code Node Output Format\n');
  console.log('Changes:');
  console.log('  1. Return items in proper n8n format: [{ json: {...} }]');
  console.log('  2. Add detailed console.log for debugging');
  console.log('  3. Proper error handling');
  console.log('  4. Extract correct data fields from API responses');
  console.log('='.repeat(80));

  for (const wf of WORKFLOWS) {
    try {
      await fixWorkflow(wf);
    } catch (error: any) {
      console.error(`\n   ❌ Failed: ${wf.name} - ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ ALL WORKFLOWS FIXED');
  console.log('='.repeat(80));
  console.log('\n🧪 Test now - you should see output from Process All Users node!\n');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
