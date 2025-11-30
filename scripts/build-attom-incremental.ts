/**
 * Build ATTOM workflow incrementally to find which node causes UI issues
 *
 * Strategy: Add 2 nodes at a time, test each version
 */

const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';
const FO_API_BASE_URL = 'https://bb4c35d48e9c.ngrok-free.app';
const FO_API_KEY = 'fo_live_10177805c8d743e1a6e1860515dc2b3f';
const ATTOM_API_KEY = '72403894efb4b2cfeb4b5b41f105a53a';

// Define all nodes in order
const allNodes = [
  // 1. Schedule Trigger
  {
    parameters: {
      rule: {
        interval: [{ field: 'days', daysInterval: 1 }],
        hour: 6,
        minute: 0
      }
    },
    id: 'schedule-trigger',
    name: 'Schedule Daily Discovery',
    type: 'n8n-nodes-base.scheduleTrigger',
    typeVersion: 1.2,
    position: [240, 400]
  },

  // 2. Fetch Active Users
  {
    parameters: {
      method: 'GET',
      url: `${FO_API_BASE_URL}/api/users`,
      authentication: 'none',
      options: {}
    },
    id: 'fetch-users',
    name: 'Fetch Active Users',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [460, 400]
  },

  // 3. Filter Active Users
  {
    parameters: {
      jsCode: `if (!$input.all().length) {
  return [];
}

const data = $input.first().json;
const users = data.users || [];

return users
  .filter(user => {
    return user.onboarded === true &&
           user.investorProfile &&
           user.investorProfile.targetZipCodes &&
           user.investorProfile.targetZipCodes.length > 0;
  })
  .map(user => ({
    json: {
      userId: user.id,
      email: user.email,
      name: user.name,
      minScore: user.minScore || 65,
      investorProfile: user.investorProfile
    }
  }));`
    },
    id: 'filter-users',
    name: 'Filter Active Users',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [680, 400]
  },

  // 4. Build ATTOM Query
  {
    parameters: {
      jsCode: `if (!$input.all().length) {
  return [];
}

const user = $input.first().json;
const targetZipCodes = user.investorProfile?.targetZipCodes || [];

if (targetZipCodes.length === 0) {
  console.warn('User ' + user.userId + ' has no targetZipCodes');
  return [{
    json: {
      ...user,
      zips: [],
      totalZips: 0,
      error: 'No target ZIP codes configured'
    }
  }];
}

const zips = targetZipCodes.slice(0, 20);
return [{
  json: {
    ...user,
    zips: zips,
    totalZips: zips.length
  }
}];`
    },
    id: 'build-query',
    name: 'Build ATTOM Query',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [900, 400]
  },

  // 5. Loop Through ZIPs
  {
    parameters: {
      jsCode: `if (!$input.all().length) {
  return [];
}

const data = $input.first().json;
const zips = data.zips || [];

return zips.map(zip => ({
  json: {
    userData: data,
    zip: zip
  }
}));`
    },
    id: 'loop-zips',
    name: 'Loop Through ZIPs',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1120, 400]
  },

  // 6. Fetch from ATTOM
  {
    parameters: {
      jsCode: `const axios = require('axios');

if (!$input.all().length) {
  return [];
}

const data = $input.first().json;
const zip = data.zip;
const ATTOM_API_KEY = '${ATTOM_API_KEY}';

try {
  const response = await axios.get(
    'https://api.gateway.attomdata.com/propertyapi/v1.0.0/salessnap/snapshot',
    {
      params: {
        postalcode: zip,
        pagesize: 50
      },
      headers: {
        'apikey': ATTOM_API_KEY,
        'accept': 'application/json'
      }
    }
  );

  const properties = response.data?.property || [];

  return [{
    json: {
      userData: data.userData,
      zip: zip,
      properties: properties,
      count: properties.length
    }
  }];
} catch (error) {
  console.error('ATTOM API error for ZIP ' + zip + ':', error.message);
  return [{
    json: {
      userData: data.userData,
      zip: zip,
      properties: [],
      count: 0,
      error: error.message
    }
  }];
}`
    },
    id: 'fetch-attom',
    name: 'Fetch from ATTOM',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1340, 400]
  },

  // 7. Calculate Match Scores (SIMPLIFIED - first 40 lines only)
  {
    parameters: {
      jsCode: `if (!$input.all().length) {
  return [];
}

const data = $input.first().json;
const properties = data.properties || [];
const profile = data.userData.investorProfile;

function calculateScore(property) {
  let score = 0;

  // Price Match (30 points)
  if (profile.priceRanges && profile.priceRanges.length > 0) {
    const price = property.sale?.amount?.saleamt || 0;
    for (const range of profile.priceRanges) {
      if (price >= range.min && price <= range.max) {
        score += 30;
        break;
      }
    }
  }

  return score;
}

const scored = properties.map(p => ({
  ...p,
  matchScore: calculateScore(p)
}));

return [{
  json: {
    userData: data.userData,
    zip: data.zip,
    properties: scored
  }
}];`
    },
    id: 'calculate-scores',
    name: 'Calculate Match Scores',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1560, 400]
  }
];

// Build connections dynamically
function buildConnections(nodeCount: number) {
  const connections: any = {};

  const nodeNames = [
    'Schedule Daily Discovery',
    'Fetch Active Users',
    'Filter Active Users',
    'Build ATTOM Query',
    'Loop Through ZIPs',
    'Fetch from ATTOM',
    'Calculate Match Scores'
  ];

  for (let i = 0; i < nodeCount - 1; i++) {
    connections[nodeNames[i]] = {
      main: [[{ node: nodeNames[i + 1], type: 'main', index: 0 }]]
    };
  }

  return connections;
}

async function testWorkflow(nodeCount: number) {
  const nodes = allNodes.slice(0, nodeCount);
  const connections = buildConnections(nodeCount);

  const workflow = {
    name: `ATTOM Incremental Test - ${nodeCount} nodes`,
    settings: { executionOrder: 'v1' },
    nodes,
    connections
  };

  console.log(`\n📝 Testing with ${nodeCount} nodes...`);

  const response = await fetch(`${N8N_API_URL}/workflows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': N8N_API_KEY
    },
    body: JSON.stringify(workflow)
  });

  if (!response.ok) {
    console.error('❌ Failed:', response.status, await response.text());
    return null;
  }

  const result = await response.json();
  console.log(`✅ Created: ${result.id}`);
  console.log(`🔗 https://primary-production-8b46.up.railway.app/workflow/${result.id}`);
  console.log(`📋 Nodes: ${nodes.map(n => n.name).join(' → ')}`);

  return result.id;
}

async function main() {
  console.log('🔨 ATTOM Workflow Incremental Builder');
  console.log('=====================================\n');
  console.log('Building workflows with increasing node counts...');
  console.log('Test each one in the UI to find where it breaks.\n');

  const results = [];

  // Test with 3, 5, 7 nodes
  for (const count of [3, 5, 7]) {
    const id = await testWorkflow(count);
    if (id) {
      results.push({ count, id, url: `https://primary-production-8b46.up.railway.app/workflow/${id}` });
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n📊 Summary:');
  console.log('Test these workflows in order:\n');
  results.forEach(r => {
    console.log(`${r.count} nodes: ${r.url}`);
  });
  console.log('\nFind the last one that works, then we know which node causes the issue.');
}

main().catch(console.error);
