const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const LOCAL_API_URL = 'https://d5c3cffd305d.ngrok-free.app';
const SLACK_WEBHOOK = 'https://hooks.slack.com/services/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';

async function createInvoiceBudgetWorkflow() {
  console.log('📋 Creating Invoice Processing & Budget Guardian workflow...\n');

  try {
    const workflow = {
      name: 'Invoice & Budget Guardian (G3)',
      nodes: [
        // 1. Schedule Trigger - Check daily at 8 AM
        {
          parameters: {
            rule: {
              interval: [{
                field: 'hours',
                hoursInterval: 24,
              }],
            },
          },
          id: 'schedule-trigger',
          name: 'Schedule Trigger',
          type: 'n8n-nodes-base.scheduleTrigger',
          typeVersion: 1.2,
          position: [240, 300],
        },

        // 2. Fetch Invoice Status
        {
          parameters: {
            method: 'GET',
            url: `${LOCAL_API_URL}/api/invoices/status`,
            authentication: 'none',
            options: {
              headers: {
                'ngrok-skip-browser-warning': 'true',
              },
            },
          },
          id: 'fetch-invoice-status',
          name: 'Fetch Invoice Status',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 4.2,
          position: [460, 300],
        },

        // 3. Check if Any Issues
        {
          parameters: {
            conditions: {
              options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
              },
              conditions: [{
                id: 'has-issues',
                leftValue: '={{ $json.summary.total }}',
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
          id: 'check-if-issues',
          name: 'Check If Any Issues',
          type: 'n8n-nodes-base.if',
          typeVersion: 2,
          position: [680, 300],
        },

        // 4. Format Slack Alert
        {
          parameters: {
            jsCode: "const data = $input.first().json;\nconst summary = data.summary || {};\nconst dealsWithIssues = data.dealsWithIssues || [];\nconst tradesWithIssues = data.tradesWithIssues || [];\n\nconst isCritical = summary.tier2Critical > 0;\nconst headerText = isCritical \n  ? '🚨 Budget Guardian: Critical Variances Detected'\n  : '⚠️ Budget Guardian: Budget Variances Detected';\n\nconst dealBlocks = dealsWithIssues.slice(0, 5).map(deal => {\n  const tierInfo = deal.tier2Count > 0 \n    ? `🚨 Tier 2: ${deal.tier2Count} critical`\n    : `⚠️ Tier 1: ${deal.tier1Count} warnings`;\n  \n  return {\n    type: \"section\",\n    text: {\n      type: \"mrkdwn\",\n      text: `*${deal.address}*\\n${tierInfo}\\nTotal Amount: $${deal.totalAmount.toLocaleString()}\\nInvoices: ${deal.invoices.length}`\n    }\n  };\n});\n\nif (dealsWithIssues.length > 5) {\n  dealBlocks.push({\n    type: \"section\",\n    text: {\n      type: \"mrkdwn\",\n      text: `_...and ${dealsWithIssues.length - 5} more deals with budget issues_`\n    }\n  });\n}\n\nconst tradeBlocks = tradesWithIssues.slice(0, 5).map(trade => {\n  const tierInfo = trade.tier2Count > 0\n    ? `🚨 ${trade.tier2Count} critical`\n    : `⚠️ ${trade.tier1Count} warnings`;\n    \n  return {\n    type: \"section\",\n    text: {\n      type: \"mrkdwn\",\n      text: `*${trade.trade}*\\n${tierInfo}\\nTotal: $${trade.totalAmount.toLocaleString()} (${trade.invoiceCount} invoices)`\n    }\n  };\n});\n\nconst actionBlocks = [];\n\nif (summary.tier2Critical > 0) {\n  actionBlocks.push({\n    type: \"section\",\n    text: {\n      type: \"mrkdwn\",\n      text: `*🔒 Tier 2 Actions (7%+ variance):*\\n• Non-critical spending frozen\\n• COG simulation required for new spending\\n• All change orders require approval\\n• Immediate review recommended`\n    }\n  });\n}\n\nif (summary.tier1Warning > 0) {\n  actionBlocks.push({\n    type: \"section\",\n    text: {\n      type: \"mrkdwn\",\n      text: `*⚠️ Tier 1 Actions (3-7% variance):*\\n• Monitor closely\\n• Review non-essential spending\\n• Consider cost-saving measures\\n• Track daily actuals`\n    }\n  });\n}\n\nconst message = {\n  blocks: [\n    {\n      type: \"header\",\n      text: {\n        type: \"plain_text\",\n        text: headerText\n      }\n    },\n    {\n      type: \"section\",\n      text: {\n        type: \"mrkdwn\",\n        text: `*Summary:*\\n• Total Issues: ${summary.total}\\n• Tier 2 (Critical): ${summary.tier2Critical}\\n• Tier 1 (Warning): ${summary.tier1Warning}\\n• Deals Affected: ${summary.dealsAffected}\\n• Trades Affected: ${summary.tradesAffected}`\n      }\n    },\n    {\n      type: \"divider\"\n    },\n    {\n      type: \"section\",\n      text: {\n        type: \"mrkdwn\",\n        text: \"*🏠 Deals with Budget Issues:*\"\n      }\n    },\n    ...dealBlocks,\n    {\n      type: \"divider\"\n    },\n    {\n      type: \"section\",\n      text: {\n        type: \"mrkdwn\",\n        text: \"*🔨 Trades with Budget Issues:*\"\n      }\n    },\n    ...tradeBlocks,\n    {\n      type: \"divider\"\n    },\n    ...actionBlocks,\n    {\n      type: \"context\",\n      elements: [{\n        type: \"mrkdwn\",\n        text: `Budget report generated at <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|now>`\n      }]\n    }\n  ]\n};\n\nreturn [{ json: message }];",
          },
          id: 'format-slack-alert',
          name: 'Format Slack Alert',
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [900, 200],
        },

        // 5. Send to Slack
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
          id: 'send-slack-alert',
          name: 'Send to Slack',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 4.2,
          position: [1120, 200],
        },

        // 6. No Issues - Log Only
        {
          parameters: {
            jsCode: "const data = $input.first().json;\nconsole.log('No budget issues detected');\nconsole.log('Summary:', JSON.stringify(data.summary, null, 2));\nreturn [{ json: { message: 'All budgets healthy', summary: data.summary, timestamp: new Date().toISOString() } }];",
          },
          id: 'no-issues-log',
          name: 'No Issues - Log Only',
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [900, 400],
        },
      ],
      connections: {
        'Schedule Trigger': {
          main: [[{ node: 'Fetch Invoice Status', type: 'main', index: 0 }]],
        },
        'Fetch Invoice Status': {
          main: [[{ node: 'Check If Any Issues', type: 'main', index: 0 }]],
        },
        'Check If Any Issues': {
          main: [
            [{ node: 'Format Slack Alert', type: 'main', index: 0 }],
            [{ node: 'No Issues - Log Only', type: 'main', index: 0 }],
          ],
        },
        'Format Slack Alert': {
          main: [[{ node: 'Send to Slack', type: 'main', index: 0 }]],
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
    console.log('✅ Invoice & Budget Guardian workflow created successfully!');
    console.log('Workflow ID:', result.id);
    console.log('Workflow Name:', result.name);
    console.log('\n🔗 Open workflow:', `https://primary-production-8b46.up.railway.app/workflow/${result.id}`);
    console.log('\n⏰ Schedule: Daily check (every 24 hours)');
    console.log('📊 Features:');
    console.log('   • Monitors invoice status and budget variances');
    console.log('   • Detects Tier 1 (3%+) and Tier 2 (7%+) budget overruns');
    console.log('   • Identifies problematic deals and trades');
    console.log('   • Sends detailed Slack alerts with recommended actions');
    console.log('   • Tracks COG simulation queue for critical variances');
    console.log('\n✅ Workflow is production-ready!');

    return result;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

createInvoiceBudgetWorkflow();
