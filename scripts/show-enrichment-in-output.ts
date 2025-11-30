/**
 * Show Enrichment Data in Output
 * Add enrichment sample to the JSON output so we can see it
 */

const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const WORKFLOW_ID = 'EkhrKhMhfRyu00go';

async function getWorkflow() {
  const response = await fetch(`${N8N_API_URL}/workflows/${WORKFLOW_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_API_KEY }
  });
  if (!response.ok) throw new Error(`Failed to fetch workflow: ${response.status}`);
  return response.json();
}

async function updateWorkflow(workflow: any) {
  console.log('🔧 Adding enrichment sample to output...\n');

  const batchNode = workflow.nodes.find((n: any) => n.name === 'Batch Enrich & Score');
  if (!batchNode) throw new Error('Batch node not found');

  const code = batchNode.parameters.jsCode;

  // Find the return statement and add enrichment sample
  const newCode = code.replace(
    `return [{
  json: {
    user: user,
    properties: topProperties,
    stats: {
      fetched: transformedProperties.length,
      qualified: qualifiedProperties.length,
      ingesting: topProperties.length,
      minScore: minScore
    }
  }
}];`,
    `// Add enrichment sample to output for debugging
const enrichmentSample = enriched.length > 0 ? {
  address: enriched[0].sales.address?.line1,
  attomId: enriched[0].sales.identifier?.attomId,
  hasAssessmentData: !!enriched[0].assessment,
  hasAVMData: !!enriched[0].avm,
  assessmentFields: enriched[0].assessment ? Object.keys(enriched[0].assessment) : [],
  avmFields: enriched[0].avm ? Object.keys(enriched[0].avm) : [],
  taxDelinquentYear: enriched[0].assessment?.tax?.taxdelinquentyear || null,
  taxAmount: enriched[0].assessment?.assessment?.tax?.taxamt || null,
  avmValue: enriched[0].avm?.avm?.amount?.value || null
} : null;

return [{
  json: {
    user: user,
    properties: topProperties,
    stats: {
      fetched: transformedProperties.length,
      qualified: qualifiedProperties.length,
      ingesting: topProperties.length,
      minScore: minScore
    },
    enrichmentSample: enrichmentSample,
    enrichmentCounts: {
      total: enriched.length,
      withAssessment: enriched.filter(e => !!e.assessment).length,
      withAVM: enriched.filter(e => !!e.avm).length
    }
  }
}];`
  );

  batchNode.parameters.jsCode = newCode;

  console.log('✅ Added enrichment sample to output\n');
  console.log('🚀 Uploading to n8n...\n');

  const cleanWorkflow = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings,
    staticData: workflow.staticData
  };

  const response = await fetch(`${N8N_API_URL}/workflows/${WORKFLOW_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': N8N_API_KEY
    },
    body: JSON.stringify(cleanWorkflow)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update workflow: ${response.status} - ${error}`);
  }

  return response.json();
}

async function main() {
  console.log('🔍 Adding enrichment data to output...\n');

  try {
    const workflow = await getWorkflow();
    await updateWorkflow(workflow);

    console.log('✅ Enrichment Sample Added to Output!\n');
    console.log('📋 Output will now include:');
    console.log('   - enrichmentSample: First property enrichment data');
    console.log('   - enrichmentCounts: How many got assessment/AVM data');
    console.log('   - This will show in the node output JSON\n');
    console.log('🧪 Run workflow and check the output JSON');
    console.log('🔗 https://primary-production-8b46.up.railway.app/workflow/EkhrKhMhfRyu00go\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
