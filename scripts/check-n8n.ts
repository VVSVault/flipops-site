#!/usr/bin/env tsx
/**
 * n8n Connection Checker
 * Verifies n8n instance connectivity and API access
 */

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5ODI3NTA1LCJleHAiOjE3NjI0MDUyMDB9.hlcaGCrFW8ItKSdCvo2giGx4WIzSofPRc7xo7cSmyAo';

interface N8nUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

async function checkN8nConnection() {
  console.log('🔍 n8n Connection Checker');
  console.log('========================\n');
  console.log(`Base URL: ${N8N_BASE_URL}`);
  console.log(`API Key: ${N8N_API_KEY.substring(0, 20)}...\n`);

  try {
    // Check /me endpoint (may not exist in all n8n versions)
    console.log('1️⃣ Checking authentication...');

    // Skip /me endpoint and go straight to workflows as a connectivity test
    console.log('   ℹ️ Skipping /me endpoint (not available in all n8n versions)');
    console.log(`   ✅ Using API Key: ${N8N_API_KEY.substring(0, 20)}...\n`);

    // Check /workflows endpoint
    console.log('2️⃣ Checking /workflows...');
    const workflowsResponse = await fetch(`${N8N_BASE_URL}/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!workflowsResponse.ok) {
      throw new Error(`/workflows failed: ${workflowsResponse.status} ${workflowsResponse.statusText}`);
    }

    const workflowsData = await workflowsResponse.json();
    const workflows = workflowsData.data as N8nWorkflow[];

    console.log(`   ✅ Found ${workflows.length} workflow(s)\n`);

    // List FlipOps workflows
    const flipopsWorkflows = workflows.filter(w =>
      w.name.toLowerCase().includes('flipops') ||
      w.name.toLowerCase().includes('fo_') ||
      w.name.toLowerCase().includes('guardrail')
    );

    if (flipopsWorkflows.length > 0) {
      console.log('📋 FlipOps Workflows:');
      flipopsWorkflows.forEach(w => {
        const status = w.active ? '🟢 Active' : '⚪ Inactive';
        console.log(`   ${status} ${w.name} (${w.id})`);
      });
    } else {
      console.log('   ℹ️ No FlipOps workflows found');
    }

    // Check webhook endpoint availability
    console.log('\n3️⃣ Checking webhook availability...');
    const webhookTestUrl = `${N8N_BASE_URL}/webhook-test/health`;
    const webhookResponse = await fetch(webhookTestUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    }).catch(() => null);

    if (webhookResponse && webhookResponse.ok) {
      console.log('   ✅ Webhook endpoint accessible');
    } else {
      console.log('   ⚠️ Webhook test endpoint not available (this is normal)');
    }

    console.log('\n✨ n8n connection check complete!');
    console.log('================================\n');

    return true;

  } catch (error) {
    console.error('\n❌ n8n connection check failed!\n');
    console.error('Error:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Check N8N_BASE_URL is correct');
    console.error('2. Verify N8N_API_KEY is valid');
    console.error('3. Ensure n8n instance is running');
    console.error('4. Check network connectivity\n');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  checkN8nConnection().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { checkN8nConnection };