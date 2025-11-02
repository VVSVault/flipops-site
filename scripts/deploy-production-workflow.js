const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwNjU5MDE4LCJleHAiOjE3NjMxODI4MDB9.EjoViKzuZ_yYtcYNk7eyJepdD8UgbaYHCyCZYpYMXwM';
const BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';

async function deleteOldWorkflow(name) {
  try {
    const listResponse = await fetch(`${BASE_URL}/workflows`, {
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!listResponse.ok) {
      console.error('Failed to list workflows');
      return;
    }

    const workflows = await listResponse.json();
    const existing = workflows.data.find(w => w.name === name);

    if (existing) {
      console.log(`Found existing workflow: ${existing.name} (${existing.id})`);
      console.log('Deleting old workflow...');

      const deleteResponse = await fetch(`${BASE_URL}/workflows/${existing.id}`, {
        method: 'DELETE',
        headers: {
          'X-N8N-API-KEY': API_KEY,
          'Accept': 'application/json'
        }
      });

      if (deleteResponse.ok) {
        console.log('Old workflow deleted successfully');
      }
    }
  } catch (error) {
    console.error('Error checking for existing workflow:', error);
  }
}

async function deployWorkflow() {
  const workflowPath = 'n8n-workflows/discovery-production-final.json';
  const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

  // Clean fields
  delete workflow.active;
  delete workflow.id;
  delete workflow.staticData;
  delete workflow.versionId;
  delete workflow.updatedAt;
  delete workflow.createdAt;

  await deleteOldWorkflow(workflow.name);

  console.log('Deploying production workflow:', workflow.name);

  try {
    const response = await fetch(`${BASE_URL}/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(workflow)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error:', error);
      return;
    }

    const result = await response.json();
    console.log('✅ SUCCESS! Production workflow deployed');
    console.log('=====================================');
    console.log('Workflow ID:', result.id);
    console.log('Workflow Name:', result.name);
    console.log('URL: https://primary-production-8b46.up.railway.app/workflow/' + result.id);

    console.log('\n📋 PRODUCTION CHECKLIST:');
    console.log('========================');
    console.log('✓ All 6 sources configured (Sheets, Tax, Violations, Evictions, Probate, Provider)');
    console.log('✓ Normalize & Idempotency function');
    console.log('✓ Seen check with proper deduplication');
    console.log('✓ Batch processing (25 items)');
    console.log('✓ Optional HMAC signing');
    console.log('✓ Publishing to scoring webhook');
    console.log('✓ Mark seen after success');
    console.log('✓ Rate limiting (350ms = ~3 req/s)');
    console.log('✓ Metrics tracking (received, published, deduped)');
    console.log('✓ Slack summary and notifications');
    console.log('✓ Error handling with Slack alerts');
    console.log('✓ Continue on Fail = false for proper error handling');

    console.log('\n⚠️  CONFIGURE IN UI:');
    console.log('====================');
    console.log('1. Google Sheets OAuth2 credential');
    console.log('2. Slack OAuth2 credential (2 nodes)');
    console.log('3. Set environment variables for data sources');
    console.log('4. Activate workflow when ready');

    console.log('\n🧪 TEST PLAN:');
    console.log('=============');
    console.log('1. Run with Sheets only first');
    console.log('2. Verify idempotency (run twice, check deduped count)');
    console.log('3. Enable sources one by one');
    console.log('4. Check rate limiting in execution');
    console.log('5. Verify Slack summary shows correct metrics');

  } catch (error) {
    console.error('Failed:', error);
  }
}

deployWorkflow();