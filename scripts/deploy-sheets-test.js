const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwNjU5MDE4LCJleHAiOjE3NjMxODI4MDB9.EjoViKzuZ_yYtcYNk7eyJepdD8UgbaYHCyCZYpYMXwM';
const BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';

async function deployWorkflow() {
  const workflowPath = 'n8n-workflows/discovery-sheets-only.json';
  const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

  // Remove fields that API doesn't accept
  delete workflow.active;
  delete workflow.id;
  delete workflow.staticData;
  delete workflow.versionId;
  delete workflow.updatedAt;

  console.log('Deploying test workflow:', workflow.name);

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
    console.log('✅ Success! Test workflow deployed');
    console.log('Workflow ID:', result.id);
    console.log('URL: https://primary-production-8b46.up.railway.app/workflow/' + result.id);
    console.log('\n📝 This simplified workflow:');
    console.log('- Only reads from Google Sheets (Properties tab)');
    console.log('- Normalizes and scores properties');
    console.log('- Sends Slack alerts for high scores (70+)');
    console.log('- No external API calls that could fail');
    console.log('\n⚠️ Remember to:');
    console.log('1. Set Google Sheets OAuth2 credential');
    console.log('2. Set Slack OAuth2 credential');

  } catch (error) {
    console.error('Failed:', error);
  }
}

deployWorkflow();