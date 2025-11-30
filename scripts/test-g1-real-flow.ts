/**
 * Test G1 guardrail with REAL API flow
 * This triggers the actual /api/deals/approve endpoint to create BLOCK events
 */

async function testG1RealFlow() {
  console.log('🧪 Testing G1 with real API flow...\n');

  // Step 1: Call the approval endpoint (this will create BLOCK event if P80 > max)
  console.log('1️⃣  Calling /api/deals/approve endpoint...');

  const response = await fetch('http://localhost:3007/api/deals/approve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dealId: 'test-deal-001', // Your existing test deal
      region: 'Miami',
      grade: 'Standard',
    }),
  });

  const result = await response.json();

  console.log('\n📊 API Response:');
  console.log(JSON.stringify(result, null, 2));

  if (result.status === 'BLOCKED_G1') {
    console.log('\n✅ BLOCK event created!');
    console.log(`   Event ID: ${result.eventId}`);
    console.log(`   P80: $${result.metrics.p80.toLocaleString()}`);
    console.log(`   Max Exposure: $${result.metrics.maxExposureUsd.toLocaleString()}`);
    console.log(`   Over By: $${result.metrics.overBy.toLocaleString()}`);

    // Step 2: Wait a moment, then run the cron job
    console.log('\n2️⃣  Waiting 2 seconds...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('\n3️⃣  Running G1 cron job...');
    const { execSync } = await import('child_process');
    execSync('npm run cron:g1', { stdio: 'inherit' });

    console.log('\n✅ Check your Slack for the notification!');
  } else if (result.status === 'APPROVED') {
    console.log('\n⚠️  Deal was approved (P80 < max exposure)');
    console.log('   No BLOCK event created.');
    console.log('\n💡 To test G1 blocking:');
    console.log('   1. Increase the deal scope (more expensive items)');
    console.log('   2. Or decrease maxExposureUsd in the policy');
  } else {
    console.log('\n❌ Unexpected response:', result);
  }
}

testG1RealFlow().catch(console.error);
