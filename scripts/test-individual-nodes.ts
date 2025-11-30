/**
 * Test individual nodes to find which specific node causes UI issues
 */

const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';
const FO_API_BASE_URL = 'https://bb4c35d48e9c.ngrok-free.app';

async function testWorkflow(name: string, workflow: any) {
  console.log(`\n📝 Testing: ${name}...`);

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
  return result.id;
}

async function main() {
  console.log('🔬 Individual Node Testing');
  console.log('===========================\n');

  const tests = [
    {
      name: 'Test 1: Schedule with simple rule',
      workflow: {
        name: 'Node Test 1 - Simple Schedule',
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
          }
        ],
        connections: {}
      }
    },
    {
      name: 'Test 2: Schedule with hour/minute',
      workflow: {
        name: 'Node Test 2 - Schedule with Time',
        settings: { executionOrder: 'v1' },
        nodes: [
          {
            parameters: {
              rule: {
                interval: [{ field: 'days', daysInterval: 1 }],
                hour: 6,
                minute: 0
              }
            },
            id: 'schedule',
            name: 'Schedule Daily Discovery',
            type: 'n8n-nodes-base.scheduleTrigger',
            typeVersion: 1.2,
            position: [240, 400]
          }
        ],
        connections: {}
      }
    },
    {
      name: 'Test 3: Schedule + HTTP (simple)',
      workflow: {
        name: 'Node Test 3 - Schedule + HTTP',
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
          }
        ],
        connections: {
          'Schedule': {
            main: [[{ node: 'HTTP Request', type: 'main', index: 0 }]]
          }
        }
      }
    },
    {
      name: 'Test 4: Schedule + HTTP + Small Code',
      workflow: {
        name: 'Node Test 4 - With Small Code',
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
return $input.all();`
            },
            id: 'code',
            name: 'Simple Code',
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
            main: [[{ node: 'Simple Code', type: 'main', index: 0 }]]
          }
        }
      }
    },
    {
      name: 'Test 5: Schedule + HTTP + Filter Users Code (EXACT from incremental)',
      workflow: {
        name: 'Node Test 5 - Filter Users Code',
        settings: { executionOrder: 'v1' },
        nodes: [
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
          }
        ],
        connections: {
          'Schedule Daily Discovery': {
            main: [[{ node: 'Fetch Active Users', type: 'main', index: 0 }]]
          },
          'Fetch Active Users': {
            main: [[{ node: 'Filter Active Users', type: 'main', index: 0 }]]
          }
        }
      }
    }
  ];

  const results = [];

  for (const test of tests) {
    const id = await testWorkflow(test.name, test.workflow);
    if (id) {
      results.push({
        name: test.name,
        id,
        url: `https://primary-production-8b46.up.railway.app/workflow/${id}`
      });
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n📊 Test Results:');
  console.log('================\n');
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.name}`);
    console.log(`   ${r.url}\n`);
  });
  console.log('Test each one - find which configuration breaks!');
}

main().catch(console.error);
