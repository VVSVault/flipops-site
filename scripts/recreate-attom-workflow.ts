/**
 * Delete and recreate ATTOM Property Discovery Workflow
 * Fixes the authentication issue
 */

const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const OLD_WORKFLOW_ID = 'SXZfQaNGiRoGj5CL';

async function recreateWorkflow() {
  console.log('🔧 Recreating ATTOM Property Discovery Workflow...\n');

  try {
    // Step 1: Delete old workflow
    console.log('🗑️  Deleting old workflow...');
    const deleteResponse = await fetch(`${N8N_API_URL}/workflows/${OLD_WORKFLOW_ID}`, {
      method: 'DELETE',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      const error = await deleteResponse.text();
      throw new Error(`Failed to delete workflow: ${deleteResponse.status} - ${error}`);
    }

    console.log('✅ Old workflow deleted\n');

    // Step 2: Run the create script
    console.log('📦 Creating new workflow with fixed authentication...\n');
    const { execSync } = require('child_process');
    execSync('npx tsx scripts/create-attom-discovery-workflow-v2.ts', {
      stdio: 'inherit',
      cwd: process.cwd()
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

recreateWorkflow();
