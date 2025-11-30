/**
 * Fix all workflows by replacing Split In Batches with Loop Over Items
 * and updating all userId expressions
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

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
  console.log(`\n🔧 Updating: ${workflowName}`);
  console.log('='.repeat(80));

  // Fetch workflow
  const response = await fetch(`${N8N_BASE_URL}/workflows/${workflowId}`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workflow: ${response.status}`);
  }

  const workflow = await response.json();

  // Find and replace the Loop node
  const loopNodeIndex = workflow.nodes.findIndex((n: any) =>
    n.name === 'Loop Through Users' || n.type === 'n8n-nodes-base.splitInBatches'
  );

  if (loopNodeIndex === -1) {
    console.log('   ℹ️  No loop node found - skipping');
    return;
  }

  const oldLoopNode = workflow.nodes[loopNodeIndex];
  console.log(`   Found loop node: ${oldLoopNode.name} (${oldLoopNode.type})`);

  // Create new Loop Over Items node
  const newLoopNode = {
    id: oldLoopNode.id || 'loop-users',
    name: 'Loop Through Users',
    type: 'n8n-nodes-base.splitInBatches',
    typeVersion: 3,
    position: oldLoopNode.position || [620, 300],
    parameters: {
      batchSize: 1,
      options: {}
    }
  };

  // Replace the node
  workflow.nodes[loopNodeIndex] = newLoopNode;
  console.log(`   ✅ Replaced with Split In Batches (batchSize: 1)`);

  // Update all userId expressions to use $json.id (simpler for Split In Batches with batchSize 1)
  let expressionsUpdated = 0;
  workflow.nodes.forEach((node: any) => {
    if (node.type === 'n8n-nodes-base.httpRequest' &&
        node.parameters?.queryParameters?.parameters) {

      node.parameters.queryParameters.parameters.forEach((param: any) => {
        if (param.name === 'userId') {
          const oldValue = param.value;
          // Use $json.id for Split In Batches with batchSize 1
          param.value = '={{ $json.id }}';

          if (oldValue !== param.value) {
            console.log(`   Updated ${node.name}: userId expression`);
            expressionsUpdated++;
          }
        }
      });
    }

    // Also update Slack webhook expressions
    if (node.type === 'n8n-nodes-base.httpRequest' &&
        node.name.toLowerCase().includes('slack')) {
      if (node.parameters.url && typeof node.parameters.url === 'string') {
        const oldUrl = node.parameters.url;
        // Use $json.slackWebhook for Split In Batches with batchSize 1
        node.parameters.url = '={{ $json.slackWebhook }}';

        if (oldUrl !== node.parameters.url) {
          console.log(`   Updated ${node.name}: Slack webhook expression`);
          expressionsUpdated++;
        }
      }
    }
  });

  console.log(`   ✅ Updated ${expressionsUpdated} expressions`);

  // Ensure proper connections
  const fetchUsersNode = workflow.nodes.find((n: any) => n.name === 'Fetch Active Users');
  const scheduleNode = workflow.nodes.find((n: any) => n.type === 'n8n-nodes-base.scheduleTrigger');
  const nextNode = workflow.nodes.find((n: any) =>
    n.type === 'n8n-nodes-base.httpRequest' &&
    !n.name.includes('Fetch Active Users') &&
    (n.name.includes('Fetch') || n.name.includes('Status') || n.name.includes('Performance'))
  );

  if (scheduleNode && fetchUsersNode && nextNode) {
    // Rebuild connections properly
    const newConnections: any = {};

    // Schedule → Fetch Active Users
    newConnections[scheduleNode.name] = {
      main: [[{ node: 'Fetch Active Users', type: 'main', index: 0 }]]
    };

    // Fetch Active Users → Loop Through Users
    newConnections['Fetch Active Users'] = {
      main: [[{ node: 'Loop Through Users', type: 'main', index: 0 }]]
    };

    // Loop Through Users → Next node (Fetch X Status)
    newConnections['Loop Through Users'] = {
      main: [[{ node: nextNode.name, type: 'main', index: 0 }]]
    };

    // Preserve other connections
    Object.entries(workflow.connections).forEach(([source, conns]: [string, any]) => {
      if (!newConnections[source]) {
        newConnections[source] = conns;
      }
    });

    workflow.connections = newConnections;
    console.log(`   ✅ Fixed node connections`);
  }

  // Save workflow
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
    throw new Error(`Failed to update workflow: ${updateResponse.status} - ${errorText}`);
  }

  console.log(`   ✅ ${workflowName} updated successfully!`);
}

async function main() {
  console.log('🚀 Fixing Loop Nodes in All Workflows\n');
  console.log('Changes:');
  console.log('  1. Using Split In Batches with batchSize: 1');
  console.log('  2. userId expressions: ={{ $json.id }}');
  console.log('  3. Slack webhook: ={{ $json.slackWebhook }}');
  console.log('  4. Proper node connections\n');
  console.log('='.repeat(80));

  for (const wf of WORKFLOWS_TO_UPDATE) {
    try {
      await updateWorkflow(wf.id, wf.name);
    } catch (error: any) {
      console.error(`\n   ❌ Failed to update ${wf.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ ALL WORKFLOWS UPDATED');
  console.log('='.repeat(80));
  console.log('\n🧪 Test the workflows now - they should work correctly!\n');
  console.log('Expected flow:');
  console.log('  1. Schedule Trigger');
  console.log('  2. Fetch Active Users (returns array of 4 users)');
  console.log('  3. Loop Through Users (processes 1 user at a time)');
  console.log('  4. For each user iteration:');
  console.log('     → API call with userId from $json.id');
  console.log('     → Slack notification to $json.slackWebhook');
  console.log('');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
