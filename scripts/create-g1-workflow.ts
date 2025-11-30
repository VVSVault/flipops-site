const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const LOCAL_API_URL = 'https://d740f7483316.ngrok-free.app';
const SLACK_WEBHOOK = 'https://hooks.slack.com/services/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';

async function createG1Workflow() {
  console.log('📋 Creating G1 Deal Approval Alert workflow...\n');

  try {
    const workflow = {
      name: 'G1 - Deal Approval Alert',
      nodes: [
        // 1. Schedule Trigger - Check every 12 hours
        {
          parameters: {
            rule: {
              interval: [{
                field: 'hours',
                hoursInterval: 12,
              }],
            },
          },
          id: 'schedule-trigger',
          name: 'Schedule Trigger',
          type: 'n8n-nodes-base.scheduleTrigger',
          typeVersion: 1.2,
          position: [240, 300],
        },

        // 2. Fetch G1 Status
        {
          parameters: {
            method: 'GET',
            url: `${LOCAL_API_URL}/api/deals/approve/status`,
            authentication: 'none',
            options: {
              headers: {
                'ngrok-skip-browser-warning': 'true',
              },
            },
          },
          id: 'fetch-g1-status',
          name: 'Fetch G1 Status',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 4.2,
          position: [460, 300],
        },

        // 3. Check If Any Blocked
        {
          parameters: {
            conditions: {
              options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
              },
              conditions: [{
                id: 'has-blocked',
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
          id: 'check-if-blocked',
          name: 'Check If Any Blocked',
          type: 'n8n-nodes-base.if',
          typeVersion: 2,
          position: [680, 300],
        },

        // 4. Format Slack Alert
        {
          parameters: {
            jsCode: `const data = $input.first().json;
const summary = data.summary || {};
const blockedDeals = data.blockedDeals || [];

const hasBlocked = summary.total > 0;
const headerText = hasBlocked
  ? '🚨 G1 Alert: Deals Blocked by Maximum Exposure'
  : '✅ G1 Status: All Deals Within Limits';

// Build blocks for each blocked deal
const dealBlocks = [];

blockedDeals.slice(0, 10).forEach((deal, index) => {
  const overByFormatted = deal.metrics.overBy ? \`$\${deal.metrics.overBy.toLocaleString()}\` : 'N/A';
  const overByPct = deal.metrics.overByPct ? \`\${deal.metrics.overByPct.toFixed(1)}%\` : 'N/A';
  const p80 = deal.metrics.p80 ? \`$\${deal.metrics.p80.toLocaleString()}\` : 'N/A';
  const maxExposure = deal.metrics.maxExposureUsd ? \`$\${deal.metrics.maxExposureUsd.toLocaleString()}\` : 'N/A';

  // Top drivers (cost uncertainty factors)
  let driversText = '';
  if (deal.drivers && deal.drivers.length > 0) {
    const topDrivers = deal.drivers.slice(0, 3);
    driversText = '\\n🎯 Top Cost Drivers:\\n' + topDrivers.map(d =>
      \`  • \${d.trade}: \${d.contribution ? d.contribution.toFixed(1) : 'N/A'}%\`
    ).join('\\n');
  }

  dealBlocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`*\${index + 1}. \${deal.address || 'Unknown Address'}*\\n💰 *P80 Cost:* \${p80}\\n⚠️ *Max Exposure:* \${maxExposure}\\n📊 *Over By:* \${overByFormatted} (\${overByPct})\\n🕐 *Blocked:* <!date^\${Math.floor(new Date(deal.blockedAt).getTime() / 1000)}^{date_short} at {time}|recent>\${driversText}\`
    }
  });
});

if (blockedDeals.length > 10) {
  dealBlocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`_...and \${blockedDeals.length - 10} more blocked deals_\`
    }
  });
}

// Build full message
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
      text: \`*Summary (Last 7 Days):*\\n• Total Blocked: \${summary.total}\\n• Unique Deals: \${summary.uniqueDeals}\\n• Total Overage: $\${summary.totalOverage ? summary.totalOverage.toLocaleString() : 0}\\n• Avg Overage: \${summary.avgOveragePct ? summary.avgOveragePct.toFixed(1) : 0}%\`
    }
  }
];

if (dealBlocks.length > 0) {
  blocks.push({ type: "divider" });
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*🚫 Blocked Deals:*"
    }
  });
  blocks.push(...dealBlocks);
}

blocks.push({ type: "divider" });
blocks.push({
  type: "section",
  text: {
    type: "mrkdwn",
    text: \`*💡 Recommended Actions:*\\n• Review cost drivers and consider scope reductions\\n• Negotiate better pricing with vendors\\n• Adjust renovation plans to fit budget\\n• Re-evaluate property ARV\`
  }
});

blocks.push({
  type: "context",
  elements: [{
    type: "mrkdwn",
    text: \`G1 guardrail report generated at <!date^\${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|now>\`
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

        // 6. No Blocked - Log Only
        {
          parameters: {
            jsCode: `const data = $input.first().json;
console.log('No blocked deals detected');
console.log('Summary:', JSON.stringify(data.summary, null, 2));
return [{ json: { message: 'All deals within exposure limits', summary: data.summary, timestamp: new Date().toISOString() } }];`,
          },
          id: 'no-blocked-log',
          name: 'No Blocked - Log Only',
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [900, 400],
        },
      ],
      connections: {
        'Schedule Trigger': {
          main: [[{ node: 'Fetch G1 Status', type: 'main', index: 0 }]],
        },
        'Fetch G1 Status': {
          main: [[{ node: 'Check If Any Blocked', type: 'main', index: 0 }]],
        },
        'Check If Any Blocked': {
          main: [
            [{ node: 'Format Slack Alert', type: 'main', index: 0 }],
            [{ node: 'No Blocked - Log Only', type: 'main', index: 0 }],
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
    console.log('✅ G1 Deal Approval Alert workflow created successfully!');
    console.log('Workflow ID:', result.id);
    console.log('Workflow Name:', result.name);
    console.log('\n🔗 Open workflow:', `https://primary-production-8b46.up.railway.app/workflow/${result.id}`);
    console.log('\n⏰ Schedule: Every 12 hours');
    console.log('📊 Monitors:');
    console.log('   • Deals where P80 > Maximum Exposure');
    console.log('   • Shows cost drivers causing overages');
    console.log('   • Tracks blocked deals over last 7 days');
    console.log('\n✅ Workflow is production-ready!');

    return result;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

createG1Workflow();
