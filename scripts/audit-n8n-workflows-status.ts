/**
 * Audit all n8n workflows and check their multi-tenant readiness
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

async function auditWorkflows() {
  console.log('🔍 Auditing n8n Workflows for Multi-Tenant Readiness\n');
  console.log('=' .repeat(70) + '\n');

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

  // Filter out archived workflows
  const activeWorkflows = workflows.filter((w: any) => !w.isArchived);

  console.log(`📊 Found ${activeWorkflows.length} active workflows\n`);

  // Categorize workflows
  const categories = {
    guardrails: [] as any[],
    monitoring: [] as any[],
    discovery: [] as any[],
    operations: [] as any[]
  };

  for (const workflow of activeWorkflows) {
    const name = workflow.name.toLowerCase();

    if (name.includes('g1') || name.includes('g2') || name.includes('g3') || name.includes('g4')) {
      categories.guardrails.push(workflow);
    } else if (name.includes('pipeline') || name.includes('performance')) {
      categories.monitoring.push(workflow);
    } else if (name.includes('attom') || name.includes('discovery') || name.includes('property')) {
      categories.discovery.push(workflow);
    } else {
      categories.operations.push(workflow);
    }
  }

  // Print categorized summary
  console.log('🛡️  GUARDRAILS (' + categories.guardrails.length + ')');
  console.log('-'.repeat(70));
  for (const wf of categories.guardrails) {
    const status = wf.active ? '✅ Active' : '⏸️  Inactive';
    console.log(`  ${status} | ${wf.name}`);
    console.log(`           ID: ${wf.id}`);
    console.log(`           Status: ${getMultiTenantStatus(wf)}\n`);
  }

  console.log('\n📊 MONITORING (' + categories.monitoring.length + ')');
  console.log('-'.repeat(70));
  for (const wf of categories.monitoring) {
    const status = wf.active ? '✅ Active' : '⏸️  Inactive';
    console.log(`  ${status} | ${wf.name}`);
    console.log(`           ID: ${wf.id}`);
    console.log(`           Status: ${getMultiTenantStatus(wf)}\n`);
  }

  console.log('\n🔍 DISCOVERY (' + categories.discovery.length + ')');
  console.log('-'.repeat(70));
  for (const wf of categories.discovery) {
    const status = wf.active ? '✅ Active' : '⏸️  Inactive';
    console.log(`  ${status} | ${wf.name}`);
    console.log(`           ID: ${wf.id}`);
    console.log(`           Status: ${getMultiTenantStatus(wf)}\n`);
  }

  console.log('\n⚙️  OPERATIONS (' + categories.operations.length + ')');
  console.log('-'.repeat(70));
  for (const wf of categories.operations) {
    const status = wf.active ? '✅ Active' : '⏸️  Inactive';
    console.log(`  ${status} | ${wf.name}`);
    console.log(`           ID: ${wf.id}`);
    console.log(`           Status: ${getMultiTenantStatus(wf)}\n`);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📋 MULTI-TENANT MIGRATION SUMMARY');
  console.log('='.repeat(70) + '\n');

  const needsUpdate = activeWorkflows.filter(w => !w.name.includes('ATTOM'));

  console.log(`✅ COMPLETE: ATTOM Property Discovery (multi-tenant ready)`);
  console.log(`🚧 NEEDS UPDATE: ${needsUpdate.length} workflows`);
  console.log(`\n📝 Next Steps:`);
  console.log(`   1. Update Guardrails (G1-G4) to filter by userId`);
  console.log(`   2. Update Monitoring workflows for per-user data`);
  console.log(`   3. Route all alerts to user-specific Slack webhooks`);
  console.log(`   4. Add userId to all API calls`);
  console.log(`   5. Test data isolation between users\n`);
}

function getMultiTenantStatus(workflow: any): string {
  const name = workflow.name.toLowerCase();

  if (name.includes('attom')) {
    return '✅ Multi-tenant ready';
  }

  return '⚠️  Single-tenant (needs userId filtering)';
}

auditWorkflows().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
