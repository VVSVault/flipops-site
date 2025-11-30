/**
 * Comprehensive audit of all 8 workflows that need multi-tenant updates
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

interface WorkflowDetails {
  id: string;
  name: string;
  active: boolean;
  nodes: any[];
  connections: any;
  category: string;
}

async function auditAllWorkflows() {
  console.log('🔍 Detailed Workflow Audit for Multi-Tenant Migration\n');
  console.log('='.repeat(80) + '\n');

  const response = await fetch(`${N8N_BASE_URL}/workflows`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workflows: ${response.status}`);
  }

  const { data: workflows } = await response.json();
  const activeWorkflows = workflows.filter((w: any) => !w.isArchived);

  // Target workflows for update
  const targetNames = [
    'G1 - Deal Approval Alert',
    'G2 - Bid Spread Alert',
    'G3 - Invoice & Budget Guardian',
    'G4 - Change Order Gatekeeper',
    'Pipeline Monitoring',
    'Contractor Performance Tracking',
    'Data Refresh & Sync',
    'FlipOps - Skip Tracing'
  ];

  const workflowDetails: WorkflowDetails[] = [];

  for (const workflow of activeWorkflows) {
    if (targetNames.some(name => workflow.name.includes(name.split(' - ')[0]) || workflow.name === name)) {
      // Fetch full workflow details
      const detailResponse = await fetch(`${N8N_BASE_URL}/workflows/${workflow.id}`, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Accept': 'application/json'
        }
      });

      if (detailResponse.ok) {
        const detail = await detailResponse.json();

        let category = 'operations';
        if (workflow.name.includes('G1') || workflow.name.includes('G2') || workflow.name.includes('G3') || workflow.name.includes('G4')) {
          category = 'guardrails';
        } else if (workflow.name.includes('Pipeline') || workflow.name.includes('Contractor')) {
          category = 'monitoring';
        }

        workflowDetails.push({
          id: detail.id,
          name: detail.name,
          active: detail.active,
          nodes: detail.nodes,
          connections: detail.connections,
          category
        });
      }
    }
  }

  console.log(`📊 Found ${workflowDetails.length} workflows to update\n`);

  // Analyze each workflow
  for (const wf of workflowDetails) {
    console.log('\n' + '='.repeat(80));
    console.log(`📋 ${wf.name}`);
    console.log('='.repeat(80));
    console.log(`ID: ${wf.id}`);
    console.log(`Category: ${wf.category.toUpperCase()}`);
    console.log(`Status: ${wf.active ? '✅ Active' : '⏸️  Inactive'}`);
    console.log(`Nodes: ${wf.nodes.length}`);
    console.log('\n📌 Node Structure:');

    wf.nodes.forEach((node: any, i: number) => {
      console.log(`  ${i + 1}. ${node.name} (${node.type})`);

      // Highlight API calls and HTTP requests
      if (node.type === 'n8n-nodes-base.httpRequest') {
        const url = node.parameters?.url || 'N/A';
        const method = node.parameters?.method || 'GET';
        console.log(`     → ${method} ${url}`);
      }

      // Highlight webhooks
      if (node.type === 'n8n-nodes-base.webhook') {
        const path = node.parameters?.path || 'N/A';
        console.log(`     → Webhook path: ${path}`);
      }

      // Highlight Slack nodes
      if (node.name.toLowerCase().includes('slack')) {
        console.log(`     → ⚠️  NEEDS USER-SPECIFIC WEBHOOK`);
      }
    });

    // Analyze multi-tenant readiness
    console.log('\n🔍 Multi-Tenant Analysis:');

    const hasApiCalls = wf.nodes.some((n: any) => n.type === 'n8n-nodes-base.httpRequest');
    const hasWebhook = wf.nodes.some((n: any) => n.type === 'n8n-nodes-base.webhook');
    const hasSlack = wf.nodes.some((n: any) => n.name.toLowerCase().includes('slack'));
    const hasCode = wf.nodes.some((n: any) => n.type === 'n8n-nodes-base.code');

    const updates: string[] = [];

    if (hasWebhook) {
      updates.push('Add userId extraction from webhook payload');
    }
    if (hasApiCalls) {
      updates.push('Add userId to API query parameters/body');
    }
    if (hasSlack) {
      updates.push('Replace hardcoded Slack webhook with user-specific webhook lookup');
    }
    if (hasCode) {
      updates.push('Update code nodes to filter data by userId');
    }

    if (updates.length > 0) {
      console.log('  ⚠️  Required Updates:');
      updates.forEach(update => console.log(`     • ${update}`));
    } else {
      console.log('  ✅ No obvious multi-tenant issues detected');
    }

    // Show API endpoints being called
    const apiNodes = wf.nodes.filter((n: any) => n.type === 'n8n-nodes-base.httpRequest');
    if (apiNodes.length > 0) {
      console.log('\n🌐 API Endpoints:');
      apiNodes.forEach((node: any) => {
        const url = node.parameters?.url || 'N/A';
        const method = node.parameters?.method || 'GET';
        console.log(`  • ${method} ${url}`);
      });
    }
  }

  // Summary by category
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 SUMMARY BY CATEGORY');
  console.log('='.repeat(80) + '\n');

  const guardrails = workflowDetails.filter(w => w.category === 'guardrails');
  const monitoring = workflowDetails.filter(w => w.category === 'monitoring');
  const operations = workflowDetails.filter(w => w.category === 'operations');

  console.log(`🛡️  GUARDRAILS: ${guardrails.length} workflows`);
  guardrails.forEach(w => console.log(`   • ${w.name} (${w.nodes.length} nodes, ${w.active ? 'active' : 'inactive'})`));

  console.log(`\n📊 MONITORING: ${monitoring.length} workflows`);
  monitoring.forEach(w => console.log(`   • ${w.name} (${w.nodes.length} nodes, ${w.active ? 'active' : 'inactive'})`));

  console.log(`\n⚙️  OPERATIONS: ${operations.length} workflows`);
  operations.forEach(w => console.log(`   • ${w.name} (${w.nodes.length} nodes, ${w.active ? 'active' : 'inactive'})`));

  console.log('\n' + '='.repeat(80));
  console.log('🚀 NEXT STEPS');
  console.log('='.repeat(80));
  console.log(`
1. Update each workflow to:
   • Extract userId from webhook payload or context
   • Add userId filtering to all API calls
   • Replace hardcoded Slack webhooks with user-specific lookups
   • Update code nodes to respect data isolation

2. Deployment order:
   • Start with G1-G4 (critical for deal protection)
   • Then monitoring workflows (for visibility)
   • Finally operations workflows (for automation)

3. Testing:
   • Create 2 test users
   • Verify data isolation
   • Ensure alerts go to correct user
  `);
}

auditAllWorkflows().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
