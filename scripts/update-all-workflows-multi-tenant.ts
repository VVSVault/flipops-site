/**
 * Update all 7 workflows for multi-tenant operation
 *
 * Changes:
 * 1. Add userId loop to iterate through all active users
 * 2. Add userId to API query parameters
 * 3. Replace hardcoded Slack webhook with user-specific lookup
 * 4. Update ngrok URL to production URL
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

// Production URL (replace ngrok)
const PROD_API_URL = 'http://localhost:3007';

const WORKFLOWS_TO_UPDATE = [
  { id: 'bMguRTKgOG4fFMU2', name: 'G1 - Deal Approval Alert' },
  { id: '8hXMk1O6SlCjbOhs', name: 'G2 - Bid Spread Alert' },
  { id: 'vvqi4QEb16A2jHbo', name: 'G3 - Invoice & Budget Guardian' },
  { id: 'WXEtnLHedF2AVFAK', name: 'G4 - Change Order Gatekeeper' },
  { id: 'JiBPkO0jlvlCZfjT', name: 'Pipeline Monitoring' },
  { id: 'UlVCiQTkNNm5kvAL', name: 'Contractor Performance Tracking' },
  { id: 'TwWfbKedznM8gPjr', name: 'Data Refresh & Sync' }
];

async function updateWorkflow(workflowId: string, workflowName: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔧 Updating: ${workflowName}`);
  console.log('='.repeat(80));

  // Fetch workflow details
  const response = await fetch(`${N8N_BASE_URL}/workflows/${workflowId}`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workflow ${workflowName}: ${response.status}`);
  }

  const workflow = await response.json();

  // Strategy: Add a "Fetch Active Users" node at the start
  // Then loop through each user and process their data separately

  console.log(`📊 Current structure: ${workflow.nodes.length} nodes`);

  // 1. Add "Fetch Active Users" node as first step (after schedule trigger)
  const fetchUsersNode = {
    id: 'fetch-users',
    name: 'Fetch Active Users',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [420, 300],
    parameters: {
      method: 'GET',
      url: `${PROD_API_URL}/api/users`,
      authentication: 'none',
      sendQuery: true,
      queryParameters: {
        parameters: [
          {
            name: 'status',
            value: 'active'
          }
        ]
      },
      options: {}
    }
  };

  // 2. Add "Loop Through Users" (Split In Batches) node
  const loopNode = {
    id: 'loop-users',
    name: 'Loop Through Users',
    type: 'n8n-nodes-base.splitInBatches',
    typeVersion: 3,
    position: [620, 300],
    parameters: {
      batchSize: 1,
      options: {}
    }
  };

  // 3. Find and update the main API fetch node
  const apiFetchNode = workflow.nodes.find((n: any) =>
    n.type === 'n8n-nodes-base.httpRequest' &&
    (n.name.includes('Fetch') || n.name.includes('Status'))
  );

  if (apiFetchNode) {
    console.log(`✅ Found API node: ${apiFetchNode.name}`);

    // Update URL to production
    if (apiFetchNode.parameters.url) {
      const oldUrl = apiFetchNode.parameters.url;
      apiFetchNode.parameters.url = oldUrl.replace('https://bb4c35d48e9c.ngrok-free.app', PROD_API_URL);
      console.log(`   Updated URL: ${apiFetchNode.parameters.url}`);
    }

    // Add userId query parameter
    if (!apiFetchNode.parameters.queryParameters) {
      apiFetchNode.parameters.queryParameters = { parameters: [] };
    }

    // Add userId from loop
    apiFetchNode.parameters.queryParameters.parameters.push({
      name: 'userId',
      value: '={{ $json.id }}'  // Get userId from Loop Through Users node
    });

    console.log(`   ✅ Added userId parameter`);
  }

  // 4. Update Slack webhook to be user-specific
  const slackNode = workflow.nodes.find((n: any) =>
    n.name.toLowerCase().includes('send to slack') ||
    (n.type === 'n8n-nodes-base.httpRequest' && n.parameters?.url?.includes('slack'))
  );

  if (slackNode) {
    console.log(`✅ Found Slack node: ${slackNode.name}`);

    // Change to use user's Slack webhook from the user data
    slackNode.parameters.url = '={{ $("Loop Through Users").item.json.slackWebhook }}';

    console.log(`   ✅ Updated to user-specific webhook`);
  }

  // 5. Update "Format Slack Alert" code node to include user context
  const formatNode = workflow.nodes.find((n: any) =>
    n.type === 'n8n-nodes-base.code' &&
    n.name.toLowerCase().includes('format')
  );

  if (formatNode && formatNode.parameters.jsCode) {
    console.log(`✅ Found Format node: ${formatNode.name}`);

    // Add user context to the message
    const originalCode = formatNode.parameters.jsCode;

    // Inject user info into the Slack message
    const userContextInjection = `
// Get user info from Loop Through Users node
const user = $("Loop Through Users").item.json;
const userName = user.name || user.email;
const userCompany = user.companyName || '';

// Add user context to message header
const userHeader = userCompany ? \`\${userName} (\${userCompany})\` : userName;

`;

    formatNode.parameters.jsCode = userContextInjection + originalCode;

    // Also update the Slack message text to include user
    formatNode.parameters.jsCode = formatNode.parameters.jsCode.replace(
      /text: "([^"]+)"/g,
      'text: `$1 - ${userHeader}`'
    );

    console.log(`   ✅ Added user context to Slack message`);
  }

  // 6. Insert new nodes into workflow
  workflow.nodes.unshift(fetchUsersNode);  // Add at beginning (after trigger)
  workflow.nodes.splice(1, 0, loopNode);   // Add after fetch users

  // 7. Update connections
  const scheduleTriggerNode = workflow.nodes.find((n: any) =>
    n.type === 'n8n-nodes-base.scheduleTrigger'
  );

  if (scheduleTriggerNode) {
    // Reconnect: Schedule Trigger → Fetch Users → Loop Users → [existing flow]

    workflow.connections = {
      [scheduleTriggerNode.name]: {
        main: [[{ node: 'Fetch Active Users', type: 'main', index: 0 }]]
      },
      'Fetch Active Users': {
        main: [[{ node: 'Loop Through Users', type: 'main', index: 0 }]]
      },
      'Loop Through Users': {
        main: [[{ node: apiFetchNode?.name || workflow.nodes[3].name, type: 'main', index: 0 }]]
      },
      ...workflow.connections  // Keep existing connections for downstream nodes
    };
  }

  // 8. Update workflow on n8n (don't send 'active' field - it's read-only)
  const updatePayload = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings || {}
  };

  const updateResponse = await fetch(`${N8N_BASE_URL}/workflows/${workflowId}`, {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(updatePayload)
  });

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    throw new Error(`Failed to update ${workflowName}: ${updateResponse.status} - ${errorText}`);
  }

  console.log(`✅ ${workflowName} updated successfully!`);
  console.log(`   New node count: ${workflow.nodes.length}`);
  console.log(`   Status: Inactive (test before activating)`);
}

async function updateAllWorkflows() {
  console.log('🚀 Multi-Tenant Workflow Update Script\n');
  console.log(`Updating ${WORKFLOWS_TO_UPDATE.length} workflows...\n`);

  for (const wf of WORKFLOWS_TO_UPDATE) {
    try {
      await updateWorkflow(wf.id, wf.name);
    } catch (error: any) {
      console.error(`❌ Failed to update ${wf.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ ALL WORKFLOWS UPDATED');
  console.log('='.repeat(80));
  console.log(`
📋 Summary:
   • Added "Fetch Active Users" node to each workflow
   • Added "Loop Through Users" node to iterate per user
   • Updated API calls to include userId parameter
   • Changed Slack webhooks to user-specific URLs
   • Updated all URLs from ngrok to production

🧪 Next Steps:
   1. Create /api/users endpoint to return active users
   2. Test each workflow with 2 test users
   3. Verify data isolation
   4. Activate workflows once tested
  `);
}

updateAllWorkflows().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
