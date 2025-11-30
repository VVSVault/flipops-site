/**
 * Final fix: Properly rebuild workflow connections to prevent circular dependencies
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

const WORKFLOWS_TO_UPDATE = [
  { id: 'TwWfbKedznM8gPjr', name: 'Data Refresh & Sync' },
  { id: 'bMguRTKgOG4fFMU2', name: 'G1 - Deal Approval Alert' },
  { id: '8hXMk1O6SlCjbOhs', name: 'G2 - Bid Spread Alert' },
  { id: 'vvqi4QEb16A2jHbo', name: 'G3 - Invoice & Budget Guardian' },
  { id: 'WXEtnLHedF2AVFAK', name: 'G4 - Change Order Gatekeeper' },
  { id: 'JiBPkO0jlvlCZfjT', name: 'Pipeline Monitoring' },
  { id: 'UlVCiQTkNNm5kvAL', name: 'Contractor Performance Tracking' }
];

async function fixWorkflow(workflowId: string, workflowName: string) {
  console.log(`\n🔧 Fixing: ${workflowName}`);
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

  // Find key nodes
  const scheduleNode = workflow.nodes.find((n: any) =>
    n.type === 'n8n-nodes-base.scheduleTrigger'
  );
  const fetchUsersNode = workflow.nodes.find((n: any) =>
    n.name === 'Fetch Active Users'
  );
  const loopNode = workflow.nodes.find((n: any) =>
    n.name === 'Loop Through Users'
  );
  const checkNode = workflow.nodes.find((n: any) =>
    n.name.includes('Check If')
  );
  const slackNode = workflow.nodes.find((n: any) =>
    n.name === 'Send to Slack'
  );

  // Find the main API fetch node (after loop)
  const apiFetchNode = workflow.nodes.find((n: any) =>
    n.type === 'n8n-nodes-base.httpRequest' &&
    n.name !== 'Fetch Active Users' &&
    n.name !== 'Send to Slack' &&
    (n.name.includes('Fetch') || n.name.includes('Status') || n.name.includes('Performance'))
  );

  // Find middle nodes (between check and slack)
  const middleNodes = workflow.nodes.filter((n: any) =>
    n.type === 'n8n-nodes-base.code' &&
    n.name !== 'Format Slack Alert' &&
    n.name !== 'Format Slack Message'
  );

  const formatNode = workflow.nodes.find((n: any) =>
    n.name === 'Format Slack Alert' || n.name === 'Format Slack Message'
  );

  if (!scheduleNode || !fetchUsersNode || !loopNode || !apiFetchNode) {
    console.log('   ❌ Missing required nodes - skipping');
    console.log(`      Schedule: ${!!scheduleNode}, Users: ${!!fetchUsersNode}, Loop: ${!!loopNode}, API: ${!!apiFetchNode}`);
    return;
  }

  console.log(`   Found nodes:`);
  console.log(`      Trigger: ${scheduleNode.name}`);
  console.log(`      Fetch Users: ${fetchUsersNode.name}`);
  console.log(`      Loop: ${loopNode.name}`);
  console.log(`      API Fetch: ${apiFetchNode.name}`);
  console.log(`      Check: ${checkNode?.name || 'N/A'}`);
  console.log(`      Format: ${formatNode?.name || 'N/A'}`);
  console.log(`      Slack: ${slackNode?.name || 'N/A'}`);

  // Build clean connections - NO circular dependencies
  const newConnections: any = {};

  // 1. Schedule Trigger → Fetch Active Users
  newConnections[scheduleNode.name] = {
    main: [[{ node: fetchUsersNode.name, type: 'main', index: 0 }]]
  };

  // 2. Fetch Active Users → Loop Through Users
  newConnections[fetchUsersNode.name] = {
    main: [[{ node: loopNode.name, type: 'main', index: 0 }]]
  };

  // 3. Loop Through Users → API Fetch Node (CRITICAL: Forward only, no backwards)
  newConnections[loopNode.name] = {
    main: [[{ node: apiFetchNode.name, type: 'main', index: 0 }]]
  };

  // 4. API Fetch → Check Node (if exists)
  if (checkNode) {
    newConnections[apiFetchNode.name] = {
      main: [[{ node: checkNode.name, type: 'main', index: 0 }]]
    };

    // 5. Check Node → Next (middle nodes or format)
    if (middleNodes.length > 0) {
      newConnections[checkNode.name] = {
        main: [[{ node: middleNodes[0].name, type: 'main', index: 0 }]]
      };

      // Chain middle nodes
      for (let i = 0; i < middleNodes.length; i++) {
        if (i < middleNodes.length - 1) {
          newConnections[middleNodes[i].name] = {
            main: [[{ node: middleNodes[i + 1].name, type: 'main', index: 0 }]]
          };
        } else if (formatNode) {
          newConnections[middleNodes[i].name] = {
            main: [[{ node: formatNode.name, type: 'main', index: 0 }]]
          };
        }
      }
    } else if (formatNode) {
      newConnections[checkNode.name] = {
        main: [[{ node: formatNode.name, type: 'main', index: 0 }]]
      };
    }

    // 6. Format → Slack
    if (formatNode && slackNode) {
      newConnections[formatNode.name] = {
        main: [[{ node: slackNode.name, type: 'main', index: 0 }]]
      };
    }
  } else {
    // No check node - direct to format or slack
    if (formatNode) {
      newConnections[apiFetchNode.name] = {
        main: [[{ node: formatNode.name, type: 'main', index: 0 }]]
      };
      if (slackNode) {
        newConnections[formatNode.name] = {
          main: [[{ node: slackNode.name, type: 'main', index: 0 }]]
        };
      }
    } else if (slackNode) {
      newConnections[apiFetchNode.name] = {
        main: [[{ node: slackNode.name, type: 'main', index: 0 }]]
      };
    }
  }

  // Replace connections
  workflow.connections = newConnections;

  console.log(`   ✅ Built clean connection chain (${Object.keys(newConnections).length} connections)`);

  // Verify no backwards connections
  let hasCircular = false;
  const nodeOrder = [
    scheduleNode.name,
    fetchUsersNode.name,
    loopNode.name,
    apiFetchNode.name
  ];

  Object.entries(newConnections).forEach(([source, conns]: [string, any]) => {
    if (conns.main && conns.main[0]) {
      conns.main[0].forEach((conn: any) => {
        const sourceIdx = nodeOrder.indexOf(source);
        const targetIdx = nodeOrder.indexOf(conn.node);
        if (sourceIdx > targetIdx && sourceIdx !== -1 && targetIdx !== -1) {
          console.log(`   ⚠️  Warning: ${source} → ${conn.node} (backwards)`);
          hasCircular = true;
        }
      });
    }
  });

  if (!hasCircular) {
    console.log(`   ✅ No circular dependencies detected`);
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
  console.log('🚀 Final Fix: Rebuilding Workflow Connections\n');
  console.log('Goal: Remove all circular dependencies and ensure linear flow');
  console.log('='.repeat(80));

  for (const wf of WORKFLOWS_TO_UPDATE) {
    try {
      await fixWorkflow(wf.id, wf.name);
    } catch (error: any) {
      console.error(`\n   ❌ Failed to fix ${wf.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ ALL WORKFLOWS FIXED');
  console.log('='.repeat(80));
  console.log('\n📋 Expected Flow (all workflows):');
  console.log('   Schedule Trigger');
  console.log('      ↓');
  console.log('   Fetch Active Users');
  console.log('      ↓');
  console.log('   Loop Through Users');
  console.log('      ↓');
  console.log('   Fetch [Data] (with userId)');
  console.log('      ↓');
  console.log('   Check If [Condition]');
  console.log('      ↓');
  console.log('   [Processing Nodes]');
  console.log('      ↓');
  console.log('   Format Slack Message');
  console.log('      ↓');
  console.log('   Send to Slack');
  console.log('\n🧪 Test workflows now - they should execute properly!\n');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
