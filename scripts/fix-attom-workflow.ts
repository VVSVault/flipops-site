/**
 * Fix ATTOM Discovery Workflow - ZIP Splitting Issue
 *
 * Problem: Workflow stuck at "Loop Through ZIPs" node
 * Root Cause: System Default User has empty zips array
 *
 * Solution:
 * 1. Filter out System Default User (exclude users without investorProfile)
 * 2. Replace splitOut node with Code node that handles empty arrays
 */

const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const WORKFLOW_ID = 'EkhrKhMhfRyu00go'; // From WORKFLOW_STATUS_CURRENT.md

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
  console.log('🔧 Applying fixes to workflow...\n');

  // FIX 1: Update "Filter Active Users" to exclude System Default User
  const filterNode = workflow.nodes.find((n: any) => n.name === 'Filter Active Users');
  if (filterNode) {
    console.log('✅ Fix 1: Updating Filter Active Users to exclude System Default User');
    filterNode.parameters.jsCode = `
// Extract users with active subscriptions from API response
const response = $input.first().json;
const allUsers = response.users || [];

const activeUsers = allUsers.filter(user => {
  // Exclude System Default User (has no investorProfile)
  if (user.id === 'default-user-id' || !user.investorProfile) {
    console.log(\`Skipping user: \${user.name} (no investorProfile)\`);
    return false;
  }

  return user.subscriptionStatus === 'active' && user.onboarded === true;
});

console.log(\`Found \${activeUsers.length} active users out of \${allUsers.length} total\`);

// Return each user as a separate item for processing
return activeUsers.map(user => ({ json: user }));
`;
  }

  // FIX 2: Replace "Loop Through ZIPs" splitOut node with Code node
  const loopNode = workflow.nodes.find((n: any) => n.name === 'Loop Through ZIPs');
  if (loopNode) {
    console.log('✅ Fix 2: Replacing splitOut with Code node that handles empty arrays');

    // Change node type to Code
    loopNode.type = 'n8n-nodes-base.code';
    loopNode.typeVersion = 2;

    // Replace parameters with jsCode
    loopNode.parameters = {
      jsCode: `
/**
 * Split ZIP codes array into individual items
 * With safety checks for empty arrays
 */

const input = $input.first().json;
const zips = input.queryParams?.zips || [];

console.log(\`Processing \${zips.length} ZIP codes for user: \${input.user.name}\`);

// If no ZIPs, skip this user
if (zips.length === 0) {
  console.log('⚠️  No ZIPs to process - skipping user');
  return [];
}

// Return one item per ZIP, keeping all context
return zips.map(zip => ({
  json: {
    ...input,
    currentZip: zip,  // Single ZIP for this iteration
    queryParams: {
      ...input.queryParams,
      zip: zip  // Use 'zip' (singular) instead of 'zips' (array)
    }
  }
}));
`
    };
  }

  // FIX 3: Update "Fetch from ATTOM API" to use singular 'zip' parameter
  const fetchNode = workflow.nodes.find((n: any) => n.name === 'Fetch from ATTOM API');
  if (fetchNode) {
    console.log('✅ Fix 3: Updating ATTOM API node to use singular zip parameter');

    // Find and update the postalcode parameter
    const postalcodeParam = fetchNode.parameters.queryParameters?.parameters?.find(
      (p: any) => p.name === 'postalcode'
    );

    if (postalcodeParam) {
      postalcodeParam.value = '={{$json.queryParams.zip}}';  // Changed from .zips to .zip
    }
  }

  console.log('\n🚀 Uploading fixed workflow to n8n...\n');

  // Clean up workflow object - only send allowed fields
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
  console.log('🔍 Fetching ATTOM Discovery Workflow...\n');
  console.log(`   Workflow ID: ${WORKFLOW_ID}`);
  console.log(`   n8n URL: ${N8N_API_URL.replace('/api/v1', '')}/workflow/${WORKFLOW_ID}\n`);

  try {
    const workflow = await getWorkflow();
    console.log(`✅ Fetched workflow: "${workflow.name}"`);
    console.log(`   Nodes: ${workflow.nodes.length}`);
    console.log(`   Active: ${workflow.active}\n`);

    const updated = await updateWorkflow(workflow);

    console.log('✅ Workflow Updated Successfully!\n');
    console.log('📋 Changes Applied:');
    console.log('   1. Filter Active Users - Exclude System Default User');
    console.log('   2. Loop Through ZIPs - Replaced splitOut with Code node');
    console.log('   3. Fetch from ATTOM API - Updated to use singular zip parameter\n');
    console.log('🎯 What happens now:');
    console.log('   ✅ Only real investors (with investorProfile) are processed');
    console.log('   ✅ Empty ZIP arrays are gracefully skipped (no hang)');
    console.log('   ✅ Each ZIP is processed individually with full context');
    console.log('   ✅ ATTOM API receives correct single ZIP parameter\n');
    console.log('🧪 Next Steps:');
    console.log('   1. Open workflow in n8n UI');
    console.log('   2. Click "Execute Workflow" to test');
    console.log('   3. Verify Jacksonville investor gets 15 ZIPs processed');
    console.log('   4. Check that properties are scored and ingested\n');
    console.log(`🔗 Open workflow: ${N8N_API_URL.replace('/api/v1', '')}/workflow/${WORKFLOW_ID}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
