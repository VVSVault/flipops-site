const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const OLD_WORKFLOW_ID = 'npN26FVmNRsK2oR4';
const LOCAL_API_URL = 'https://d5c3cffd305d.ngrok-free.app';
const SLACK_WEBHOOK = 'https://hooks.slack.com/services/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';

async function deleteAndRecreate() {
  console.log('🗑️  Deleting old Budget Alert workflow...\n');

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
    } else {
      console.log('⚠️  Could not delete old workflow (may not exist)\n');
    }

    // Create new workflow
    console.log('📋 Creating new Budget Alert workflow...\n');

    const workflow = {
      name: 'Budget Alert Notifications',
      nodes: [
        // 1. Manual Trigger
        {
          parameters: {},
          id: 'manual-trigger',
          name: 'Manual Trigger',
          type: 'n8n-nodes-base.manualTrigger',
          typeVersion: 1,
          position: [240, 300],
        },

        // 2. Fetch Contractor Performance (using working endpoint)
        {
          parameters: {
            method: 'GET',
            url: `${LOCAL_API_URL}/api/contractors/performance`,
            authentication: 'none',
            options: {},
          },
          id: 'fetch-performance',
          name: 'Fetch Contractor Performance',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 4.2,
          position: [460, 300],
        },

        // 3. Process Flagged Contractors
        {
          parameters: {
            jsCode: `const response = $input.first().json;
const contractors = response.contractors || [];
const flagged = contractors.filter(c => c.flags && c.flags.length > 0);

// Add metadata to each flagged contractor
const processedContractors = flagged.map(contractor => {
  let emoji = '⚠️';
  let statusText = 'Warning';

  if (contractor.flags.includes('BUDGET_OVERRUN') || contractor.currentReliability < 50) {
    emoji = '🔴';
    statusText = 'Critical';
  }

  return {
    ...contractor,
    emoji,
    statusText,
    totalContractors: contractors.length,
    flaggedCount: flagged.length,
    healthyCount: response.healthyCount || (contractors.length - flagged.length),
  };
});

return processedContractors.map(c => ({ json: c }));`,
          },
          id: 'process-flagged',
          name: 'Process Flagged Contractors',
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [680, 300],
        },

        // 4. Check if Any Flagged
        {
          parameters: {
            conditions: {
              options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
              },
              conditions: [
                {
                  id: 'has-flagged',
                  leftValue: '={{ $json.flaggedCount }}',
                  rightValue: 0,
                  operator: {
                    type: 'number',
                    operation: 'gt',
                  },
                },
              ],
              combinator: 'and',
            },
            options: {},
          },
          id: 'check-if-flagged',
          name: 'Check If Any Flagged',
          type: 'n8n-nodes-base.if',
          typeVersion: 2,
          position: [900, 300],
        },

        // 5. Format Slack Message
        {
          parameters: {
            jsCode: `const items = $input.all();

if (items.length === 0) {
  return [{
    json: {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "✅ Performance Alert: All Contractors Healthy"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "All contractors are performing well. No action required."
          }
        }
      ]
    }
  }];
}

const firstItem = items[0]?.json || {};
const totalContractors = firstItem.totalContractors || 0;
const flaggedCount = firstItem.flaggedCount || 0;
const healthyCount = firstItem.healthyCount || 0;

// Build contractor details
const contractorBlocks = items.slice(0, 10).map(item => {
  const c = item.json;
  const reliability = c.currentReliability?.toFixed(1) || '0.0';
  const flagText = c.flags?.join(', ') || 'Unknown';

  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`\${c.emoji} *\${c.vendorName}*\\n• Trade: \${c.trade}\\n• Reliability: *\${reliability}%* (\${c.statusText})\\n• Flags: \${flagText}\\n• On-Time: \${c.onTimePct}% | On-Budget: \${c.onBudgetPct}%\`
    }
  };
});

if (items.length > 10) {
  contractorBlocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`_...and \${items.length - 10} more contractors_\`
    }
  });
}

const message = {
  blocks: [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🚨 Performance Alert: Contractors Need Attention"
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: \`*Summary:*\\n• Total Contractors: \${totalContractors}\\n• Healthy: \${healthyCount}\\n• Flagged: \${flaggedCount}\`
      }
    },
    {
      type: "divider"
    },
    ...contractorBlocks,
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: \`Updated on <!date^\${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|now>\`
        }
      ]
    }
  ]
};

return [{ json: message }];`,
          },
          id: 'format-slack',
          name: 'Format Slack Message',
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [1120, 300],
        },

        // 6. Send to Slack
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
          id: 'send-slack',
          name: 'Send to Slack',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 4.2,
          position: [1340, 300],
        },
      ],
      connections: {
        'Manual Trigger': {
          main: [[{ node: 'Fetch Contractor Performance', type: 'main', index: 0 }]],
        },
        'Fetch Contractor Performance': {
          main: [[{ node: 'Process Flagged Contractors', type: 'main', index: 0 }]],
        },
        'Process Flagged Contractors': {
          main: [[{ node: 'Check If Any Flagged', type: 'main', index: 0 }]],
        },
        'Check If Any Flagged': {
          main: [[{ node: 'Format Slack Message', type: 'main', index: 0 }]],
        },
        'Format Slack Message': {
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
    console.log('✅ Budget Alert Workflow recreated successfully!');
    console.log('Workflow ID:', result.id);
    console.log('Workflow Name:', result.name);
    console.log('\n🔗 Open workflow:', `https://primary-production-8b46.up.railway.app/workflow/${result.id}`);
    console.log('\n📝 Note: Using /api/contractors/performance endpoint');
    console.log('   (Budget endpoints experiencing routing issues)');

    return result;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

deleteAndRecreate();
