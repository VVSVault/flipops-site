/**
 * Test different Schedule Trigger parameter formats
 */

const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

async function testSchedule(name: string, parameters: any) {
  console.log(`\n📝 Testing: ${name}...`);

  const workflow = {
    name: `Schedule Test - ${name}`,
    settings: { executionOrder: 'v1' },
    nodes: [
      {
        parameters,
        id: 'schedule',
        name: 'Schedule',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [240, 300]
      }
    ],
    connections: {}
  };

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
  console.log('🕐 Schedule Trigger Format Testing');
  console.log('====================================\n');

  const tests = [
    {
      name: 'Format 1: hour/minute at rule level',
      parameters: {
        rule: {
          interval: [{ field: 'days', daysInterval: 1 }],
          hour: 6,
          minute: 0
        }
      }
    },
    {
      name: 'Format 2: hour/minute in interval object',
      parameters: {
        rule: {
          interval: [
            {
              field: 'days',
              daysInterval: 1,
              hour: 6,
              minute: 0
            }
          ]
        }
      }
    },
    {
      name: 'Format 3: cronExpression instead',
      parameters: {
        rule: {
          interval: [
            {
              field: 'cronExpression',
              expression: '0 6 * * *'
            }
          ]
        }
      }
    },
    {
      name: 'Format 4: Simple daily (no time)',
      parameters: {
        rule: {
          interval: [{ field: 'days', daysInterval: 1 }]
        }
      }
    },
    {
      name: 'Format 5: weekday with time',
      parameters: {
        rule: {
          interval: [
            {
              field: 'weekdays',
              weekdaysInterval: 1
            }
          ],
          hour: 6,
          minute: 0
        }
      }
    }
  ];

  const results = [];

  for (const test of tests) {
    const id = await testSchedule(test.name, test.parameters);
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
  console.log('Test each - find which format works for daily 6am trigger!');
}

main().catch(console.error);
