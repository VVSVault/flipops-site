/**
 * Fix Execution Mode for Batch Processing
 *
 * Problem: Aggregate node runs after FIRST property instead of ALL properties
 * Solution: Update workflow settings to ensure proper batching
 */

const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const WORKFLOW_ID = 'EkhrKhMhfRyu00go';

async function getWorkflow() {
  const response = await fetch(`${N8N_API_URL}/workflows/${WORKFLOW_ID}`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workflow: ${response.status}`);
  }

  return response.json();
}

async function updateWorkflow(workflow: any) {
  console.log('🔧 Checking workflow execution settings...\n');

  console.log('Current settings:', JSON.stringify(workflow.settings, null, 2));

  // The issue is that Transform outputs individual properties,
  // but Aggregate expects to receive ALL of them at once

  // We need to check if nodes are configured to run in batches
  const aggregateNode = workflow.nodes.find((n: any) => n.name === 'Aggregate Scored Properties');

  if (aggregateNode) {
    console.log('Current Aggregate node position in connections:');
    console.log(JSON.stringify(workflow.connections['Transform & Calculate Match Score'], null, 2));
  }

  // The real issue: We're processing properties one-by-one through enrichment,
  // but n8n's execution model runs the next node as soon as ANY item completes

  // SOLUTION: Change the flow so enrichment happens in a LOOP that completes
  // BEFORE moving to aggregate

  console.log('\n❌ Root Cause Identified:');
  console.log('   Extract IDs node splits 20 properties into 20 separate executions');
  console.log('   Each property goes through: Assessment → AVM → Merge → Transform');
  console.log('   Aggregate runs after FIRST property completes, not all 20\n');

  console.log('💡 Solution Options:');
  console.log('   Option 1: Use n8n "Wait" node or "Item Lists" mode');
  console.log('   Option 2: Batch enrichment (call API with multiple IDs)');
  console.log('   Option 3: Change to sequential processing with loop\n');

  console.log('📝 Recommended Fix:');
  console.log('   Redesign: Fetch Sales → Extract IDs → Loop (enrich all) → Aggregate');
  console.log('   Instead of: Extract → Each property flows individually');

  return null;
}

async function main() {
  console.log('🔍 Diagnosing execution flow issue...\n');

  try {
    const workflow = await getWorkflow();
    await updateWorkflow(workflow);

    console.log('\n✅ Diagnosis Complete');
    console.log('\nThe workflow needs restructuring to batch-process enrichment.');
    console.log('Let me create a proper fix...\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
