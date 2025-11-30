/**
 * Debug Workflow Data Flow
 *
 * Let's check what data is actually flowing through the nodes
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
  console.log('🔧 Adding debug logging to Transform node...\n');

  const transformNode = workflow.nodes.find((n: any) => n.name === 'Transform & Calculate Match Score');

  if (!transformNode) {
    throw new Error('Transform node not found');
  }

  // Add extensive debug logging
  transformNode.parameters.jsCode = `
/**
 * STEP 2: Transform ATTOM Data & Calculate Match Score
 * WITH DEBUG LOGGING
 */

// DEBUG: Log entire input structure
console.log('=== DEBUG: Full Input ===');
console.log('Number of inputs:', $input.all().length);
console.log('First input keys:', Object.keys($input.first().json));
console.log('First input:', JSON.stringify($input.first().json, null, 2).substring(0, 500));

const input = $input.first().json;

// DEBUG: Check what we have
console.log('=== DEBUG: Input Structure ===');
console.log('Has user?', !!input.user);
console.log('Has queryParams?', !!input.queryParams);
console.log('Has currentZip?', !!input.currentZip);

// The ATTOM API response is in the previous node
// We need to get it from a different input index or structure
const allInputs = $input.all();
console.log('Total inputs:', allInputs.length);

// Try to find the user data
let user = input.user;
let attomData = null;

// Check if ATTOM data is in the input
if (input.property) {
  // Direct ATTOM response
  console.log('Found ATTOM data directly in input');
  attomData = input;
  // User data might be in a different location
  // It could be from a previous node in the execution chain
} else if (allInputs.length > 1) {
  // Multiple inputs - one might be user data, one might be ATTOM
  console.log('Multiple inputs detected');
  for (let i = 0; i < allInputs.length; i++) {
    console.log(\`Input \${i} keys:\`, Object.keys(allInputs[i].json));
  }
}

console.log('User object:', user ? 'Found' : 'NOT FOUND');
console.log('ATTOM data:', attomData ? 'Found' : 'NOT FOUND');

if (!user) {
  throw new Error('User data not found in input. Input keys: ' + Object.keys(input).join(', '));
}

if (!attomData) {
  throw new Error('ATTOM data not found. Available keys: ' + Object.keys(input).join(', '));
}

// If we get here, log what we found
console.log('User ID:', user.id);
console.log('User name:', user.name);
console.log('Has investorProfile?', !!user.investorProfile);
console.log('InvestorProfile type:', typeof user.investorProfile);

return [{
  json: {
    debug: {
      inputKeys: Object.keys(input),
      hasUser: !!user,
      hasAttomData: !!attomData,
      userKeys: user ? Object.keys(user) : [],
      message: 'Debug run - check logs'
    }
  }
}];
`;

  console.log('✅ Added debug logging\n');
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
  console.log('🔍 Adding debug logging to workflow...\n');

  try {
    const workflow = await getWorkflow();
    await updateWorkflow(workflow);

    console.log('✅ Debug Logging Added!\n');
    console.log('📋 Next Steps:');
    console.log('   1. Execute the workflow in n8n');
    console.log('   2. Check the execution logs for "DEBUG:" messages');
    console.log('   3. Share the debug output so we can see the actual data structure');
    console.log('\n🔗 Open workflow: https://primary-production-8b46.up.railway.app/workflow/EkhrKhMhfRyu00go\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
