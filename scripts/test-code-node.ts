/**
 * Test: Add a Code node to see if that's what breaks
 */

const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

const testWorkflow = {
  name: 'ATTOM Test with Code',
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
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'ngrok-skip-browser-warning', value: 'true' }
          ]
        },
        options: {
          response: {
            response: {
              responseFormat: 'json'
            }
          }
        }
      },
      id: 'http',
      name: 'HTTP Request',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [460, 300]
    },
    {
      parameters: {
        jsCode: `// Safety check for UI preview mode
if (!$input.all().length) {
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
      id: 'code',
      name: 'Code Node',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [680, 300]
    }
  ],
  connections: {
    'Schedule': {
      main: [[{ node: 'HTTP Request', type: 'main', index: 0 }]]
    },
    'HTTP Request': {
      main: [[{ node: 'Code Node', type: 'main', index: 0 }]]
    }
  },
  settings: { executionOrder: 'v1' }
};

async function test() {
  console.log('Creating workflow with Code node...');

  const response = await fetch(`${N8N_API_URL}/workflows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': N8N_API_KEY
    },
    body: JSON.stringify(testWorkflow)
  });

  if (!response.ok) {
    console.error('Failed:', response.status, await response.text());
  } else {
    const result = await response.json();
    console.log('✅ Created:', result.id);
    console.log('🔗 https://primary-production-8b46.up.railway.app/workflow/' + result.id);
    console.log('\nTry opening this - if it fails, the issue is with Code nodes');
  }
}

test();
