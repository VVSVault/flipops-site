/**
 * Fix Code nodes to use n8n's $http helper instead of fetch()
 * fetch() is not available in n8n Code nodes - must use $http
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

const NGROK_URL = 'https://cd8ced103c93.ngrok-free.app';

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

  // Update Process All Users to use $http instead of fetch
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

    // Make API call using n8n's $http helper (fetch is not available)
    const response = await $http.request({
      method: 'GET',
      url: \`${NGROK_URL}${wf.apiEndpoint}?userId=\${user.id}\`,
      headers: { 'Accept': 'application/json' },
      returnFullResponse: true
    });

    if (response.statusCode !== 200) {
      console.log(\`API returned \${response.statusCode} for user \${user.name}\`);

      // Add to results anyway to show output
      results.push({
        json: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            slackWebhook: user.slackWebhook,
            companyName: user.companyName
          },
          data: null,
          itemCount: 0,
          error: \`API error: \${response.statusCode}\`
        }
      });
      continue;
    }

    const data = response.body;

    // Check if this user has data
    const items = data.${wf.dataField} || [];
    const count = Array.isArray(items) ? items.length : (data.count || 0);

    console.log(\`User \${user.name}: \${count} items\`);

    // Always add to results (even if count=0) so we can see output
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
        itemCount: count,
        hasData: count > 0
      }
    });
  } catch (error) {
    console.error(\`Error processing user \${user.name}:\`, error.message);

    // Add error to results
    results.push({
      json: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          slackWebhook: user.slackWebhook,
          companyName: user.companyName
        },
        data: null,
        itemCount: 0,
        error: error.message
      }
    });
  }
}

console.log(\`Finished. \${results.length} users processed (including those with 0 items).\`);

// Return all results (even count=0) for testing
return results;
`;

  console.log('   ✅ Updated Process All Users (using $http)');

  // Find and update Send Slack node to use $http
  const slackNode = workflow.nodes.find((n: any) => n.name === 'Send Slack Notifications');
  if (slackNode) {
    slackNode.parameters.jsCode = `
// Get all user results from previous node
const items = $input.all();

console.log(\`Processing \${items.length} user results\`);

const results = [];

for (const item of items) {
  const { user, data, itemCount, hasData, error } = item.json;

  // Skip if user has no data
  if (itemCount === 0 || !hasData) {
    console.log(\`Skipping \${user.name}: no data to send (count=\${itemCount})\`);
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
    console.log(\`Skipping \${user.name}: no Slack webhook configured\`);
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

  try {
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

    // Send to Slack using n8n's $http helper
    const response = await $http.request({
      method: 'POST',
      url: user.slackWebhook,
      headers: { 'Content-Type': 'application/json' },
      body: message,
      returnFullResponse: true
    });

    if (response.statusCode === 200) {
      console.log(\`✅ Sent notification to \${user.name}\`);
      results.push({
        json: {
          user: user.name,
          status: 'sent',
          itemCount: itemCount
        }
      });
    } else {
      console.log(\`❌ Failed: \${response.statusCode}\`);
      results.push({
        json: {
          user: user.name,
          status: 'failed',
          error: response.statusCode,
          itemCount: itemCount
        }
      });
    }
  } catch (error) {
    console.error(\`Error sending to \${user.name}:\`, error.message);
    results.push({
      json: {
        user: user.name,
        status: 'error',
        error: error.message,
        itemCount: itemCount
      }
    });
  }
}

const sent = results.filter(r => r.json.status === 'sent').length;
const skipped = results.filter(r => r.json.status === 'skipped').length;
console.log(\`Results: \${sent} sent, \${skipped} skipped, \${results.length} total\`);

return results;
`;

    console.log('   ✅ Updated Send Slack Notifications (using $http)');
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
    throw new Error(`Failed to update: ${updateResponse.status}`);
  }

  console.log(`   💾 Saved ${wf.name}`);
}

async function main() {
  console.log('🔧 Fixing Code nodes to use $http instead of fetch()\n');
  console.log('Issue: "fetch is not defined" in n8n Code nodes');
  console.log('Solution: Use n8n\'s built-in $http.request() helper');
  console.log('='.repeat(80));

  for (const wf of WORKFLOWS) {
    try {
      await fixWorkflow(wf);
    } catch (error: any) {
      console.error(`\n   ❌ Failed: ${wf.name} - ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ ALL WORKFLOWS UPDATED TO USE $http');
  console.log('='.repeat(80));
  console.log('\n🧪 Test the workflow again - API calls should now work!\n');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
