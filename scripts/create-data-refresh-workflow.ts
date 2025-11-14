const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const LOCAL_API_URL = 'https://d5c3cffd305d.ngrok-free.app';
const SLACK_WEBHOOK = 'https://hooks.slack.com/services/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';

async function createDataRefreshWorkflow() {
  console.log('📋 Creating Data Refresh & Sync workflow...\n');

  try {

    const workflow = {
      name: 'Data Refresh & Sync',
      nodes: [
        // 1. Schedule Trigger
        {
          parameters: {
            rule: {
              interval: [{
                field: 'hours',
                hoursInterval: 6,
              }],
            },
          },
          id: 'schedule-trigger',
          name: 'Schedule Trigger',
          type: 'n8n-nodes-base.scheduleTrigger',
          typeVersion: 1.2,
          position: [240, 300],
        },

        // 2. Fetch Active Deals
        {
          parameters: {
            method: 'GET',
            url: `${LOCAL_API_URL}/api/deals/active`,
            authentication: 'none',
            options: {
              headers: {
                'ngrok-skip-browser-warning': 'true',
              },
            },
          },
          id: 'fetch-active-deals',
          name: 'Fetch Active Deals',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 4.2,
          position: [460, 300],
        },

        // 3. Extract Deal IDs
        {
          parameters: {
            jsCode: `const response = $input.first().json;
const deals = response.deals || [];
const dealData = deals.map(deal => ({
  dealId: deal.id,
  address: deal.address,
  lastUpdated: deal.updatedAt,
  totalDeals: deals.length,
}));
console.log(\`Found \${dealData.length} active deals to sync\`);
return dealData.map(d => ({ json: d }));`,
          },
          id: 'extract-deal-ids',
          name: 'Extract Deal IDs',
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [680, 300],
        },

        // 4. Check if Any Deals
        {
          parameters: {
            conditions: {
              options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
              },
              conditions: [{
                id: 'has-deals',
                leftValue: '={{ $json.totalDeals }}',
                rightValue: 0,
                operator: {
                  type: 'number',
                  operation: 'gt',
                },
              }],
              combinator: 'and',
            },
            options: {},
          },
          id: 'check-if-deals',
          name: 'Check If Any Deals',
          type: 'n8n-nodes-base.if',
          typeVersion: 2,
          position: [900, 300],
        },

        // 5. Split Into Batches
        {
          parameters: {
            batchSize: 5,
            options: {},
          },
          id: 'split-batches',
          name: 'Split Into Batches',
          type: 'n8n-nodes-base.splitInBatches',
          typeVersion: 3,
          position: [1120, 200],
        },

        // 6. Refresh Individual Deal
        {
          parameters: {
            method: 'POST',
            url: `${LOCAL_API_URL}/api/deals/{{ $json.dealId }}/refresh`,
            authentication: 'none',
            sendBody: true,
            specifyBody: 'json',
            jsonBody: '={}',
            options: {
              headers: {
                'ngrok-skip-browser-warning': 'true',
              },
            },
          },
          id: 'refresh-deal',
          name: 'Refresh Deal',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 4.2,
          position: [1340, 200],
        },

        // 7. Track Results
        {
          parameters: {
            jsCode: `const items = $input.all();
const results = { success: [], failed: [] };
items.forEach(item => {
  const data = item.json;
  if (data.success) {
    results.success.push({ dealId: data.dealId, address: data.address });
  } else {
    results.failed.push({ dealId: data.dealId || 'unknown', error: data.error || 'Unknown error' });
  }
});
console.log(\`Sync complete: \${results.success.length} succeeded, \${results.failed.length} failed\`);
return [{ json: { total: items.length, successful: results.success.length, failed: results.failed.length, results, timestamp: new Date().toISOString() } }];`,
          },
          id: 'track-results',
          name: 'Track Results',
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [1560, 200],
        },

        // 8. Check for Failures
        {
          parameters: {
            conditions: {
              options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
              },
              conditions: [{
                id: 'has-failures',
                leftValue: '={{ $json.failed }}',
                rightValue: 0,
                operator: {
                  type: 'number',
                  operation: 'gt',
                },
              }],
              combinator: 'and',
            },
            options: {},
          },
          id: 'check-failures',
          name: 'Check for Failures',
          type: 'n8n-nodes-base.if',
          typeVersion: 2,
          position: [1780, 200],
        },

        // 9. Format Failure Alert
        {
          parameters: {
            jsCode: `const data = $input.first().json;
const failedItems = data.results.failed.slice(0, 5);
const additionalFailures = data.results.failed.length > 5 ? data.results.failed.length - 5 : 0;
const failureBlocks = failedItems.map(item => ({
  type: "section",
  text: { type: "mrkdwn", text: \`🔴 *Deal ID:* \${item.dealId}\\n*Error:* \${item.error}\` }
}));
if (additionalFailures > 0) {
  failureBlocks.push({
    type: "section",
    text: { type: "mrkdwn", text: \`_...and \${additionalFailures} more failures_\` }
  });
}
const message = {
  blocks: [
    { type: "header", text: { type: "plain_text", text: "⚠️ Data Sync: Failures Detected" } },
    { type: "section", text: { type: "mrkdwn", text: \`*Summary:*\\n• Total Synced: \${data.total}\\n• Successful: \${data.successful}\\n• Failed: \${data.failed}\` } },
    { type: "divider" },
    ...failureBlocks,
    { type: "context", elements: [{ type: "mrkdwn", text: \`Sync completed at <!date^\${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|now>\` }] }
  ]
};
return [{ json: message }];`,
          },
          id: 'format-failure-alert',
          name: 'Format Failure Alert',
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [2000, 200],
        },

        // 10. Send Failure Alert to Slack
        {
          parameters: {
            method: 'POST',
            url: SLACK_WEBHOOK,
            authentication: 'none',
            sendBody: true,
            specifyBody: 'json',
            jsonBody: '={{ JSON.stringify($json) }}',
            options: {},
          },
          id: 'send-failure-alert',
          name: 'Send Failure Alert',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 4.2,
          position: [2220, 200],
        },

        // 11. No Deals - Log Only
        {
          parameters: {
            jsCode: `console.log('No active deals found to sync');
return [{ json: { message: 'No active deals to sync', timestamp: new Date().toISOString() } }];`,
          },
          id: 'no-deals-log',
          name: 'No Deals - Log Only',
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [1120, 400],
        },
      ],
      connections: {
        'Schedule Trigger': {
          main: [[{ node: 'Fetch Active Deals', type: 'main', index: 0 }]],
        },
        'Fetch Active Deals': {
          main: [[{ node: 'Extract Deal IDs', type: 'main', index: 0 }]],
        },
        'Extract Deal IDs': {
          main: [[{ node: 'Check If Any Deals', type: 'main', index: 0 }]],
        },
        'Check If Any Deals': {
          main: [
            [{ node: 'Split Into Batches', type: 'main', index: 0 }],
            [{ node: 'No Deals - Log Only', type: 'main', index: 0 }],
          ],
        },
        'Split Into Batches': {
          main: [[{ node: 'Refresh Deal', type: 'main', index: 0 }]],
        },
        'Refresh Deal': {
          main: [[{ node: 'Track Results', type: 'main', index: 0 }]],
        },
        'Track Results': {
          main: [[{ node: 'Check for Failures', type: 'main', index: 0 }]],
        },
        'Check for Failures': {
          main: [
            [{ node: 'Format Failure Alert', type: 'main', index: 0 }],
            [],
          ],
        },
        'Format Failure Alert': {
          main: [[{ node: 'Send Failure Alert', type: 'main', index: 0 }]],
        },
      },
      settings: {
        executionOrder: 'v1',
      },
    };

    const createResponse = await fetch(`${N8N_API_URL}/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY,
      },
      body: JSON.stringify(workflow),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Failed to create workflow: ${createResponse.status} ${error}`);
    }

    const result = await createResponse.json();
    console.log('✅ Data Refresh & Sync workflow created successfully!');
    console.log('Workflow ID:', result.id);
    console.log('Workflow Name:', result.name);
    console.log('\n🔗 Open workflow:', `https://primary-production-8b46.up.railway.app/workflow/${result.id}`);
    console.log('\n⏰ Schedule: Every 6 hours');
    console.log('📊 Features:');
    console.log('   • Fetches all active deals');
    console.log('   • Refreshes data in batches of 5');
    console.log('   • Tracks success/failure results');
    console.log('   • Alerts on sync failures via Slack');
    console.log('\n✅ Workflow is production-ready!');

    return result;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

createDataRefreshWorkflow();
