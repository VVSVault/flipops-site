const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const LOCAL_API_URL = 'https://d5c3cffd305d.ngrok-free.app';
const SLACK_WEBHOOK = 'https://hooks.slack.com/services/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';

async function createChangeOrderWorkflow() {
  console.log('📋 Creating Change Order Gatekeeper (G4) workflow...\n');

  try {
    const workflow = {
      name: 'Change Order Gatekeeper (G4)',
      nodes: [
        // 1. Schedule Trigger - Check daily at 9 AM
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

        // 2. Fetch Change Order Status
        {
          parameters: {
            method: 'GET',
            url: `${LOCAL_API_URL}/api/change-orders/status`,
            authentication: 'none',
            options: {
              headers: {
                'ngrok-skip-browser-warning': 'true',
              },
            },
          },
          id: 'fetch-co-status',
          name: 'Fetch Change Order Status',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 4.2,
          position: [460, 300],
        },

        // 3. Check if Any Denials
        {
          parameters: {
            conditions: {
              options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
              },
              conditions: [{
                id: 'has-denials',
                leftValue: '={{ $json.summary.denied }}',
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
          id: 'check-if-denials',
          name: 'Check If Any Denials',
          type: 'n8n-nodes-base.if',
          typeVersion: 2,
          position: [680, 300],
        },

        // 4. Format Slack Alert
        {
          parameters: {
            jsCode: `const data = $input.first().json;
const summary = data.summary || {};
const deniedChangeOrders = data.deniedChangeOrders || [];
const dealsWithActivity = data.dealsWithActivity || [];
const tradesWithActivity = data.tradesWithActivity || [];

const hasDenials = summary.denied > 0;
const headerText = hasDenials
  ? '🚫 Change Order Gatekeeper: Denials Detected'
  : '✅ Change Order Gatekeeper: Activity Report';

// Denied change order blocks
const denialBlocks = deniedChangeOrders.slice(0, 5).map(co => {
  const simResults = co.simResults || {};
  const before = simResults.before || {};
  const after = simResults.after || {};

  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`*🚫 DENIED: \${co.address}*\\n*Trade:* \${co.trade}\\n*Delta:* $\${co.deltaUsd.toLocaleString()}\\n*Reason:* \${co.rationale || 'Violated guardrails'}\\n*Impact:* \${co.impactDays} days\\n*Before ROI:* \${before.roiPct ? before.roiPct.toFixed(1) : 'N/A'}% → *After ROI:* \${after.roiPct ? after.roiPct.toFixed(1) : 'N/A'}%\`
    }
  };
});

if (deniedChangeOrders.length > 5) {
  denialBlocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`_...and \${deniedChangeOrders.length - 5} more denied change orders_\`
    }
  });
}

// Deal activity blocks
const dealBlocks = dealsWithActivity.slice(0, 5).map(deal => {
  const statusInfo = \`Approved: \${deal.approvedCount} | Denied: \${deal.deniedCount} | Pending: \${deal.proposedCount}\`;

  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`*\${deal.address}*\\n\${statusInfo}\\nTotal Delta: $\${deal.totalDelta.toLocaleString()}\\nChange Orders: \${deal.changeOrders.length}\`
    }
  };
});

if (dealsWithActivity.length > 5) {
  dealBlocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`_...and \${dealsWithActivity.length - 5} more deals with change order activity_\`
    }
  });
}

// Trade activity blocks
const tradeBlocks = tradesWithActivity.slice(0, 5).map(trade => {
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`*\${trade.trade}*\\nApproved: \${trade.approvedCount} | Denied: \${trade.deniedCount}\\nTotal Delta: $\${trade.totalDelta.toLocaleString()} (\${trade.changeOrderCount} COs)\`
    }
  };
});

// Build message blocks
const blocks = [
  {
    type: "header",
    text: {
      type: "plain_text",
      text: headerText
    }
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`*Summary (Last 7 Days):*\\n• Total Change Orders: \${summary.total}\\n• Approved: \${summary.approved}\\n• Denied: \${summary.denied}\\n• Pending Review: \${summary.proposed}\\n• Active Deals: \${summary.dealsActive}\\n• Active Trades: \${summary.tradesActive}\`
    }
  }
];

if (denialBlocks.length > 0) {
  blocks.push({ type: "divider" });
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*🚫 Recently Denied Change Orders:*"
    }
  });
  blocks.push(...denialBlocks);
}

if (dealBlocks.length > 0) {
  blocks.push({ type: "divider" });
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*🏠 Deals with Change Order Activity:*"
    }
  });
  blocks.push(...dealBlocks);
}

if (tradeBlocks.length > 0) {
  blocks.push({ type: "divider" });
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*🔨 Trades with Change Order Activity:*"
    }
  });
  blocks.push(...tradeBlocks);
}

blocks.push({ type: "divider" });
blocks.push({
  type: "section",
  text: {
    type: "mrkdwn",
    text: \`*💡 Guardrails Enforced:*\\n• Maximum Exposure (MAO + 15%)\\n• Target ROI Threshold\\n• P80 Impact Analysis\\n• Timeline Impact Review\`
  }
});

blocks.push({
  type: "context",
  elements: [{
    type: "mrkdwn",
    text: \`Change order report generated at <!date^\${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|now>\`
  }]
});

const message = { blocks };

return [{ json: message }];`,
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

        // 6. No Denials - Log Only
        {
          parameters: {
            jsCode: `const data = $input.first().json;
console.log('No denied change orders');
console.log('Summary:', JSON.stringify(data.summary, null, 2));
return [{ json: { message: 'All change orders approved or pending', summary: data.summary, timestamp: new Date().toISOString() } }];`,
          },
          id: 'no-denials-log',
          name: 'No Denials - Log Only',
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [900, 400],
        },
      ],
      connections: {
        'Schedule Trigger': {
          main: [[{ node: 'Fetch Change Order Status', type: 'main', index: 0 }]],
        },
        'Fetch Change Order Status': {
          main: [[{ node: 'Check If Any Denials', type: 'main', index: 0 }]],
        },
        'Check If Any Denials': {
          main: [
            [{ node: 'Format Slack Alert', type: 'main', index: 0 }],
            [{ node: 'No Denials - Log Only', type: 'main', index: 0 }],
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
    console.log('✅ Change Order Gatekeeper workflow created successfully!');
    console.log('Workflow ID:', result.id);
    console.log('Workflow Name:', result.name);
    console.log('\n🔗 Open workflow:', `https://primary-production-8b46.up.railway.app/workflow/${result.id}`);
    console.log('\n⏰ Schedule: Daily check (every 24 hours)');
    console.log('📊 Features:');
    console.log('   • Monitors change order approvals and denials');
    console.log('   • Detects guardrail violations (exposure, ROI)');
    console.log('   • Identifies deals with high change order activity');
    console.log('   • Tracks trade-specific change order patterns');
    console.log('   • Sends detailed Slack alerts for denied change orders');
    console.log('   • P80/ROI impact simulation before approval');
    console.log('\n✅ Workflow is production-ready!');

    return result;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

createChangeOrderWorkflow();
