const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const LOCAL_API_URL = 'https://5f678aead65f.ngrok-free.app'; // Current ngrok URL
const SLACK_WEBHOOK = 'https://hooks.slack.com/services/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';

async function createBudgetAlertWorkflow() {
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

      // 2. Fetch Budget Status
      {
        parameters: {
          method: 'GET',
          url: `${LOCAL_API_URL}/api/projects/budget-status`,
          authentication: 'none',
          options: {},
        },
        id: 'fetch-budget-status',
        name: 'Fetch Budget Status',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [460, 300],
      },

      // 3. Process Flagged Projects
      {
        parameters: {
          jsCode: `const response = $input.first().json;
const projects = response.projects || [];
const flagged = projects.filter(p => p.flag !== null);

// Add metadata to each flagged project
const processedProjects = flagged.map(project => {
  let emoji = '⚠️';
  let statusText = 'Warning';

  if (project.status === 'critical') {
    emoji = '🔴';
    statusText = 'Critical';
  }

  return {
    ...project,
    emoji,
    statusText,
    totalProjects: projects.length,
    flaggedCount: flagged.length,
    healthyCount: response.healthyCount,
  };
});

return processedProjects.map(p => ({ json: p }));`,
        },
        id: 'process-flagged',
        name: 'Process Flagged Projects',
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
            text: "✅ Budget Alert: All Projects Healthy"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "All projects are within budget. No action required."
          }
        }
      ]
    }
  }];
}

const firstItem = items[0]?.json || {};
const totalProjects = firstItem.totalProjects || 0;
const flaggedCount = firstItem.flaggedCount || 0;
const healthyCount = firstItem.healthyCount || 0;

// Build project details
const projectBlocks = items.map(item => {
  const p = item.json;
  const overBudget = p.variance > 0 ? \`Over by $\${Math.abs(p.variance).toLocaleString()}\` : \`Under by $\${Math.abs(p.variance).toLocaleString()}\`;

  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`\${p.emoji} *\${p.address}*\\n• Budget: $\${p.budgetedCost.toLocaleString()} | Spent: $\${p.actualCost.toLocaleString()}\\n• Utilization: *\${p.utilization}%* (\${p.statusText})\\n• \${overBudget}\\n• Type: \${p.type} | Region: \${p.region}\`
    }
  };
});

const message = {
  blocks: [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🚨 Budget Alert: Projects Need Attention"
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: \`*Summary:*\\n• Total Projects: \${totalProjects}\\n• Healthy: \${healthyCount}\\n• Flagged: \${flaggedCount}\`
      }
    },
    {
      type: "divider"
    },
    ...projectBlocks,
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
        main: [[{ node: 'Fetch Budget Status', type: 'main', index: 0 }]],
      },
      'Fetch Budget Status': {
        main: [[{ node: 'Process Flagged Projects', type: 'main', index: 0 }]],
      },
      'Process Flagged Projects': {
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

  try {
    const response = await fetch(`${N8N_API_URL}/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY,
      },
      body: JSON.stringify(workflow),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create workflow: ${response.status} ${error}`);
    }

    const result = await response.json();
    console.log('✅ Budget Alert Workflow created successfully!');
    console.log('Workflow ID:', result.id);
    console.log('Workflow Name:', result.name);

    // Activate the workflow
    const activateResponse = await fetch(`${N8N_API_URL}/workflows/${result.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY,
      },
      body: JSON.stringify({ active: true }),
    });

    if (activateResponse.ok) {
      console.log('✅ Workflow activated successfully!');
    }

    return result;
  } catch (error) {
    console.error('❌ Error creating workflow:', error);
    throw error;
  }
}

createBudgetAlertWorkflow();
