#!/usr/bin/env tsx
/**
 * Local Health Checker
 * Verifies API and n8n endpoints are healthy
 */

const API_BASE_URL = process.env.FO_API_BASE_URL || 'http://localhost:3000/api';
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://primary-production-8b46.up.railway.app';

interface HealthResponse {
  api: string;
  db: string;
  time: string;
  [key: string]: any;
}

async function checkHealth() {
  console.log('🏥 Health Check');
  console.log('===============\n');

  let allHealthy = true;

  // Check local API health
  console.log('1️⃣ Checking FlipOps API...');
  console.log(`   URL: ${API_BASE_URL}/health`);

  try {
    const apiResponse = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (apiResponse.ok) {
      const health = await apiResponse.json() as HealthResponse;
      console.log(`   ✅ API: ${health.api}`);
      console.log(`   ✅ Database: ${health.db}`);
      console.log(`   Timestamp: ${health.time || new Date().toISOString()}`);
    } else {
      console.log(`   ❌ API unhealthy: ${apiResponse.status} ${apiResponse.statusText}`);
      allHealthy = false;
    }
  } catch (error: any) {
    console.log(`   ❌ API unreachable: ${error.message}`);
    allHealthy = false;
  }

  // Check n8n health
  console.log('\n2️⃣ Checking n8n...');
  console.log(`   URL: ${N8N_BASE_URL}/healthz`);

  try {
    // Try healthz endpoint first
    let n8nResponse = await fetch(`${N8N_BASE_URL}/healthz`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    }).catch(() => null);

    // Fallback to API endpoint
    if (!n8nResponse || !n8nResponse.ok) {
      console.log('   ℹ️ /healthz not available, checking API...');
      const apiKey = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5ODI3NTA1LCJleHAiOjE3NjI0MDUyMDB9.hlcaGCrFW8ItKSdCvo2giGx4WIzSofPRc7xo7cSmyAo';

      n8nResponse = await fetch(`${N8N_BASE_URL}/api/v1/me`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Accept': 'application/json'
        }
      });

      if (n8nResponse.ok) {
        console.log('   ✅ n8n API accessible');
      } else {
        console.log(`   ❌ n8n unhealthy: ${n8nResponse.status}`);
        allHealthy = false;
      }
    } else {
      console.log('   ✅ n8n healthy');
    }
  } catch (error: any) {
    console.log(`   ❌ n8n unreachable: ${error.message}`);
    allHealthy = false;
  }

  // Check webhook endpoint
  console.log('\n3️⃣ Checking webhook endpoint...');
  console.log(`   URL: ${API_BASE_URL}/webhooks/n8n`);

  try {
    const webhookResponse = await fetch(`${API_BASE_URL}/webhooks/n8n`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    // GET might return 405, which is fine - endpoint exists
    if (webhookResponse.status === 405 || webhookResponse.status === 401) {
      console.log('   ✅ Webhook endpoint exists (auth required for POST)');
    } else if (webhookResponse.ok) {
      console.log('   ✅ Webhook endpoint accessible');
    } else {
      console.log(`   ⚠️ Webhook returned: ${webhookResponse.status}`);
    }
  } catch (error: any) {
    console.log(`   ❌ Webhook unreachable: ${error.message}`);
    allHealthy = false;
  }

  // Summary
  console.log('\n' + '='.repeat(40));
  if (allHealthy) {
    console.log('✅ All systems healthy!');
  } else {
    console.log('⚠️ Some systems need attention');
    console.log('\nNext steps:');
    console.log('1. Ensure Next.js is running: npm run dev');
    console.log('2. Check database connection: npm run migrate');
    console.log('3. Verify n8n credentials: npm run check:n8n');
  }
  console.log('='.repeat(40) + '\n');

  process.exit(allHealthy ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  checkHealth().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { checkHealth };