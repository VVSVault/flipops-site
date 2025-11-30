/**
 * Fix the connections in Data Refresh & Sync workflow
 * Schedule Trigger should connect to Fetch Active Users, not Fetch Active Deals
 */

const N8N_BASE_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

const WORKFLOW_ID = 'TwWfbKedznM8gPjr'; // Data Refresh & Sync

async function fixConnections() {
  console.log('🔧 Fixing Workflow Connections\n');

  // Fetch workflow
  const response = await fetch(`${N8N_BASE_URL}/workflows/${WORKFLOW_ID}`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json'
    }
  });

  const workflow = await response.json();

  console.log(`Workflow: ${workflow.name}\n`);
  console.log('Current connections:');
  console.log('   Schedule Trigger → Fetch Active Deals (WRONG)');
  console.log('\nFixed connections:');
  console.log('   Schedule Trigger → Fetch Active Users (CORRECT)');
  console.log('   Fetch Active Users → Loop Through Users');
  console.log('   Loop Through Users → Fetch Active Deals\n');

  // Update the connections
  workflow.connections = {
    'Schedule Trigger': {
      main: [[{
        node: 'Fetch Active Users',
        type: 'main',
        index: 0
      }]]
    },
    'Fetch Active Users': {
      main: [[{
        node: 'Loop Through Users',
        type: 'main',
        index: 0
      }]]
    },
    'Loop Through Users': {
      main: [[{
        node: 'Fetch Active Deals',
        type: 'main',
        index: 0
      }]]
    },
    'Fetch Active Deals': {
      main: [[{
        node: 'Check If Any Deals',
        type: 'main',
        index: 0
      }]]
    },
    'Check If Any Deals': {
      main: [[{
        node: 'Refresh Deal Data',
        type: 'main',
        index: 0
      }]]
    },
    'Refresh Deal Data': {
      main: [[{
        node: 'Format Slack Message',
        type: 'main',
        index: 0
      }]]
    },
    'Format Slack Message': {
      main: [[{
        node: 'Send to Slack',
        type: 'main',
        index: 0
      }]]
    }
  };

  console.log('='.repeat(80));

  // Save workflow
  const updatePayload = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings || {}
  };

  const updateResponse = await fetch(`${N8N_BASE_URL}/workflows/${WORKFLOW_ID}`, {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(updatePayload)
  });

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    throw new Error(`Failed to update workflow: ${updateResponse.status} - ${errorText}`);
  }

  console.log('✅ Connections fixed successfully!\n');
  console.log('🎯 Execution flow is now:');
  console.log('   1. Schedule Trigger');
  console.log('   2. Fetch Active Users');
  console.log('   3. Loop Through Users');
  console.log('   4. For each user:');
  console.log('      → Fetch Active Deals (with userId)');
  console.log('      → Check If Any Deals');
  console.log('      → Refresh Deal Data');
  console.log('      → Format Slack Message');
  console.log('      → Send to Slack');
  console.log('\n🧪 Test the workflow now - it should work correctly!');
}

fixConnections().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
