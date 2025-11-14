const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const LOCAL_API_URL = 'https://d5c3cffd305d.ngrok-free.app';
const SLACK_WEBHOOK = 'https://hooks.slack.com/services/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';
const OLD_WORKFLOW_ID = '8QSGET7UcpOIrHY6';

async function recreateSimpleWorkflow() {
  console.log('🗑️  Deleting old workflow...\n');

  try {
    // Delete old workflow
    const deleteResponse = await fetch(`${N8N_API_URL}/workflows/${OLD_WORKFLOW_ID}`, {
      method: 'DELETE',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
      },
    });

    if (deleteResponse.ok) {
      console.log('✅ Old workflow deleted\n');
    }

    console.log('📋 Creating simplified Data Refresh workflow...\n');

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

        // 2. Call Sync All Endpoint
        {
          parameters: {
            method: 'POST',
            url: `${LOCAL_API_URL}/api/deals/sync-all`,
            authentication: 'none',
            options: {
              headers: {
                'ngrok-skip-browser-warning': 'true',
              },
            },
          },
          id: 'sync-all-deals',
          name: 'Sync All Deals',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 4.2,
          position: [460, 300],
        },

        // 3. Check for Failures
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
                leftValue: '={{ $json.summary.failed }}',
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
          position: [680, 300],
        },

        // 4. Format Failure Alert
        {
          parameters: {
            jsCode: `const data = $input.first().json;
const summary = data.summary || {};
const results = data.results || { failed: [] };
const failedItems = results.failed.slice(0, 5);
const additionalFailures = results.failed.length > 5 ? results.failed.length - 5 : 0;
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
    { type: "section", text: { type: "mrkdwn", text: \`*Summary:*\\n• Total Synced: \${summary.total}\\n• Successful: \${summary.successful}\\n• Failed: \${summary.failed}\\n• Duration: \${summary.duration}\` } },
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
          position: [900, 200],
        },

        // 5. Send Failure Alert to Slack
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
          position: [1120, 200],
        },

        // 6. Log Success
        {
          parameters: {
            jsCode: `const data = $input.first().json;
const summary = data.summary || {};
console.log(\`Sync completed successfully: \${summary.successful} deals synced in \${summary.duration}\`);
return [{ json: { message: 'All deals synced successfully', summary } }];`,
          },
          id: 'log-success',
          name: 'Log Success',
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [900, 400],
        },
      ],
      connections: {
        'Schedule Trigger': {
          main: [[{ node: 'Sync All Deals', type: 'main', index: 0 }]],
        },
        'Sync All Deals': {
          main: [[{ node: 'Check for Failures', type: 'main', index: 0 }]],
        },
        'Check for Failures': {
          main: [
            [{ node: 'Format Failure Alert', type: 'main', index: 0 }],
            [{ node: 'Log Success', type: 'main', index: 0 }],
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
    console.log('   • Uses /api/deals/sync-all endpoint (handles batching internally)');
    console.log('   • Much simpler - NO problematic Split Into Batches node');
    console.log('   • Tracks success/failure results');
    console.log('   • Alerts on sync failures via Slack');
    console.log('\n✅ Workflow is production-ready!');

    return result;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

recreateSimpleWorkflow();
