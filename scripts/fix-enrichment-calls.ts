/**
 * Fix Enrichment API Calls
 * Add error handling and logging to see why API calls fail
 */

const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const WORKFLOW_ID = 'EkhrKhMhfRyu00go';
const ATTOM_API_KEY = '72403894efb4b2cfeb4b5b41f105a53a';

async function getWorkflow() {
  const response = await fetch(`${N8N_API_URL}/workflows/${WORKFLOW_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_API_KEY }
  });
  if (!response.ok) throw new Error(`Failed to fetch workflow: ${response.status}`);
  return response.json();
}

async function updateWorkflow(workflow: any) {
  console.log('🔧 Fixing enrichment API calls with error handling...\n');

  const batchNode = workflow.nodes.find((n: any) => n.name === 'Batch Enrich & Score');
  if (!batchNode) throw new Error('Batch node not found');

  const code = batchNode.parameters.jsCode;

  // Replace the enrichProperty function with better error handling
  const newCode = code.replace(
    /async function enrichProperty\(prop\) \{[\s\S]*?return \{[\s\S]*?\};[\s\S]*?\}/,
    `async function enrichProperty(prop) {
  const attomId = prop.identifier?.attomId;
  const address = prop.address?.line1;

  if (!attomId) {
    console.log(\`No ATTOM ID for \${address}\`);
    return { sales: prop, assessment: null, avm: null };
  }

  try {
    console.log(\`Enriching \${address} (ID: \${attomId})...\`);

    // Assessment API call
    let assessment = null;
    let avm = null;

    try {
      const assessmentUrl = \`https://api.gateway.attomdata.com/propertyapi/v1.0.0/assessment/detail?attomid=\${attomId}\`;
      console.log(\`Calling assessment API: \${assessmentUrl}\`);

      const assessmentRes = await fetch(assessmentUrl, {
        headers: {
          'apikey': '${ATTOM_API_KEY}',
          'Accept': 'application/json'
        }
      });

      console.log(\`Assessment response status: \${assessmentRes.status}\`);

      if (assessmentRes.ok) {
        const assessmentData = await assessmentRes.json();
        assessment = assessmentData?.property?.[0] || null;
        console.log(\`Assessment data: \${assessment ? 'received' : 'empty'}\`);
      } else {
        const errorText = await assessmentRes.text();
        console.log(\`Assessment API error: \${assessmentRes.status} - \${errorText.substring(0, 200)}\`);
      }
    } catch (err) {
      console.log(\`Assessment API exception: \${err.message}\`);
    }

    // AVM API call
    try {
      const avmUrl = \`https://api.gateway.attomdata.com/propertyapi/v1.0.0/avm/detail?attomid=\${attomId}\`;
      console.log(\`Calling AVM API: \${avmUrl}\`);

      const avmRes = await fetch(avmUrl, {
        headers: {
          'apikey': '${ATTOM_API_KEY}',
          'Accept': 'application/json'
        }
      });

      console.log(\`AVM response status: \${avmRes.status}\`);

      if (avmRes.ok) {
        const avmData = await avmRes.json();
        avm = avmData?.property?.[0] || null;
        console.log(\`AVM data: \${avm ? 'received' : 'empty'}\`);
      } else {
        const errorText = await avmRes.text();
        console.log(\`AVM API error: \${avmRes.status} - \${errorText.substring(0, 200)}\`);
      }
    } catch (err) {
      console.log(\`AVM API exception: \${err.message}\`);
    }

    return {
      sales: prop,
      assessment: assessment,
      avm: avm
    };
  } catch (error) {
    console.log(\`Error enriching \${address}: \${error.message}\`);
    return { sales: prop, assessment: null, avm: null };
  }
}`
  );

  batchNode.parameters.jsCode = newCode;

  console.log('✅ Added detailed error logging to enrichment\n');
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
  console.log('🔍 Adding detailed API error logging...\n');

  try {
    const workflow = await getWorkflow();
    await updateWorkflow(workflow);

    console.log('✅ Error Logging Added!\n');
    console.log('📋 Will now log for EACH property:');
    console.log('   - API URLs being called');
    console.log('   - HTTP response status codes');
    console.log('   - Whether data was received');
    console.log('   - Any error messages\n');
    console.log('🧪 Run workflow and check console logs');
    console.log('   Look for "Assessment response status" and "AVM response status"');
    console.log('🔗 https://primary-production-8b46.up.railway.app/workflow/EkhrKhMhfRyu00go\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
