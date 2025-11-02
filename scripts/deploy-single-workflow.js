const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwNjU5MDE4LCJleHAiOjE3NjMxODI4MDB9.EjoViKzuZ_yYtcYNk7eyJepdD8UgbaYHCyCZYpYMXwM';
const BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';

async function deployWorkflow() {
  const workflowPath = 'n8n-workflows/discovery-minimal.json';
  const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

  // Remove fields that API doesn't accept
  delete workflow.active;
  delete workflow.id;
  delete workflow.staticData;
  delete workflow.versionId;
  delete workflow.updatedAt;

  console.log('Deploying workflow:', workflow.name);

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
    console.log('Success! Workflow ID:', result.id);
    console.log('Workflow Name:', result.name);

    // Activate the workflow
    console.log('Activating workflow...');
    const activateResponse = await fetch(`${BASE_URL}/workflows/${result.id}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Accept': 'application/json'
      }
    });

    if (activateResponse.ok) {
      console.log('Workflow activated successfully!');
    } else {
      console.log('Could not activate workflow');
    }

  } catch (error) {
    console.error('Failed:', error);
  }
}

deployWorkflow();