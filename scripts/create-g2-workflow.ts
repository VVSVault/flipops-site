const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const LOCAL_API_URL = 'https://d740f7483316.ngrok-free.app';
const SLACK_WEBHOOK = 'https://hooks.slack.com/services/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';

async function createG2Workflow() {
  console.log('📋 Creating G2 Bid Spread Alert workflow...\n');

  try {
    const workflow = {
      name: 'G2 - Bid Spread Alert',
      nodes: [
        // 1. Schedule Trigger - Check every 8 hours
        {
          parameters: {
            rule: {
              interval: [{
                field: 'hours',
                hoursInterval: 8,
              }],
            },
          },
          id: 'schedule-trigger',
          name: 'Schedule Trigger',
          type: 'n8n-nodes-base.scheduleTrigger',
          typeVersion: 1.2,
          position: [240, 300],
        },

        // 2. Fetch G2 Status
        {
          parameters: {
            method: 'GET',
            url: `${LOCAL_API_URL}/api/bids/award/status`,
            authentication: 'none',
            options: {
              headers: {
                'ngrok-skip-browser-warning': 'true',
              },
            },
          },
          id: 'fetch-g2-status',
          name: 'Fetch G2 Status',
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
const blockedBids = data.blockedBids || [];
const tradesWithIssues = data.tradesWithIssues || [];

const hasBlocked = summary.total > 0;
const headerText = hasBlocked
  ? '🚨 G2 Alert: Excessive Bid Spread Detected'
  : '✅ G2 Status: All Bid Spreads Within Limits';

// Build blocks for each blocked bid
const bidBlocks = [];

blockedBids.slice(0, 10).forEach((bid, index) => {
  const minBid = bid.stats.min ? \`$\${bid.stats.min.toLocaleString()}\` : 'N/A';
  const medianBid = bid.stats.median ? \`$\${bid.stats.median.toLocaleString()}\` : 'N/A';
  const maxBid = bid.stats.max ? \`$\${bid.stats.max.toLocaleString()}\` : 'N/A';
  const spread = bid.stats.spread ? \`$\${bid.stats.spread.toLocaleString()}\` : 'N/A';
  const spreadPct = bid.stats.spreadPct ? \`\${bid.stats.spreadPct.toFixed(1)}%\` : 'N/A';

  // All bids breakdown
  let bidsText = '';
  if (bid.allBids && bid.allBids.length > 0) {
    bidsText = '\\n💰 All Bids:\\n' + bid.allBids.map((b, i) => {
      const isOutlier = bid.outliers && bid.outliers.includes(b.bidId);
      const outlierMark = isOutlier ? ' ⚠️ OUTLIER' : '';
      return \`  \${i + 1}. $\${b.total ? b.total.toLocaleString() : 'N/A'}\${outlierMark}\`;
    }).join('\\n');
  }

  bidBlocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`*\${index + 1}. \${bid.address || 'Unknown Address'}*\\n🔨 *Trade:* \${bid.trade || 'Unknown'}\\n📊 *Spread:* \${spreadPct} (threshold: \${bid.threshold}%)\\n📉 *Range:* \${minBid} - \${maxBid}\\n📍 *Median:* \${medianBid}\\n🕐 *Blocked:* <!date^\${Math.floor(new Date(bid.blockedAt).getTime() / 1000)}^{date_short} at {time}|recent>\${bidsText}\`
    }
  });
});

if (blockedBids.length > 10) {
  bidBlocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`_...and \${blockedBids.length - 10} more blocked bids_\`
    }
  });
}

// Trade breakdown
const tradeBlocks = [];
if (tradesWithIssues.length > 0) {
  tradesWithIssues.slice(0, 5).forEach(trade => {
    tradeBlocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: \`*\${trade.trade}:* \${trade.count} blocked | Avg Spread: \${trade.avgSpread.toFixed(1)}%\`
      }
    });
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
      text: \`*Summary (Last 7 Days):*\\n• Total Blocked: \${summary.total}\\n• Unique Deals: \${summary.uniqueDeals}\\n• Avg Spread: \${summary.avgSpread ? summary.avgSpread.toFixed(1) : 0}%\\n• Trades Affected: \${summary.tradesAffected}\`
    }
  }
];

if (bidBlocks.length > 0) {
  blocks.push({ type: "divider" });
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*🚫 Blocked Bids:*"
    }
  });
  blocks.push(...bidBlocks);
}

if (tradeBlocks.length > 0) {
  blocks.push({ type: "divider" });
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*🔨 Trades with Spread Issues:*"
    }
  });
  blocks.push(...tradeBlocks);
}

blocks.push({ type: "divider" });
blocks.push({
  type: "section",
  text: {
    type: "mrkdwn",
    text: \`*💡 Recommended Actions:*\\n• Request additional bids from reliable vendors\\n• Investigate outlier bids for errors or scope differences\\n• Consider negotiating with median-range vendors\\n• Review vendor reliability scores\`
  }
});

blocks.push({
  type: "context",
  elements: [{
    type: "mrkdwn",
    text: \`G2 bid spread report generated at <!date^\${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|now>\`
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
console.log('No blocked bids detected');
console.log('Summary:', JSON.stringify(data.summary, null, 2));
return [{ json: { message: 'All bid spreads within acceptable range', summary: data.summary, timestamp: new Date().toISOString() } }];`,
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
          main: [[{ node: 'Fetch G2 Status', type: 'main', index: 0 }]],
        },
        'Fetch G2 Status': {
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
    console.log('✅ G2 Bid Spread Alert workflow created successfully!');
    console.log('Workflow ID:', result.id);
    console.log('Workflow Name:', result.name);
    console.log('\n🔗 Open workflow:', `https://primary-production-8b46.up.railway.app/workflow/${result.id}`);
    console.log('\n⏰ Schedule: Every 8 hours');
    console.log('📊 Monitors:');
    console.log('   • Bids where spread > 15% threshold');
    console.log('   • Identifies outlier bids');
    console.log('   • Tracks trade-specific pricing issues');
    console.log('\n✅ Workflow is production-ready!');

    return result;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

createG2Workflow();
