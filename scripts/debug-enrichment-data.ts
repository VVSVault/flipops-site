/**
 * Debug Enrichment Data
 * Add logging to see what assessment/AVM endpoints actually return
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
  console.log('🔧 Adding enrichment data debugging...\n');

  const batchNode = workflow.nodes.find((n: any) => n.name === 'Batch Enrich & Score');
  if (!batchNode) throw new Error('Batch node not found');

  const code = batchNode.parameters.jsCode;

  // Add logging after enrichProperty function
  const newCode = code.replace(
    `const assessment = assessmentRes ? await assessmentRes.json().catch(() => null) : null;
    const avm = avmRes ? await avmRes.json().catch(() => null) : null;`,
    `const assessment = assessmentRes ? await assessmentRes.json().catch(() => null) : null;
    const avm = avmRes ? await avmRes.json().catch(() => null) : null;

    // DEBUG: Log first property's enrichment data
    if (prop.identifier?.attomId === properties[0]?.identifier?.attomId) {
      console.log(\`\\n=== ENRICHMENT DATA SAMPLE (First Property) ===\`);
      console.log(\`Address: \${prop.address?.line1}\`);
      console.log(\`ATTOM ID: \${attomId}\`);

      console.log(\`\\nAssessment Data:\`);
      if (assessment?.property?.[0]) {
        const assessProp = assessment.property[0];
        console.log(\`  Has tax data: \${!!assessProp.tax}\`);
        console.log(\`  Tax delinquent year: \${assessProp.tax?.taxdelinquentyear || 'none'}\`);
        console.log(\`  Tax amount: \${assessProp.tax?.taxamt || 0}\`);
        console.log(\`  Assessed value: \${assessProp.assessment?.assessed?.assdttlvalue || 0}\`);
        console.log(\`  Owner data: \${!!assessProp.owner}\`);
        if (assessProp.owner?.owner1) {
          console.log(\`    Owner name: \${assessProp.owner.owner1.firstName} \${assessProp.owner.owner1.lastName}\`);
          console.log(\`    Mailing care of: \${assessProp.owner.owner1.mailingCareOfName || 'none'}\`);
        }
      } else {
        console.log(\`  No assessment data returned\`);
      }

      console.log(\`\\nAVM Data:\`);
      if (avm?.property?.[0]) {
        const avmProp = avm.property[0];
        console.log(\`  AVM value: \${avmProp.avm?.amount?.value || 0}\`);
        console.log(\`  Confidence: \${avmProp.avm?.confidenceScore || 'n/a'}\`);
      } else {
        console.log(\`  No AVM data returned\`);
      }
    }`
  );

  batchNode.parameters.jsCode = newCode;

  console.log('✅ Added enrichment debugging\n');
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
  console.log('🔍 Adding enrichment data debugging...\n');

  try {
    const workflow = await getWorkflow();
    await updateWorkflow(workflow);

    console.log('✅ Debug Logging Added!\n');
    console.log('📋 Will now show for first property:');
    console.log('   - Whether assessment endpoint returns data');
    console.log('   - Tax delinquency info (if available)');
    console.log('   - Owner information for absentee detection');
    console.log('   - AVM value data\n');
    console.log('🧪 Run workflow and check what enrichment data we actually get');
    console.log('🔗 https://primary-production-8b46.up.railway.app/workflow/EkhrKhMhfRyu00go\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
