const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const LOCAL_API_URL = 'https://d5c3cffd305d.ngrok-free.app';
const SLACK_WEBHOOK = 'https://hooks.slack.com/services/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';

async function createPipelineMonitoringWorkflow() {
  console.log('📋 Creating Pipeline Monitoring workflow...\n');

  try {
    const workflow = {
      name: 'Pipeline Monitoring',
      nodes: [
        // 1. Schedule Trigger - Check every 6 hours
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

        // 2. Fetch Stalled Deals
        {
          parameters: {
            method: 'GET',
            url: `${LOCAL_API_URL}/api/deals/stalled`,
            authentication: 'none',
            options: {
              headers: {
                'ngrok-skip-browser-warning': 'true',
              },
            },
          },
          id: 'fetch-stalled-deals',
          name: 'Fetch Stalled Deals',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 4.2,
          position: [460, 300],
        },

        // 3. Check If Any Stalled
        {
          parameters: {
            conditions: {
              options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
              },
              conditions: [{
                id: 'has-stalled',
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
          id: 'check-if-stalled',
          name: 'Check If Any Stalled',
          type: 'n8n-nodes-base.if',
          typeVersion: 2,
          position: [680, 300],
        },

        // 4. Format Slack Alert
        {
          parameters: {
            jsCode: `const data = $input.first().json;
const summary = data.summary || {};
const stalledDeals = data.stalledDeals || [];
const thresholds = data.thresholds || {};

const hasStalled = summary.total > 0;
const headerText = hasStalled
  ? '🚨 Pipeline Alert: Stalled Deals Detected'
  : '✅ Pipeline Health: All Clear';

// Group deals by gate
const g1Deals = stalledDeals.filter(d => d.gate === 'G1').slice(0, 5);
const g2Deals = stalledDeals.filter(d => d.gate === 'G2').slice(0, 5);
const g3Deals = stalledDeals.filter(d => d.gate === 'G3').slice(0, 5);
const g4Deals = stalledDeals.filter(d => d.gate === 'G4').slice(0, 5);

// Build blocks
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
      text: \`*Summary:*\\n• G1 (Deal Approval): \${summary.G1} stalled > \${thresholds.G1}\\n• G2 (Bid Award): \${summary.G2} stalled > \${thresholds.G2}\\n• G3 (Invoice Processing): \${summary.G3} stalled > \${thresholds.G3}\\n• G4 (Change Orders): \${summary.G4} stalled > \${thresholds.G4}\\n• *Total Stalled:* \${summary.total}\`
    }
  }
];

// G1 Section
if (g1Deals.length > 0) {
  blocks.push({ type: "divider" });
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*🚪 G1 - Deals Awaiting Approval:*"
    }
  });

  g1Deals.forEach(deal => {
    const days = Math.floor(deal.stalledFor / 24);
    const hours = deal.stalledFor % 24;
    const timeStr = days > 0 ? \`\${days}d \${hours}h\` : \`\${hours}h\`;

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: \`*\${deal.address || 'Unknown Address'}*\\n⏱️ Stalled for: \${timeStr}\\n💰 Max Exposure: $\${deal.details.maxExposureUsd?.toLocaleString() || 'N/A'}\\n🎯 Target ROI: \${deal.details.targetRoiPct || 'N/A'}%\\n⚠️ Action: Approve or block this deal\`
      }
    });
  });

  if (summary.G1 > 5) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: \`_...and \${summary.G1 - 5} more deals awaiting approval_\`
      }
    });
  }
}

// G2 Section
if (g2Deals.length > 0) {
  blocks.push({ type: "divider" });
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*🔨 G2 - Bids Awaiting Award:*"
    }
  });

  g2Deals.forEach(deal => {
    const days = Math.floor(deal.stalledFor / 24);
    const hours = deal.stalledFor % 24;
    const timeStr = days > 0 ? \`\${days}d \${hours}h\` : \`\${hours}h\`;

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: \`*\${deal.address || 'Unknown Address'}*\\n⏱️ Stalled for: \${timeStr}\\n🏢 Vendor: \${deal.details.vendorName}\\n💰 Bid Amount: $\${deal.details.subtotal?.toLocaleString() || 'N/A'}\\n⚠️ Action: Award or reject bid\`
      }
    });
  });

  if (summary.G2 > 5) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: \`_...and \${summary.G2 - 5} more bids awaiting award_\`
      }
    });
  }
}

// G3 Section
if (g3Deals.length > 0) {
  blocks.push({ type: "divider" });
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*📄 G3 - Invoices Awaiting Processing:*"
    }
  });

  g3Deals.forEach(deal => {
    const days = Math.floor(deal.stalledFor / 24);
    const hours = deal.stalledFor % 24;
    const timeStr = days > 0 ? \`\${days}d \${hours}h\` : \`\${hours}h\`;

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: \`*\${deal.address || 'Unknown Address'}*\\n⏱️ Stalled for: \${timeStr}\\n🔨 Trade: \${deal.details.trade}\\n💰 Amount: $\${deal.details.amount?.toLocaleString() || 'N/A'}\\n🏢 Vendor: \${deal.details.vendorName}\\n⚠️ Action: Process invoice\`
      }
    });
  });

  if (summary.G3 > 5) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: \`_...and \${summary.G3 - 5} more invoices awaiting processing_\`
      }
    });
  }
}

// G4 Section
if (g4Deals.length > 0) {
  blocks.push({ type: "divider" });
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*📋 G4 - Change Orders Awaiting Approval:*"
    }
  });

  g4Deals.forEach(deal => {
    const days = Math.floor(deal.stalledFor / 24);
    const hours = deal.stalledFor % 24;
    const timeStr = days > 0 ? \`\${days}d \${hours}h\` : \`\${hours}h\`;

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: \`*\${deal.address || 'Unknown Address'}*\\n⏱️ Stalled for: \${timeStr}\\n🔨 Trade: \${deal.details.trade}\\n💰 Delta: $\${deal.details.deltaUsd?.toLocaleString() || 'N/A'}\\n📅 Impact: \${deal.details.impactDays} days\\n⚠️ Action: Approve or deny change order\`
      }
    });
  });

  if (summary.G4 > 5) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: \`_...and \${summary.G4 - 5} more change orders awaiting approval_\`
      }
    });
  }
}

// Footer
blocks.push({ type: "divider" });
blocks.push({
  type: "section",
  text: {
    type: "mrkdwn",
    text: \`*💡 Action Items:*\\n• Review and act on stalled items to keep pipeline moving\\n• Deals stuck > 7 days may need urgent attention\\n• Consider automating routine approvals\`
  }
});

blocks.push({
  type: "context",
  elements: [{
    type: "mrkdwn",
    text: \`Pipeline report generated at <!date^\${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|now>\`
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

        // 6. No Stalled - Log Only
        {
          parameters: {
            jsCode: `const data = $input.first().json;
console.log('No stalled deals detected');
console.log('Summary:', JSON.stringify(data.summary, null, 2));
return [{ json: { message: 'Pipeline healthy - no stalled deals', summary: data.summary, timestamp: new Date().toISOString() } }];`,
          },
          id: 'no-stalled-log',
          name: 'No Stalled - Log Only',
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [900, 400],
        },
      ],
      connections: {
        'Schedule Trigger': {
          main: [[{ node: 'Fetch Stalled Deals', type: 'main', index: 0 }]],
        },
        'Fetch Stalled Deals': {
          main: [[{ node: 'Check If Any Stalled', type: 'main', index: 0 }]],
        },
        'Check If Any Stalled': {
          main: [
            [{ node: 'Format Slack Alert', type: 'main', index: 0 }],
            [{ node: 'No Stalled - Log Only', type: 'main', index: 0 }],
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
    console.log('✅ Pipeline Monitoring workflow created successfully!');
    console.log('Workflow ID:', result.id);
    console.log('Workflow Name:', result.name);
    console.log('\n🔗 Open workflow:', `https://primary-production-8b46.up.railway.app/workflow/${result.id}`);
    console.log('\n⏰ Schedule: Every 6 hours');
    console.log('📊 Monitors:');
    console.log('   • G1: Deals pending approval > 3 days');
    console.log('   • G2: Bids pending award > 5 days');
    console.log('   • G3: Invoices pending processing > 2 days');
    console.log('   • G4: Change orders pending approval > 1 day');
    console.log('\n📢 Alerts:');
    console.log('   • Sends Slack alerts when deals are stalled');
    console.log('   • Groups by gate with action items');
    console.log('   • Shows top 5 most stalled items per gate');
    console.log('\n✅ Workflow is production-ready!');

    return result;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

createPipelineMonitoringWorkflow();
