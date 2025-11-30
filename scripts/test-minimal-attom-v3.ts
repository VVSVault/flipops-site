/**
 * Ultra-minimal ATTOM workflow test - just 5 nodes to isolate UI issue
 */

const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

const minimalWorkflow = {
  name: 'ATTOM Test - Ultra Minimal',
  settings: { executionOrder: 'v1' },
  nodes: [
    {
      parameters: {
        rule: {
          interval: [{ field: 'days', daysInterval: 1 }]
        }
      },
      id: 'schedule',
      name: 'Schedule',
      type: 'n8n-nodes-base.scheduleTrigger',
      typeVersion: 1.2,
      position: [240, 300]
    },
    {
      parameters: {
        method: 'GET',
        url: 'https://bb4c35d48e9c.ngrok-free.app/api/users',
        authentication: 'none',
        options: {}
      },
      id: 'http',
      name: 'HTTP Request',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [460, 300]
    },
    {
      parameters: {
        jsCode: `if (!$input.all().length) {
  return [];
}

const data = $input.first().json;
const users = data.users || [];

return users.map(user => ({
  json: {
    userId: user.id,
    email: user.email
  }
}));`
      },
      id: 'code1',
      name: 'Code 1',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [680, 300]
    },
    {
      parameters: {
        aggregate: 'aggregateAllItemData'
      },
      id: 'agg',
      name: 'Aggregate',
      type: 'n8n-nodes-base.aggregate',
      typeVersion: 1,
      position: [900, 300]
    },
    {
      parameters: {
        jsCode: `if (!$input.all().length) {
  return [];
}

return $input.all();`
      },
      id: 'code2',
      name: 'Code 2',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [1120, 300]
    }
  ],
  connections: {
    'Schedule': {
      main: [[{ node: 'HTTP Request', type: 'main', index: 0 }]]
    },
    'HTTP Request': {
      main: [[{ node: 'Code 1', type: 'main', index: 0 }]]
    },
    'Code 1': {
      main: [[{ node: 'Aggregate', type: 'main', index: 0 }]]
    },
    'Aggregate': {
      main: [[{ node: 'Code 2', type: 'main', index: 0 }]]
    }
  }
};

async function test() {
  console.log('Creating ultra-minimal workflow...');

  const response = await fetch(`${N8N_API_URL}/workflows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': N8N_API_KEY
    },
    body: JSON.stringify(minimalWorkflow)
  });

  if (!response.ok) {
    console.error('Failed:', response.status, await response.text());
  } else {
    const result = await response.json();
    console.log('✅ Created:', result.id);
    console.log('🔗 https://primary-production-8b46.up.railway.app/workflow/' + result.id);
    console.log('\nTry opening this - if it works, issue is with specific node combinations');
  }
}

test();
