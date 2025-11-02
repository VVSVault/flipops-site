const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwNjU5MDE4LCJleHAiOjE3NjMxODI4MDB9.EjoViKzuZ_yYtcYNk7eyJepdD8UgbaYHCyCZYpYMXwM';
const BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';

async function deleteOldWorkflow(name) {
  try {
    // Get all workflows
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
      } else {
        console.log('Could not delete old workflow');
      }
    }
  } catch (error) {
    console.error('Error checking for existing workflow:', error);
  }
}

async function deployWorkflow() {
  const workflowPath = 'n8n-workflows/discovery-all-sources-v2.json';
  const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

  // Remove fields that API doesn't accept
  delete workflow.active;
  delete workflow.id;
  delete workflow.staticData;
  delete workflow.versionId;
  delete workflow.updatedAt;
  delete workflow.createdAt;

  // First, delete any existing workflow with the same name
  await deleteOldWorkflow(workflow.name);

  console.log('Deploying new workflow:', workflow.name);

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
    console.log('✅ Success! Workflow deployed');
    console.log('Workflow ID:', result.id);
    console.log('Workflow Name:', result.name);
    console.log('URL: https://primary-production-8b46.up.railway.app/workflow/' + result.id);

    // Don't activate yet - needs credentials first
    console.log('\n⚠️  Important: You need to configure credentials in the UI:');
    console.log('1. Google Sheets OAuth2 - for "Google Sheets Intake" node');
    console.log('2. Slack OAuth2 - for "Slack Summary" and "Slack Error" nodes');
    console.log('\nThen activate the workflow manually in the UI.');

  } catch (error) {
    console.error('Failed:', error);
  }
}

deployWorkflow();