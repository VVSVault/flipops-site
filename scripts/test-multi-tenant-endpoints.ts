/**
 * Test all multi-tenant API endpoints
 * Verifies userId filtering is working correctly
 */

const API_BASE = 'http://localhost:3007';

interface TestResult {
  endpoint: string;
  status: 'PASS' | 'FAIL';
  statusCode?: number;
  error?: string;
  userId?: string;
}

const endpoints = [
  '/api/users?status=active',
  '/api/deals/approve/status',
  '/api/deals/bid-spread/status',
  '/api/deals/budget-variance/status',
  '/api/deals/change-orders/status',
  '/api/deals/stalled',
  '/api/deals/active',
  '/api/contractors/performance'
];

async function testEndpoint(endpoint: string, userId?: string): Promise<TestResult> {
  const url = userId ? `${API_BASE}${endpoint}?userId=${userId}` : `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (endpoint === '/api/users?status=active') {
      // Users endpoint should work without userId
      if (response.status === 200 && data.users) {
        return {
          endpoint,
          status: 'PASS',
          statusCode: response.status
        };
      }
    } else {
      // Other endpoints should require userId
      if (!userId) {
        // Should return 400 if userId is missing
        if (response.status === 400 && data.error === 'userId parameter is required') {
          return {
            endpoint,
            status: 'PASS',
            statusCode: response.status
          };
        } else {
          return {
            endpoint,
            status: 'FAIL',
            statusCode: response.status,
            error: 'Should return 400 when userId is missing'
          };
        }
      } else {
        // Should work with userId
        if (response.status === 200) {
          return {
            endpoint,
            status: 'PASS',
            statusCode: response.status,
            userId
          };
        } else {
          return {
            endpoint,
            status: 'FAIL',
            statusCode: response.status,
            error: data.error || data.message || 'Unknown error'
          };
        }
      }
    }

    return {
      endpoint,
      status: 'FAIL',
      statusCode: response.status,
      error: 'Unexpected response'
    };
  } catch (error: any) {
    return {
      endpoint,
      status: 'FAIL',
      error: error.message
    };
  }
}

async function main() {
  console.log('🧪 Testing Multi-Tenant API Endpoints\n');
  console.log('='.repeat(80) + '\n');

  // Step 1: Get active users
  console.log('📋 Step 1: Fetching active users...\n');
  const usersResult = await testEndpoint('/api/users?status=active');

  if (usersResult.status === 'FAIL') {
    console.error('❌ Failed to fetch users:', usersResult.error);
    process.exit(1);
  }

  const usersResponse = await fetch(`${API_BASE}/api/users?status=active`);
  const usersData = await usersResponse.json();
  const users = usersData.users || [];

  console.log(`✅ Found ${users.length} active users`);
  users.forEach((user: any, i: number) => {
    console.log(`   ${i + 1}. ${user.name || user.email} (ID: ${user.id})`);
  });

  if (users.length === 0) {
    console.log('\n⚠️  No active users found. Create some test users first.');
    console.log('\nTo create test users, run:');
    console.log('  npx prisma studio');
    console.log('  Then create 2 users with subscriptionStatus = "active"\n');
    process.exit(0);
  }

  const testUserId = users[0].id;
  console.log(`\n🎯 Using User ID for testing: ${testUserId}\n`);

  // Step 2: Test userId validation (should fail without userId)
  console.log('='.repeat(80));
  console.log('📋 Step 2: Testing userId validation (endpoints should reject requests without userId)\n');

  const validationResults: TestResult[] = [];
  for (const endpoint of endpoints.slice(1)) { // Skip /api/users
    const result = await testEndpoint(endpoint);
    validationResults.push(result);

    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${endpoint}`);
    if (result.status === 'FAIL') {
      console.log(`   Error: ${result.error}`);
    }
  }

  const validationPassed = validationResults.every(r => r.status === 'PASS');
  console.log(`\n${validationPassed ? '✅' : '❌'} Validation: ${validationResults.filter(r => r.status === 'PASS').length}/${validationResults.length} passed\n`);

  // Step 3: Test with valid userId
  console.log('='.repeat(80));
  console.log('📋 Step 3: Testing endpoints with valid userId\n');

  const dataResults: TestResult[] = [];
  for (const endpoint of endpoints.slice(1)) { // Skip /api/users
    const result = await testEndpoint(endpoint, testUserId);
    dataResults.push(result);

    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${endpoint}?userId=${testUserId}`);
    if (result.status === 'FAIL') {
      console.log(`   Error: ${result.error}`);
    }
  }

  const dataPassed = dataResults.every(r => r.status === 'PASS');
  console.log(`\n${dataPassed ? '✅' : '❌'} Data Retrieval: ${dataResults.filter(r => r.status === 'PASS').length}/${dataResults.length} passed\n`);

  // Summary
  console.log('='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80) + '\n');

  const allResults = [usersResult, ...validationResults, ...dataResults];
  const totalPassed = allResults.filter(r => r.status === 'PASS').length;
  const totalTests = allResults.length;

  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalTests - totalPassed}`);

  if (totalPassed === totalTests) {
    console.log('\n🎉 All tests passed! Multi-tenant API is working correctly.\n');
    console.log('Next steps:');
    console.log('1. Test workflows in n8n dashboard');
    console.log('2. Verify each user gets separate Slack notifications');
    console.log('3. Confirm data isolation between users\n');
  } else {
    console.log('\n❌ Some tests failed. Review errors above.\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
