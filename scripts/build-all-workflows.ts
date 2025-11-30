/**
 * Master Workflow Builder
 * Builds ALL 9 FlipOps workflows programmatically
 *
 * Usage:
 *   export N8N_API_KEY="your-key"
 *   npx tsx scripts/build-all-workflows.ts
 */

import { buildAttomPropertyDiscoveryWorkflowV2 } from './build-attom-workflow-v2';

const N8N_API_URL = process.env.N8N_BASE_URL || 'https://primary-production-8b46.up.railway.app/api/v1';
// Use the new never-expires API key (from APIs-and-Credentials.md)
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

const FO_API_BASE_URL = 'https://bb4c35d48e9c.ngrok-free.app';
const SLACK_WEBHOOK = 'https://hooks.slack.com/services/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';

// Store workflow IDs to update existing workflows instead of creating new ones
const WORKFLOW_IDS: Record<string, string> = {
  'G1 - Deal Approval Alert': 'bMguRTKgOG4fFMU2',
  'G2 - Bid Spread Alert': '8hXMk1O6SlCjbOhs',
  'G3 - Invoice & Budget Guardian': 'vvqi4QEb16A2jHbo',
  'G4 - Change Order Gatekeeper': 'WXEtnLHedF2AVFAK',
  'Pipeline Monitoring': 'JiBPkO0jlvlCZfjT',
  'Contractor Performance Tracking': 'UlVCiQTkNNm5kvAL',
  'Skip Tracing & Enrichment': 'qAfOjkKjQU9V4Mb4',
  'Data Refresh & Sync': 'TwWfbKedznM8gPjr',
  'ATTOM Property Discovery': 'ORNrSAWVXWeNqAb4'
};

interface WorkflowNode {
  parameters: any;
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: number[];
  credentials?: any;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  continueOnFail?: boolean;
}

interface Workflow {
  name: string;
  nodes: WorkflowNode[];
  connections: any;
  active: boolean;
  settings?: any;
}

async function upsertWorkflow(workflow: Workflow): Promise<any> {
  const workflowId = WORKFLOW_IDS[workflow.name];
  const isUpdate = !!workflowId;

  console.log(`\n${isUpdate ? '🔄 Updating' : '📝 Creating'} workflow: ${workflow.name}...`);

  try {
    // Remove 'active' field as it's read-only
    const { active, ...workflowData } = workflow;

    const url = isUpdate
      ? `${N8N_API_URL}/workflows/${workflowId}`
      : `${N8N_API_URL}/workflows`;

    const method = isUpdate ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify(workflowData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    const workflowUrl = `https://primary-production-8b46.up.railway.app/workflow/${result.id}`;
    console.log(`✅ ${isUpdate ? 'Updated' : 'Created'}: ${result.name} (ID: ${result.id})`);
    console.log(`   🔗 ${workflowUrl}`);
    return result;

  } catch (error: any) {
    console.error(`❌ Failed to ${isUpdate ? 'update' : 'create'} ${workflow.name}:`, error.message);
    return null;
  }
}

// ============================================================================
// WORKFLOW 1: G1 - Deal Approval Alert (P80 > maxExposureUsd)
// ============================================================================

function buildG1Workflow(): Workflow {
  return {
    name: 'G1 - Deal Approval Alert',
    active: false,
    settings: { executionOrder: 'v1' },
    nodes: [
      {
        parameters: {
          rule: {
            interval: [{ field: 'hours', hoursInterval: 12 }]
          }
        },
        id: 'schedule-trigger',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [240, 300]
      },
      {
        parameters: {
          method: 'GET',
          url: `${FO_API_BASE_URL}/api/deals/approve/status`,
          options: {
            headers: { 'ngrok-skip-browser-warning': 'true' }
          }
        },
        id: 'fetch-g1-status',
        name: 'Fetch G1 Status',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [460, 300]
      },
      {
        parameters: {
          conditions: {
            options: { typeValidation: 'strict' },
            conditions: [{
              id: 'has-blocked',
              leftValue: '={{ $json.summary.total }}',
              rightValue: 0,
              operator: { type: 'number', operation: 'gt' }
            }],
            combinator: 'and'
          }
        },
        id: 'check-if-blocked',
        name: 'Check If Any Blocked',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [680, 300]
      },
      {
        parameters: {
          jsCode: `const data = $input.first().json;
const summary = data.summary || {};
const blockedDeals = data.blockedDeals || [];

const blocks = [
  {
    type: "header",
    text: {
      type: "plain_text",
      text: "🚨 G1 Alert: Deals Blocked by Maximum Exposure"
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

// Add deal details
blockedDeals.slice(0, 10).forEach((deal, index) => {
  const overBy = deal.metrics.overBy ? \`$\${deal.metrics.overBy.toLocaleString()}\` : 'N/A';
  const overByPct = deal.metrics.overByPct ? \`\${deal.metrics.overByPct.toFixed(1)}%\` : 'N/A';
  const p80 = deal.metrics.p80 ? \`$\${deal.metrics.p80.toLocaleString()}\` : 'N/A';
  const maxExposure = deal.metrics.maxExposureUsd ? \`$\${deal.metrics.maxExposureUsd.toLocaleString()}\` : 'N/A';

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`*\${index + 1}. \${deal.address || 'Unknown Address'}*\\n💰 P80 Cost: \${p80}\\n⚠️ Max Exposure: \${maxExposure}\\n📊 Over By: \${overBy} (\${overByPct})\`
    }
  });
});

return { blocks };`
        },
        id: 'format-slack',
        name: 'Format Slack Alert',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [900, 250]
      },
      {
        parameters: {
          method: 'POST',
          url: SLACK_WEBHOOK,
          sendBody: true,
          bodyParameters: {
            parameters: [
              { name: 'blocks', value: '={{ $json.blocks }}' }
            ]
          },
          options: {}
        },
        id: 'send-to-slack',
        name: 'Send to Slack',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1120, 250]
      }
    ],
    connections: {
      'Schedule Trigger': {
        main: [[{ node: 'Fetch G1 Status', type: 'main', index: 0 }]]
      },
      'Fetch G1 Status': {
        main: [[{ node: 'Check If Any Blocked', type: 'main', index: 0 }]]
      },
      'Check If Any Blocked': {
        main: [[{ node: 'Format Slack Alert', type: 'main', index: 0 }], []]
      },
      'Format Slack Alert': {
        main: [[{ node: 'Send to Slack', type: 'main', index: 0 }]]
      }
    }
  };
}

// ============================================================================
// WORKFLOW 2: G2 - Bid Spread Alert (bid spread > 15%)
// ============================================================================

function buildG2Workflow(): Workflow {
  return {
    name: 'G2 - Bid Spread Alert',
    active: false,
    settings: { executionOrder: 'v1' },
    nodes: [
      {
        parameters: {
          rule: {
            interval: [{ field: 'hours', hoursInterval: 12 }]
          }
        },
        id: 'schedule-trigger',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [240, 300]
      },
      {
        parameters: {
          method: 'GET',
          url: `${FO_API_BASE_URL}/api/deals/bid-spread/status`,
          options: {
            headers: { 'ngrok-skip-browser-warning': 'true' }
          }
        },
        id: 'fetch-g2-status',
        name: 'Fetch Bid Spread Status',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [460, 300]
      },
      {
        parameters: {
          conditions: {
            options: { typeValidation: 'strict' },
            conditions: [{
              id: 'has-violations',
              leftValue: '={{ $json.summary.total }}',
              rightValue: 0,
              operator: { type: 'number', operation: 'gt' }
            }],
            combinator: 'and'
          }
        },
        id: 'check-if-violations',
        name: 'Check If Any Violations',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [680, 300]
      },
      {
        parameters: {
          jsCode: `const data = $input.first().json;
const summary = data.summary || {};
const violations = data.violations || [];

const blocks = [
  {
    type: "header",
    text: {
      type: "plain_text",
      text: "🚨 G2 Alert: Bid Spread Violations (>15%)"
    }
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`*Summary:*\\n• Total Violations: \${summary.total}\\n• Unique Deals: \${summary.uniqueDeals}\\n• Avg Spread: \${summary.avgSpread ? summary.avgSpread.toFixed(1) : 0}%\`
    }
  }
];

violations.slice(0, 10).forEach((violation, index) => {
  const spread = violation.bidSpread ? \`\${violation.bidSpread.toFixed(1)}%\` : 'N/A';
  const low = violation.lowestBid ? \`$\${violation.lowestBid.toLocaleString()}\` : 'N/A';
  const high = violation.highestBid ? \`$\${violation.highestBid.toLocaleString()}\` : 'N/A';

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`*\${index + 1}. \${violation.address || 'Unknown'}*\\n📊 Spread: \${spread}\\n💵 Range: \${low} - \${high}\\n🔢 Bids: \${violation.bidCount}\`
    }
  });
});

return { blocks };`
        },
        id: 'format-slack',
        name: 'Format Slack Alert',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [900, 250]
      },
      {
        parameters: {
          method: 'POST',
          url: SLACK_WEBHOOK,
          sendBody: true,
          bodyParameters: {
            parameters: [
              { name: 'blocks', value: '={{ $json.blocks }}' }
            ]
          },
          options: {}
        },
        id: 'send-to-slack',
        name: 'Send to Slack',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1120, 250]
      }
    ],
    connections: {
      'Schedule Trigger': {
        main: [[{ node: 'Fetch Bid Spread Status', type: 'main', index: 0 }]]
      },
      'Fetch Bid Spread Status': {
        main: [[{ node: 'Check If Any Violations', type: 'main', index: 0 }]]
      },
      'Check If Any Violations': {
        main: [[{ node: 'Format Slack Alert', type: 'main', index: 0 }], []]
      },
      'Format Slack Alert': {
        main: [[{ node: 'Send to Slack', type: 'main', index: 0 }]]
      }
    }
  };
}

// ============================================================================
// WORKFLOW 3: G3 - Invoice & Budget Guardian (budget variance > 10%)
// ============================================================================

function buildG3Workflow(): Workflow {
  return {
    name: 'G3 - Invoice & Budget Guardian',
    active: false,
    settings: { executionOrder: 'v1' },
    nodes: [
      {
        parameters: {
          rule: {
            interval: [{ field: 'days', daysInterval: 1 }]
          }
        },
        id: 'schedule-trigger',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [240, 300]
      },
      {
        parameters: {
          method: 'GET',
          url: `${FO_API_BASE_URL}/api/deals/budget-variance/status`,
          options: {
            headers: { 'ngrok-skip-browser-warning': 'true' }
          }
        },
        id: 'fetch-g3-status',
        name: 'Fetch Budget Variance Status',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [460, 300]
      },
      {
        parameters: {
          conditions: {
            options: { typeValidation: 'strict' },
            conditions: [{
              id: 'has-violations',
              leftValue: '={{ $json.summary.total }}',
              rightValue: 0,
              operator: { type: 'number', operation: 'gt' }
            }],
            combinator: 'and'
          }
        },
        id: 'check-if-violations',
        name: 'Check If Any Violations',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [680, 300]
      },
      {
        parameters: {
          jsCode: `const data = $input.first().json;
const summary = data.summary || {};
const violations = data.violations || [];

const blocks = [
  {
    type: "header",
    text: {
      type: "plain_text",
      text: "🚨 G3 Alert: Budget Variance Violations (>10%)"
    }
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`*Summary:*\\n• Total Violations: \${summary.total}\\n• Unique Deals: \${summary.uniqueDeals}\\n• Total Overage: $\${summary.totalOverage ? summary.totalOverage.toLocaleString() : 0}\\n• Avg Variance: \${summary.avgVariancePct ? summary.avgVariancePct.toFixed(1) : 0}%\`
    }
  }
];

violations.slice(0, 10).forEach((violation, index) => {
  const variance = violation.budgetVariance ? \`\${violation.budgetVariance.toFixed(1)}%\` : 'N/A';
  const budgeted = violation.budgetedCost ? \`$\${violation.budgetedCost.toLocaleString()}\` : 'N/A';
  const actual = violation.actualCost ? \`$\${violation.actualCost.toLocaleString()}\` : 'N/A';
  const overage = violation.overageAmount ? \`$\${violation.overageAmount.toLocaleString()}\` : 'N/A';

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`*\${index + 1}. \${violation.address || 'Unknown'}*\\n📊 Variance: \${variance}\\n💰 Budgeted: \${budgeted}\\n💸 Actual: \${actual}\\n⚠️ Overage: \${overage}\`
    }
  });
});

return { blocks };`
        },
        id: 'format-slack',
        name: 'Format Slack Alert',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [900, 250]
      },
      {
        parameters: {
          method: 'POST',
          url: SLACK_WEBHOOK,
          sendBody: true,
          bodyParameters: {
            parameters: [
              { name: 'blocks', value: '={{ $json.blocks }}' }
            ]
          },
          options: {}
        },
        id: 'send-to-slack',
        name: 'Send to Slack',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1120, 250]
      }
    ],
    connections: {
      'Schedule Trigger': {
        main: [[{ node: 'Fetch Budget Variance Status', type: 'main', index: 0 }]]
      },
      'Fetch Budget Variance Status': {
        main: [[{ node: 'Check If Any Violations', type: 'main', index: 0 }]]
      },
      'Check If Any Violations': {
        main: [[{ node: 'Format Slack Alert', type: 'main', index: 0 }], []]
      },
      'Format Slack Alert': {
        main: [[{ node: 'Send to Slack', type: 'main', index: 0 }]]
      }
    }
  };
}

// ============================================================================
// WORKFLOW 4: G4 - Change Order Gatekeeper (pending approvals)
// ============================================================================

function buildG4Workflow(): Workflow {
  return {
    name: 'G4 - Change Order Gatekeeper',
    active: false,
    settings: { executionOrder: 'v1' },
    nodes: [
      {
        parameters: {
          rule: {
            interval: [{ field: 'hours', hoursInterval: 6 }]
          }
        },
        id: 'schedule-trigger',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [240, 300]
      },
      {
        parameters: {
          method: 'GET',
          url: `${FO_API_BASE_URL}/api/deals/change-orders/status`,
          options: {
            headers: { 'ngrok-skip-browser-warning': 'true' }
          }
        },
        id: 'fetch-g4-status',
        name: 'Fetch Change Orders Status',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [460, 300]
      },
      {
        parameters: {
          conditions: {
            options: { typeValidation: 'strict' },
            conditions: [{
              id: 'has-pending',
              leftValue: '={{ $json.summary.total }}',
              rightValue: 0,
              operator: { type: 'number', operation: 'gt' }
            }],
            combinator: 'and'
          }
        },
        id: 'check-if-pending',
        name: 'Check If Any Pending',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [680, 300]
      },
      {
        parameters: {
          jsCode: `const data = $input.first().json;
const summary = data.summary || {};
const pendingApprovals = data.pendingApprovals || [];

const blocks = [
  {
    type: "header",
    text: {
      type: "plain_text",
      text: "🚨 G4 Alert: Pending Change Order Approvals"
    }
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`*Summary:*\\n• Total Pending: \${summary.total}\\n• Unique Deals: \${summary.uniqueDeals}\\n• Total Impact: $\${summary.totalImpact ? summary.totalImpact.toLocaleString() : 0}\`
    }
  }
];

pendingApprovals.slice(0, 10).forEach((co, index) => {
  const delta = co.deltaUsd ? \`$\${co.deltaUsd.toLocaleString()}\` : 'N/A';
  const impact = co.impactPct ? \`\${co.impactPct.toFixed(1)}%\` : 'N/A';

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`*\${index + 1}. \${co.address || 'Unknown'}*\\n🔧 Trade: \${co.trade || 'N/A'}\\n💰 Cost Impact: \${delta} (\${impact})\\n📅 Schedule Impact: \${co.impactDays || 0} days\\n📝 Reason: \${co.reason || 'N/A'}\`
    }
  });
});

return { blocks };`
        },
        id: 'format-slack',
        name: 'Format Slack Alert',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [900, 250]
      },
      {
        parameters: {
          method: 'POST',
          url: SLACK_WEBHOOK,
          sendBody: true,
          bodyParameters: {
            parameters: [
              { name: 'blocks', value: '={{ $json.blocks }}' }
            ]
          },
          options: {}
        },
        id: 'send-to-slack',
        name: 'Send to Slack',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1120, 250]
      }
    ],
    connections: {
      'Schedule Trigger': {
        main: [[{ node: 'Fetch Change Orders Status', type: 'main', index: 0 }]]
      },
      'Fetch Change Orders Status': {
        main: [[{ node: 'Check If Any Pending', type: 'main', index: 0 }]]
      },
      'Check If Any Pending': {
        main: [[{ node: 'Format Slack Alert', type: 'main', index: 0 }], []]
      },
      'Format Slack Alert': {
        main: [[{ node: 'Send to Slack', type: 'main', index: 0 }]]
      }
    }
  };
}

// ============================================================================
// WORKFLOW 5: Pipeline Monitoring (stalled deals)
// ============================================================================

function buildPipelineMonitoringWorkflow(): Workflow {
  return {
    name: 'Pipeline Monitoring',
    active: false,
    settings: { executionOrder: 'v1' },
    nodes: [
      {
        parameters: {
          rule: {
            interval: [{ field: 'days', daysInterval: 1 }]
          }
        },
        id: 'schedule-trigger',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [240, 300]
      },
      {
        parameters: {
          method: 'GET',
          url: `${FO_API_BASE_URL}/api/deals/stalled`,
          options: {
            headers: { 'ngrok-skip-browser-warning': 'true' }
          }
        },
        id: 'fetch-stalled',
        name: 'Fetch Stalled Deals',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [460, 300]
      },
      {
        parameters: {
          conditions: {
            options: { typeValidation: 'strict' },
            conditions: [{
              id: 'has-stalled',
              leftValue: '={{ $json.summary.total }}',
              rightValue: 0,
              operator: { type: 'number', operation: 'gt' }
            }],
            combinator: 'and'
          }
        },
        id: 'check-if-stalled',
        name: 'Check If Any Stalled',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [680, 300]
      },
      {
        parameters: {
          jsCode: `const data = $input.first().json;
const summary = data.summary || {};
const stalledDeals = data.stalledDeals || [];

const blocks = [
  {
    type: "header",
    text: {
      type: "plain_text",
      text: "📊 Pipeline Monitoring: Stalled Deals Report"
    }
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`*Summary:*\\n• Total Stalled: \${summary.total}\\n• G1: \${summary.G1} | G2: \${summary.G2} | G3: \${summary.G3} | G4: \${summary.G4}\`
    }
  }
];

stalledDeals.slice(0, 10).forEach((deal, index) => {
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`*\${index + 1}. \${deal.address || 'Unknown'}*\\n🚪 Gate: \${deal.gate}\\n⏱️ Days in Gate: \${deal.daysInGate}\\n⚠️ Threshold: \${deal.threshold} days\`
    }
  });
});

return { blocks };`
        },
        id: 'format-slack',
        name: 'Format Slack Alert',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [900, 250]
      },
      {
        parameters: {
          method: 'POST',
          url: SLACK_WEBHOOK,
          sendBody: true,
          bodyParameters: {
            parameters: [
              { name: 'blocks', value: '={{ $json.blocks }}' }
            ]
          },
          options: {}
        },
        id: 'send-to-slack',
        name: 'Send to Slack',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1120, 250]
      }
    ],
    connections: {
      'Schedule Trigger': {
        main: [[{ node: 'Fetch Stalled Deals', type: 'main', index: 0 }]]
      },
      'Fetch Stalled Deals': {
        main: [[{ node: 'Check If Any Stalled', type: 'main', index: 0 }]]
      },
      'Check If Any Stalled': {
        main: [[{ node: 'Format Slack Alert', type: 'main', index: 0 }], []]
      },
      'Format Slack Alert': {
        main: [[{ node: 'Send to Slack', type: 'main', index: 0 }]]
      }
    }
  };
}

// ============================================================================
// WORKFLOW 6: Contractor Performance Tracking
// ============================================================================

function buildContractorPerformanceWorkflow(): Workflow {
  return {
    name: 'Contractor Performance Tracking',
    active: false,
    settings: { executionOrder: 'v1' },
    nodes: [
      {
        parameters: {
          rule: {
            interval: [{ field: 'days', daysInterval: 1 }]
          }
        },
        id: 'schedule-trigger',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [240, 300]
      },
      {
        parameters: {
          method: 'GET',
          url: `${FO_API_BASE_URL}/api/contractors/performance`,
          options: {
            headers: { 'ngrok-skip-browser-warning': 'true' }
          }
        },
        id: 'fetch-performance',
        name: 'Fetch Contractor Performance',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [460, 300]
      },
      {
        parameters: {
          conditions: {
            options: { typeValidation: 'strict' },
            conditions: [{
              id: 'has-flagged',
              leftValue: '={{ $json.flaggedCount }}',
              rightValue: 0,
              operator: { type: 'number', operation: 'gt' }
            }],
            combinator: 'and'
          }
        },
        id: 'check-if-flagged',
        name: 'Check If Any Flagged',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [680, 300]
      },
      {
        parameters: {
          jsCode: `const axios = require('axios');
const data = $input.first().json;
const contractors = (data.contractors || []).filter(c => c.flags && c.flags.length > 0);
const FO_API_BASE_URL = '${FO_API_BASE_URL}';
const FO_API_KEY = 'fo_live_10177805c8d743e1a6e1860515dc2b3f';

const results = [];

for (const contractor of contractors) {
  try {
    // Calculate new reliability score based on performance metrics
    // Reliability = average of onTimePct and onBudgetPct, adjusted for budget variance
    let newReliability = (contractor.onTimePct + contractor.onBudgetPct) / 2;

    // Penalize for budget overruns
    if (contractor.budgetVariance > 15) {
      newReliability = Math.max(0, newReliability - 10);
    }

    // Penalize for high change orders
    if (contractor.flags.includes('HIGH_CHANGE_ORDERS')) {
      newReliability = Math.max(0, newReliability - 5);
    }

    // Update contractor score in database
    const updateResponse = await axios.put(
      \`\${FO_API_BASE_URL}/api/contractors/\${contractor.vendorId}/update-score\`,
      {
        onTimePct: contractor.onTimePct,
        onBudgetPct: contractor.onBudgetPct,
        reliability: Math.round(newReliability)
      },
      {
        headers: {
          'x-api-key': FO_API_KEY,
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json'
        }
      }
    );

    results.push({
      success: true,
      vendorId: contractor.vendorId,
      vendorName: contractor.vendorName,
      oldReliability: contractor.currentReliability,
      newReliability: Math.round(newReliability),
      delta: Math.round(newReliability) - contractor.currentReliability,
      flags: contractor.flags
    });
  } catch (error) {
    results.push({
      success: false,
      vendorId: contractor.vendorId,
      vendorName: contractor.vendorName,
      error: error.message
    });
  }
}

const successes = results.filter(r => r.success);
const failures = results.filter(r => !r.success);

return {
  processed: results.length,
  successes: successes.length,
  failures: failures.length,
  results,
  successDetails: successes
};`
        },
        id: 'update-scores',
        name: 'Update Contractor Scores',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [900, 250]
      },
      {
        parameters: {
          jsCode: `const data = $input.first().json;

const blocks = [
  {
    type: "header",
    text: {
      type: "plain_text",
      text: "⚠️ Contractor Performance: Scores Updated"
    }
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`*Summary:*\\n• Contractors Processed: \${data.processed}\\n• ✅ Successful: \${data.successes}\\n• ❌ Failed: \${data.failures}\`
    }
  }
];

if (data.successDetails && data.successDetails.length > 0) {
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*Score Updates:*"
    }
  });

  data.successDetails.slice(0, 5).forEach((result, index) => {
    const deltaSymbol = result.delta > 0 ? '📈' : '📉';
    const deltaText = result.delta > 0 ? \`+\${result.delta}\` : \`\${result.delta}\`;
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: \`*\${index + 1}. \${result.vendorName}*\\n\${deltaSymbol} Reliability: \${result.oldReliability}% → \${result.newReliability}% (\${deltaText})\\n🚩 Flags: \${result.flags.join(', ')}\`
      }
    });
  });

  if (data.successDetails.length > 5) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: \`_...and \${data.successDetails.length - 5} more contractors updated_\`
      }
    });
  }
}

return { blocks };`
        },
        id: 'format-slack',
        name: 'Format Slack Alert',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [1120, 250]
      },
      {
        parameters: {
          method: 'POST',
          url: SLACK_WEBHOOK,
          sendBody: true,
          bodyParameters: {
            parameters: [
              { name: 'blocks', value: '={{ $json.blocks }}' }
            ]
          },
          options: {}
        },
        id: 'send-to-slack',
        name: 'Send to Slack',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1340, 250]
      }
    ],
    connections: {
      'Schedule Trigger': {
        main: [[{ node: 'Fetch Contractor Performance', type: 'main', index: 0 }]]
      },
      'Fetch Contractor Performance': {
        main: [[{ node: 'Check If Any Flagged', type: 'main', index: 0 }]]
      },
      'Check If Any Flagged': {
        main: [[{ node: 'Update Contractor Scores', type: 'main', index: 0 }], []]
      },
      'Update Contractor Scores': {
        main: [[{ node: 'Format Slack Alert', type: 'main', index: 0 }]]
      },
      'Format Slack Alert': {
        main: [[{ node: 'Send to Slack', type: 'main', index: 0 }]]
      }
    }
  };
}

// ============================================================================
// WORKFLOW 7: Skip Tracing & Enrichment
// ============================================================================

function buildSkipTracingWorkflow(): Workflow {
  const FO_API_KEY = 'fo_live_10177805c8d743e1a6e1860515dc2b3f';

  return {
    name: 'Skip Tracing & Enrichment',
    active: false,
    settings: { executionOrder: 'v1' },
    nodes: [
      {
        parameters: {
          rule: {
            interval: [{ field: 'weeks', weeksInterval: 1 }]
          }
        },
        id: 'schedule-trigger',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [240, 300]
      },
      {
        parameters: {
          method: 'GET',
          url: `${FO_API_BASE_URL}/api/properties/needs-skip-trace?limit=20`,
          authentication: 'none',
          sendHeaders: true,
          headerParameters: {
            parameters: [
              { name: 'ngrok-skip-browser-warning', value: 'true' },
              { name: 'x-api-key', value: FO_API_KEY }
            ]
          },
          options: {
            response: {
              response: {
                responseFormat: 'json'
              }
            }
          }
        },
        id: 'fetch-properties',
        name: 'Fetch Properties Needing Skip Trace',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [460, 300]
      },
      {
        parameters: {
          conditions: {
            options: { typeValidation: 'strict' },
            conditions: [{
              id: 'has-properties',
              leftValue: '={{ $json.count }}',
              rightValue: 0,
              operator: { type: 'number', operation: 'gt' }
            }],
            combinator: 'and'
          }
        },
        id: 'check-if-properties',
        name: 'Check If Any Properties',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [680, 300]
      },
      {
        parameters: {
          jsCode: `const axios = require('axios');
const data = $input.first().json;
const properties = data.data || []; // API returns 'data' field, not 'properties'
const FO_API_BASE_URL = '${FO_API_BASE_URL}';
const FO_API_KEY = '${FO_API_KEY}';
const BATCHDATA_API_KEY = 'eprRFqavyw9vLUP1bZcoUycLJp6EMJxmmnhUGHDy';

const results = [];

for (const property of properties) {
  try {
    // Call BatchData API for skip trace
    const skipTraceResponse = await axios.post(
      'https://api.batchdata.com/api/v1/property/skip-trace',
      {
        address: property.address,
        city: property.city,
        state: property.state,
        zip: property.zip
      },
      {
        headers: { 'Authorization': \`Bearer \${BATCHDATA_API_KEY}\` }
      }
    );

    // Extract contact info from BatchData response
    const phoneNumbers = skipTraceResponse.data.phones || [];
    const emails = skipTraceResponse.data.emails || [];

    // Save results to FlipOps database
    await axios.post(
      \`\${FO_API_BASE_URL}/api/properties/\${property.id}/skip-trace\`,
      {
        phoneNumbers,
        emails,
        enrichedAt: new Date().toISOString()
      },
      {
        headers: {
          'x-api-key': FO_API_KEY,
          'ngrok-skip-browser-warning': 'true'
        }
      }
    );

    results.push({
      success: true,
      id: property.id,
      address: property.address,
      phonesFound: phoneNumbers.length,
      emailsFound: emails.length
    });
  } catch (error) {
    results.push({
      success: false,
      id: property.id,
      address: property.address,
      error: error.message
    });
  }
}

const successes = results.filter(r => r.success);
const failures = results.filter(r => !r.success);
const totalCost = results.length * 0.20;

return {
  processed: results.length,
  successes: successes.length,
  failures: failures.length,
  cost: totalCost,
  costFormatted: \`$\${totalCost.toFixed(2)}\`,
  results,
  successDetails: successes
};`
        },
        id: 'process-skip-trace',
        name: 'Process Skip Trace with BatchData',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [900, 250]
      },
      {
        parameters: {
          jsCode: `const data = $input.first().json;

const blocks = [
  {
    type: "header",
    text: {
      type: "plain_text",
      text: "🔍 Skip Tracing Batch Complete"
    }
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`*Summary:*\\n• Properties Processed: \${data.processed}\\n• ✅ Successful: \${data.successes}\\n• ❌ Failed: \${data.failures}\\n• 💰 Total Cost: \${data.costFormatted}\`
    }
  }
];

if (data.successDetails && data.successDetails.length > 0) {
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*Enriched Properties:*"
    }
  });

  data.successDetails.slice(0, 5).forEach((result, index) => {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: \`\${index + 1}. *\${result.address}*\\n📞 Phones: \${result.phonesFound} | ✉️ Emails: \${result.emailsFound}\`
      }
    });
  });

  if (data.successDetails.length > 5) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: \`_...and \${data.successDetails.length - 5} more properties enriched_\`
      }
    });
  }
}

return { blocks };`
        },
        id: 'format-slack',
        name: 'Format Slack Summary',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [1120, 250]
      },
      {
        parameters: {
          method: 'POST',
          url: SLACK_WEBHOOK,
          sendBody: true,
          bodyParameters: {
            parameters: [
              { name: 'blocks', value: '={{ $json.blocks }}' }
            ]
          },
          options: {}
        },
        id: 'send-to-slack',
        name: 'Send to Slack',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1340, 250]
      }
    ],
    connections: {
      'Schedule Trigger': {
        main: [[{ node: 'Fetch Properties Needing Skip Trace', type: 'main', index: 0 }]]
      },
      'Fetch Properties Needing Skip Trace': {
        main: [[{ node: 'Check If Any Properties', type: 'main', index: 0 }]]
      },
      'Check If Any Properties': {
        main: [[{ node: 'Process Skip Trace with BatchData', type: 'main', index: 0 }], []]
      },
      'Process Skip Trace with BatchData': {
        main: [[{ node: 'Format Slack Summary', type: 'main', index: 0 }]]
      },
      'Format Slack Summary': {
        main: [[{ node: 'Send to Slack', type: 'main', index: 0 }]]
      }
    }
  };
}

// ============================================================================
// WORKFLOW 8: Data Refresh & Sync
// ============================================================================

function buildDataRefreshWorkflow(): Workflow {
  return {
    name: 'Data Refresh & Sync',
    active: false,
    settings: { executionOrder: 'v1' },
    nodes: [
      {
        parameters: {
          rule: {
            interval: [{ field: 'days', daysInterval: 1 }]
          }
        },
        id: 'schedule-trigger',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [240, 300]
      },
      {
        parameters: {
          method: 'GET',
          url: `${FO_API_BASE_URL}/api/deals/active`,
          options: {
            headers: { 'ngrok-skip-browser-warning': 'true' }
          }
        },
        id: 'fetch-active-deals',
        name: 'Fetch Active Deals',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [460, 300]
      },
      {
        parameters: {
          conditions: {
            options: { typeValidation: 'strict' },
            conditions: [{
              id: 'has-deals',
              leftValue: '={{ $json.count }}',
              rightValue: 0,
              operator: { type: 'number', operation: 'gt' }
            }],
            combinator: 'and'
          }
        },
        id: 'check-if-deals',
        name: 'Check If Any Deals',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [680, 300]
      },
      {
        parameters: {
          jsCode: `const axios = require('axios');
const data = $input.first().json;
const deals = data.deals || [];
const FO_API_BASE_URL = '${FO_API_BASE_URL}';
const FO_API_KEY = 'fo_live_10177805c8d743e1a6e1860515dc2b3f';

const results = [];

for (const deal of deals) {
  try {
    // Call the refresh endpoint for each deal
    const refreshResponse = await axios.post(
      \`\${FO_API_BASE_URL}/api/deals/\${deal.id}/refresh\`,
      {}, // Empty body - endpoint will just update timestamp
      {
        headers: {
          'x-api-key': FO_API_KEY,
          'ngrok-skip-browser-warning': 'true'
        }
      }
    );

    results.push({
      success: true,
      dealId: deal.id,
      address: deal.address,
      updatedAt: refreshResponse.data.updatedAt
    });
  } catch (error) {
    results.push({
      success: false,
      dealId: deal.id,
      address: deal.address,
      error: error.message
    });
  }
}

const successes = results.filter(r => r.success);
const failures = results.filter(r => !r.success);

return {
  processed: results.length,
  successes: successes.length,
  failures: failures.length,
  results,
  successDetails: successes
};`
        },
        id: 'refresh-deal-data',
        name: 'Refresh Deal Data',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [900, 250]
      },
      {
        parameters: {
          jsCode: `const data = $input.first().json;

const blocks = [
  {
    type: "header",
    text: {
      type: "plain_text",
      text: "🔄 Data Refresh Complete"
    }
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: \`*Summary:*\\n• Deals Processed: \${data.processed}\\n• ✅ Successful: \${data.successes}\\n• ❌ Failed: \${data.failures}\`
    }
  }
];

if (data.successDetails && data.successDetails.length > 0) {
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*Refreshed Deals:*"
    }
  });

  data.successDetails.slice(0, 5).forEach((result, index) => {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: \`\${index + 1}. *\${result.address}*\\n🔄 Updated at: \${new Date(result.updatedAt).toLocaleString()}\`
      }
    });
  });

  if (data.successDetails.length > 5) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: \`_...and \${data.successDetails.length - 5} more deals refreshed_\`
      }
    });
  }
}

return { blocks };`
        },
        id: 'format-slack',
        name: 'Format Slack Message',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [1120, 250]
      },
      {
        parameters: {
          method: 'POST',
          url: SLACK_WEBHOOK,
          sendBody: true,
          bodyParameters: {
            parameters: [
              { name: 'blocks', value: '={{ $json.blocks }}' }
            ]
          },
          options: {}
        },
        id: 'send-to-slack',
        name: 'Send to Slack',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1340, 250]
      }
    ],
    connections: {
      'Schedule Trigger': {
        main: [[{ node: 'Fetch Active Deals', type: 'main', index: 0 }]]
      },
      'Fetch Active Deals': {
        main: [[{ node: 'Check If Any Deals', type: 'main', index: 0 }]]
      },
      'Check If Any Deals': {
        main: [[{ node: 'Refresh Deal Data', type: 'main', index: 0 }], []]
      },
      'Refresh Deal Data': {
        main: [[{ node: 'Format Slack Message', type: 'main', index: 0 }]]
      },
      'Format Slack Message': {
        main: [[{ node: 'Send to Slack', type: 'main', index: 0 }]]
      }
    }
  };
}

// ============================================================================
// WORKFLOW 9: ATTOM Property Discovery (Personalized Lead Generation)
// ============================================================================

function buildAttomPropertyDiscoveryWorkflow(): Workflow {
  const FO_API_KEY = 'fo_live_10177805c8d743e1a6e1860515dc2b3f';
  const ATTOM_API_KEY = '72403894efb4b2cfeb4b5b41f105a53a';

  return {
    name: 'ATTOM Property Discovery',
    active: false,
    settings: { executionOrder: 'v1' },
    nodes: [
      // 1. Schedule Trigger - Daily at 6am
      {
        parameters: {
          rule: {
            interval: [{ field: 'days', daysInterval: 1 }],
            hour: 6,
            minute: 0
          }
        },
        id: 'schedule-trigger',
        name: 'Schedule Daily Discovery',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [240, 400]
      },

      // 2. Fetch Active Users
      {
        parameters: {
          method: 'GET',
          url: `${FO_API_BASE_URL}/api/users`,
          authentication: 'none',
          sendHeaders: true,
          headerParameters: {
            parameters: [
              { name: 'ngrok-skip-browser-warning', value: 'true' },
              { name: 'x-api-key', value: FO_API_KEY }
            ]
          },
          options: {
            response: {
              response: {
                responseFormat: 'json'
              }
            }
          }
        },
        id: 'fetch-users',
        name: 'Fetch Active Users',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [460, 400]
      },

      // 3. Filter Active Users (exclude System Default, must have investorProfile)
      {
        parameters: {
          jsCode: `// Safety check for UI preview mode
if (!$input.all().length) {
  return [];
}

const data = $input.first().json;
const users = data.users || [];

// Filter for active users with investor profiles
const activeUsers = users.filter(user => {
  return user.id !== 'system-default-user' &&
         user.onboarded === true &&
         user.investorProfile !== null &&
         user.investorProfile !== undefined &&
         user.targetMarkets !== null;
});

// If no active users, return empty array to stop workflow
if (activeUsers.length === 0) {
  return [];
}

// Map users to workflow format
return activeUsers.map(user => ({
  json: {
    userId: user.id,
    email: user.email,
    name: user.name,
    targetMarkets: typeof user.targetMarkets === 'string' ? JSON.parse(user.targetMarkets) : user.targetMarkets,
    investorProfile: typeof user.investorProfile === 'string' ? JSON.parse(user.investorProfile) : user.investorProfile,
    minScore: user.minScore || 65,
    slackWebhook: user.slackWebhook
  }
}));`
        },
        id: 'filter-users',
        name: 'Filter Active Users',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [680, 400]
      },

      // 4. Build ATTOM Query (Extract ZIP codes from investor profile)
      {
        parameters: {
          jsCode: `// Safety check for UI preview mode
if (!$input.all().length) {
  return [];
}

const user = $input.first().json;

// Get ZIP codes directly from investorProfile.targetZipCodes
// This is set during client onboarding when they provide their target markets
const targetZipCodes = user.investorProfile?.targetZipCodes || [];

if (targetZipCodes.length === 0) {
  console.warn(\`User \${user.userId} has no targetZipCodes in investorProfile\`);
  return [{
    json: {
      ...user,
      zips: [],
      totalZips: 0,
      error: 'No target ZIP codes configured for this user'
    }
  }];
}

// Limit to first 20 ZIPs per run to avoid API rate limits
// If user has more than 20 ZIPs, they'll be processed in rotation
const zips = targetZipCodes.slice(0, 20);

return [{
  json: {
    ...user,
    zips: zips,
    totalZips: zips.length
  }
}];`
        },
        id: 'build-query',
        name: 'Build ATTOM Query',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [900, 400]
      },

      // 5. Split ZIPs for parallel processing
      {
        parameters: {
          jsCode: `// Safety check for UI preview mode
if (!$input.all().length) {
  return [];
}

const userData = $input.first().json;
const zips = userData.zips || [];

// If no ZIPs, return empty array to stop workflow for this user
if (zips.length === 0) {
  console.warn('No ZIP codes for user:', userData.userId);
  return [];
}

// Split into individual items, one per ZIP
return zips.map(zip => ({
  json: {
    ...userData,
    currentZip: zip
  }
}));`
        },
        id: 'split-zips',
        name: 'Loop Through ZIPs',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [1120, 400]
      },

      // 6. Fetch from ATTOM API (Sales Snapshot)
      {
        parameters: {
          jsCode: `const axios = require('axios');

// Safety check for UI preview mode
if (!$input.all().length) {
  return [];
}

const userData = $input.first().json;
const zip = userData.currentZip;
const profile = userData.investorProfile;
const ATTOM_API_KEY = '${ATTOM_API_KEY}';

try {
  // Build ATTOM API query with filters
  const params = new URLSearchParams({
    postalcode: zip,
    pagesize: '20'
  });

  // Add price filters if investor has preferences
  if (profile.priceRanges && profile.priceRanges.length > 0) {
    const primaryRange = profile.priceRanges[0];
    if (primaryRange.min) params.append('minprice', primaryRange.min.toString());
    if (primaryRange.max) params.append('maxprice', primaryRange.max.toString());
  }

  const response = await axios.get(
    \`https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot?\${params.toString()}\`,
    {
      headers: {
        'apikey': ATTOM_API_KEY,
        'Accept': 'application/json'
      }
    }
  );

  const properties = response.data.property || [];

  return [{
    json: {
      userData,
      properties,
      zip,
      count: properties.length
    }
  }];

} catch (error) {
  console.error('ATTOM API Error:', error.message);
  return [{
    json: {
      userData,
      properties: [],
      zip,
      count: 0,
      error: error.message
    }
  }];
}`
        },
        id: 'fetch-attom',
        name: 'Fetch from ATTOM API',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [1340, 400]
      },

      // 7. Batch Enrich & Score Properties
      {
        parameters: {
          jsCode: `const axios = require('axios');

// Safety check for UI preview mode
if (!$input.all().length) {
  return [];
}

const data = $input.first().json;
const userData = data.userData;
const properties = data.properties || [];
const profile = userData.investorProfile;
const ATTOM_API_KEY = '${ATTOM_API_KEY}';

/**
 * Calculate match score based on investor profile
 * Returns 0-100 score
 */
function calculateMatchScore(property, profile) {
  let score = 0;

  // Price Match (30 points)
  if (profile.priceRanges && profile.priceRanges.length > 0) {
    for (const range of profile.priceRanges) {
      const price = property.sale?.amount?.saleamt || 0;
      if (price >= range.min && price <= range.max) {
        score += 30 * (range.weight || 1.0);
        break;
      }
    }
  }

  // Distress Indicators (40 points max)
  const distress = profile.distressIndicators || {};
  const propData = property.assessment?.assessed || {};

  if (propData.taxyear && parseInt(propData.taxyear) < new Date().getFullYear() - 1) {
    score += (distress.taxDelinquent || 0.8) * 8.5;
  }

  if (propData.owner?.mailingAddress &&
      propData.owner.mailingAddress !== property.address?.oneLine) {
    score += (distress.absenteeOwner || 0.6) * 7.5;
  }

  // Property Characteristics (15 points)
  const chars = profile.preferredCharacteristics || {};
  const building = property.building || {};

  if (chars.beds && building.rooms?.beds) {
    const beds = parseInt(building.rooms.beds);
    if (beds >= (chars.beds.min || 0) && beds <= (chars.beds.max || 10)) {
      score += 5;
    }
  }

  if (chars.sqft && building.size?.livingsize) {
    const sqft = parseInt(building.size.livingsize);
    if (sqft >= (chars.sqft.min || 0) && sqft <= (chars.sqft.max || 10000)) {
      score += 5;
    }
  }

  if (chars.yearBuilt && building.summary?.yearbuilt) {
    const year = parseInt(building.summary.yearbuilt);
    if (year >= (chars.yearBuilt.min || 1900) && year <= (chars.yearBuilt.max || 2025)) {
      score += 5;
    }
  }

  // Equity Potential (15 points)
  const salePrice = property.sale?.amount?.saleamt || 0;
  const avm = property.avm?.amount?.value || salePrice;

  if (salePrice > 0 && avm > 0) {
    const equityPercent = ((avm - salePrice) / avm) * 100;
    const equityReq = profile.equityRequirements || {};

    if (equityPercent >= (equityReq.preferredEquityPercent || 40)) {
      score += 15;
    } else if (equityPercent >= (equityReq.minEquityPercent || 20)) {
      score += 8;
    }
  }

  return Math.round(score);
}

/**
 * Transform ATTOM property to FlipOps format
 */
function transformProperty(property, matchScore) {
  const address = property.address || {};
  const sale = property.sale || {};
  const assessment = property.assessment?.assessed || {};
  const building = property.building || {};

  return {
    address: address.line1 || '',
    city: address.locality || '',
    state: address.countrySubd || '',
    zip: address.postal1 || '',
    county: address.country || '',
    apn: property.identifier?.apn || null,
    ownerName: assessment.owner?.name || null,
    propertyType: building.summary?.propertyType || null,
    bedrooms: building.rooms?.beds ? parseInt(building.rooms.beds) : null,
    bathrooms: building.rooms?.bathstotal ? parseFloat(building.rooms.bathstotal) : null,
    squareFeet: building.size?.livingsize ? parseInt(building.size.livingsize) : null,
    lotSize: property.lot?.lotsize1 ? parseInt(property.lot.lotsize1) : null,
    yearBuilt: building.summary?.yearbuilt ? parseInt(building.summary.yearbuilt) : null,
    assessedValue: assessment.market?.mktttlvalue ? parseFloat(assessment.market.mktttlvalue) : null,
    taxAmount: assessment.tax?.taxtotal ? parseFloat(assessment.tax.taxtotal) : null,
    lastSaleDate: sale.date?.salerecdate || null,
    lastSalePrice: sale.amount?.saleamt ? parseFloat(sale.amount.saleamt) : null,
    estimatedValue: property.avm?.amount?.value ? parseFloat(property.avm.amount.value) : null,
    foreclosure: false,
    preForeclosure: false,
    taxDelinquent: assessment.taxyear ? parseInt(assessment.taxyear) < new Date().getFullYear() - 1 : false,
    vacant: false,
    bankruptcy: false,
    absenteeOwner: assessment.owner?.mailingAddress ?
      assessment.owner.mailingAddress !== address.oneLine : false,
    sourceId: property.identifier?.attomId || null,
    metadata: {
      matchScore,
      attomId: property.identifier?.attomId,
      fips: property.identifier?.fips
    }
  };
}

// Process all properties
const scoredProperties = [];

for (const property of properties) {
  try {
    // Calculate match score
    const matchScore = calculateMatchScore(property, profile);

    // Only process properties that meet minimum score
    if (matchScore >= userData.minScore) {
      const transformed = transformProperty(property, matchScore);
      scoredProperties.push({
        ...transformed,
        score: matchScore
      });
    }
  } catch (error) {
    console.error('Property scoring error:', error.message);
  }
}

// Sort by score (highest first) and limit to daily max
const dailyMax = profile.leadPreferences?.dailyMaxLeads || 20;
const topProperties = scoredProperties
  .sort((a, b) => b.score - a.score)
  .slice(0, dailyMax);

return [{
  json: {
    userData,
    zip: data.zip,
    totalProperties: properties.length,
    qualifiedProperties: scoredProperties.length,
    topProperties,
    averageScore: scoredProperties.length > 0 ?
      Math.round(scoredProperties.reduce((sum, p) => sum + p.score, 0) / scoredProperties.length) : 0
  }
}];`
        },
        id: 'enrich-score',
        name: 'Batch Enrich & Score',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [1560, 400]
      },

      // 8. Aggregate All ZIPs
      {
        parameters: {
          aggregate: 'aggregateAllItemData'
        },
        id: 'aggregate-zips',
        name: 'Aggregate All ZIPs',
        type: 'n8n-nodes-base.aggregate',
        typeVersion: 1,
        position: [1780, 400]
      },

      // 9. Check If Any Qualified Properties
      {
        parameters: {
          jsCode: `// Safety check for UI preview mode
if (!$input.all().length) {
  return [];
}

const data = $input.all();

// Combine all topProperties from all ZIPs
let allProperties = [];
let userData = null;

for (const item of data) {
  if (item.json.topProperties && item.json.topProperties.length > 0) {
    allProperties = allProperties.concat(item.json.topProperties);
  }
  if (item.json.userData && !userData) {
    userData = item.json.userData;
  }
}

// Remove duplicates and sort by score
const uniqueProperties = [];
const seen = new Set();

for (const prop of allProperties) {
  const key = \`\${prop.address}-\${prop.city}-\${prop.state}-\${prop.zip}\`;
  if (!seen.has(key)) {
    seen.add(key);
    uniqueProperties.push(prop);
  }
}

uniqueProperties.sort((a, b) => b.score - a.score);

// Limit to daily max
const dailyMax = userData?.investorProfile?.leadPreferences?.dailyMaxLeads || 20;
const finalProperties = uniqueProperties.slice(0, dailyMax);

return [{
  json: {
    userData,
    hasProperties: finalProperties.length > 0,
    count: finalProperties.length,
    properties: finalProperties,
    stats: {
      totalProcessed: allProperties.length,
      uniqueFound: uniqueProperties.length,
      finalCount: finalProperties.length,
      averageScore: finalProperties.length > 0 ?
        Math.round(finalProperties.reduce((sum, p) => sum + p.score, 0) / finalProperties.length) : 0
    }
  }
}];`
        },
        id: 'check-qualified',
        name: 'Check If Any Qualified',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [2000, 400]
      },

      // 10. Filter: Has Properties?
      {
        parameters: {
          conditions: {
            options: { typeValidation: 'strict' },
            conditions: [{
              id: 'has-properties',
              leftValue: '={{ $json.hasProperties }}',
              rightValue: true,
              operator: { type: 'boolean', operation: 'equal' }
            }],
            combinator: 'and'
          }
        },
        id: 'if-has-properties',
        name: 'Has Qualified Properties?',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [2220, 400]
      },

      // 11. Ingest Properties to FlipOps Database
      {
        parameters: {
          jsCode: `const axios = require('axios');

// Safety check for UI preview mode
if (!$input.all().length) {
  return [];
}

const data = $input.first().json;
const userData = data.userData;
const properties = data.properties || [];
const FO_API_BASE_URL = '${FO_API_BASE_URL}';
const FO_API_KEY = '${FO_API_KEY}';

try {
  // Remove score field before sending to API (it's in metadata)
  const propertiesForIngest = properties.map(p => {
    const { score, ...rest } = p;
    return rest;
  });

  const response = await axios.post(
    \`\${FO_API_BASE_URL}/api/properties/ingest\`,
    {
      userId: userData.userId,
      source: 'attom',
      properties: propertiesForIngest
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': FO_API_KEY,
        'ngrok-skip-browser-warning': 'true'
      }
    }
  );

  return [{
    json: {
      userData,
      ingestResult: response.data,
      properties: properties.slice(0, 5), // Only include top 5 for notification
      stats: data.stats
    }
  }];

} catch (error) {
  console.error('Ingest Error:', error.message);
  return [{
    json: {
      userData,
      error: error.message,
      properties: properties.slice(0, 5),
      stats: data.stats
    }
  }];
}`
        },
        id: 'ingest-properties',
        name: 'Ingest Properties',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [2440, 300]
      },

      // 12. Send Slack Notification
      {
        parameters: {
          jsCode: `// Safety check for UI preview mode
if (!$input.all().length) {
  return [];
}

const data = $input.first().json;
const userData = data.userData;
const ingestResult = data.ingestResult || {};
const properties = data.properties || [];
const stats = data.stats || {};

// Format top properties for Slack
const propertyList = properties.map((p, i) =>
  \`\${i + 1}. *\${p.address}, \${p.city}, \${p.state}* - Score: \${p.score}/100 (\$\${p.lastSalePrice?.toLocaleString() || 'N/A'})\`
).join('\\n');

const message = {
  text: \`🏘️ ATTOM Property Discovery - New Leads Found\`,
  blocks: [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🏘️ ATTOM Property Discovery - Daily Report'
      }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: \`*Investor:*\\n\${userData.name || userData.email}\` },
        { type: 'mrkdwn', text: \`*Properties Found:*\\n\${stats.finalCount} qualified leads\` },
        { type: 'mrkdwn', text: \`*Average Score:*\\n\${stats.averageScore}/100\` },
        { type: 'mrkdwn', text: \`*Ingested:*\\n\${ingestResult.results?.created || 0} new, \${ingestResult.results?.updated || 0} updated\` }
      ]
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: \`*Top Properties:*\\n\${propertyList}\`
      }
    },
    {
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: \`Processed \${stats.totalProcessed} properties across \${userData.totalZips} ZIP codes | Min Score: \${userData.minScore}\`
      }]
    }
  ]
};

return [{
  json: message
}];`
        },
        id: 'format-slack',
        name: 'Format Slack Message',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [2660, 300]
      },

      // 13. Send to Slack
      {
        parameters: {
          method: 'POST',
          url: SLACK_WEBHOOK,
          authentication: 'none',
          sendBody: true,
          bodyParameters: {
            parameters: [
              { name: 'payload', value: '={{ JSON.stringify($json) }}' }
            ]
          },
          options: {}
        },
        id: 'send-slack',
        name: 'Send to Slack',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [2880, 300]
      }
    ],

    connections: {
      'Schedule Daily Discovery': {
        main: [[{ node: 'Fetch Active Users', type: 'main', index: 0 }]]
      },
      'Fetch Active Users': {
        main: [[{ node: 'Filter Active Users', type: 'main', index: 0 }]]
      },
      'Filter Active Users': {
        main: [[{ node: 'Build ATTOM Query', type: 'main', index: 0 }]]
      },
      'Build ATTOM Query': {
        main: [[{ node: 'Loop Through ZIPs', type: 'main', index: 0 }]]
      },
      'Loop Through ZIPs': {
        main: [[{ node: 'Fetch from ATTOM API', type: 'main', index: 0 }]]
      },
      'Fetch from ATTOM API': {
        main: [[{ node: 'Batch Enrich & Score', type: 'main', index: 0 }]]
      },
      'Batch Enrich & Score': {
        main: [[{ node: 'Aggregate All ZIPs', type: 'main', index: 0 }]]
      },
      'Aggregate All ZIPs': {
        main: [[{ node: 'Check If Any Qualified', type: 'main', index: 0 }]]
      },
      'Check If Any Qualified': {
        main: [[{ node: 'Has Qualified Properties?', type: 'main', index: 0 }]]
      },
      'Has Qualified Properties?': {
        main: [
          [{ node: 'Ingest Properties', type: 'main', index: 0 }],
          []
        ]
      },
      'Ingest Properties': {
        main: [[{ node: 'Format Slack Message', type: 'main', index: 0 }]]
      },
      'Format Slack Message': {
        main: [[{ node: 'Send to Slack', type: 'main', index: 0 }]]
      }
    }
  };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🔨 FlipOps Workflow Builder');
  console.log('==========================\n');
  console.log(`n8n API: ${N8N_API_URL}`);
  console.log(`FlipOps API: ${FO_API_BASE_URL}\n`);

  const workflows = [
    { name: 'G1 - Deal Approval Alert', builder: buildG1Workflow },
    { name: 'G2 - Bid Spread Alert', builder: buildG2Workflow },
    { name: 'G3 - Invoice & Budget Guardian', builder: buildG3Workflow },
    { name: 'G4 - Change Order Gatekeeper', builder: buildG4Workflow },
    { name: 'Pipeline Monitoring', builder: buildPipelineMonitoringWorkflow },
    { name: 'Contractor Performance Tracking', builder: buildContractorPerformanceWorkflow },
    { name: 'Skip Tracing & Enrichment', builder: buildSkipTracingWorkflow },
    { name: 'Data Refresh & Sync', builder: buildDataRefreshWorkflow },
    { name: 'ATTOM Property Discovery', builder: buildAttomPropertyDiscoveryWorkflowV2 }
  ];

  const results = [];

  for (const workflow of workflows) {
    const workflowData = workflow.builder();
    const result = await upsertWorkflow(workflowData);
    results.push(result);

    // Wait 500ms between operations to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const successful = results.filter(r => r !== null);
  const updated = successful.filter(w => WORKFLOW_IDS[w.name]);
  const created = successful.filter(w => !WORKFLOW_IDS[w.name]);

  console.log('\n\n📊 Build Summary:');
  console.log(`   ✅ Successful: ${successful.length}/${workflows.length}`);
  console.log(`   🔄 Updated: ${updated.length}`);
  console.log(`   📝 Created: ${created.length}`);
  console.log(`   ❌ Failed: ${workflows.length - successful.length}/${workflows.length}`);

  if (successful.length > 0) {
    console.log(`\n✅ Workflow URLs:`);
    successful.forEach(w => {
      const url = `https://primary-production-8b46.up.railway.app/workflow/${w.id}`;
      console.log(`   - ${w.name}: ${url}`);
    });
  }

  console.log(`\n🔗 View all workflows: https://primary-production-8b46.up.railway.app/workflows`);
  console.log('\n💾 Next step: Run backup script');
  console.log('   npx tsx scripts/backup-workflows-to-git.ts\n');
}

main().catch(console.error);
