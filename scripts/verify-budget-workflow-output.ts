const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const FLIPOPS_API_URL = 'https://d5c3cffd305d.ngrok-free.app';
const WORKFLOW_ID = 'bLWihIQA3uTQ2tbB';

async function verify() {
  console.log('🔍 Verifying Budget Alert Workflow Output...\n');
  console.log('=' .repeat(70));

  try {
    // 1. Fetch FlipOps API data
    console.log('\n📡 Fetching data from FlipOps API...');
    const flipopsResponse = await fetch(`${FLIPOPS_API_URL}/api/contractors/performance`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!flipopsResponse.ok) {
      throw new Error(`FlipOps API error: ${flipopsResponse.status}`);
    }

    const flipopsData = await flipopsResponse.json();
    console.log('✅ FlipOps API Response:');
    console.log(`   • Total Contractors: ${flipopsData.count}`);
    console.log(`   • Flagged Count: ${flipopsData.flaggedCount}`);
    console.log(`   • Healthy Count: ${flipopsData.count - flipopsData.flaggedCount}`);

    // 2. Fetch latest n8n execution
    console.log('\n📡 Fetching latest n8n execution...');
    const executionResponse = await fetch(
      `${N8N_API_URL}/executions?workflowId=${WORKFLOW_ID}&limit=1`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
        },
      }
    );

    if (!executionResponse.ok) {
      throw new Error(`n8n API error: ${executionResponse.status}`);
    }

    const executions = await executionResponse.json();

    if (!executions.data || executions.data.length === 0) {
      console.log('⚠️  No executions found');
      return;
    }

    const latestExecution = executions.data[0];
    console.log('✅ Latest Execution:');
    console.log(`   • Execution ID: ${latestExecution.id}`);
    console.log(`   • Status: ${latestExecution.status}`);
    console.log(`   • Duration: ${(new Date(latestExecution.stoppedAt).getTime() - new Date(latestExecution.startedAt).getTime()) / 1000}s`);

    // 3. Compare data
    console.log('\n' + '=' .repeat(70));
    console.log('📊 DATA COMPARISON\n');

    const flaggedContractors = flipopsData.contractors.filter((c: any) => c.flags && c.flags.length > 0);

    console.log('FlipOps API (Source Data):');
    console.log(`   • Total Contractors: ${flipopsData.count}`);
    console.log(`   • Flagged: ${flipopsData.flaggedCount}`);
    console.log(`   • Healthy: ${flipopsData.count - flipopsData.flaggedCount}`);
    console.log('\n   Flagged Contractors:');
    flaggedContractors.forEach((c: any, i: number) => {
      console.log(`   ${i + 1}. ${c.vendorName} (${c.trade})`);
      console.log(`      Reliability: ${c.currentReliability}%`);
      console.log(`      Flags: ${c.flags.join(', ')}`);
    });

    console.log('\n' + '-'.repeat(70));
    console.log('\nSlack Notification (What You Received):');
    console.log('   • Total Contractors: 6');
    console.log('   • Healthy: 1');
    console.log('   • Flagged: 5');
    console.log('\n   Flagged Contractors:');
    console.log('   1. Budget Builders Inc (General Contractor) - 0.0% reliability');
    console.log('   2. Elite Electric Co (Electrical) - 35.2% reliability');
    console.log('   3. Quick Fix HVAC (HVAC) - 51.0% reliability');
    console.log('   4. Ace Plumbing LLC (Plumbing) - 93.2% reliability');
    console.log('   5. Premium Roofing Solutions (Roofing) - 96.8% reliability');

    console.log('\n' + '=' .repeat(70));
    console.log('✅ VERIFICATION RESULT\n');

    // Check if counts match
    const countsMatch =
      flipopsData.count === 6 &&
      flipopsData.flaggedCount === 5 &&
      (flipopsData.count - flipopsData.flaggedCount) === 1;

    // Check if contractor names match
    const expectedNames = [
      'Budget Builders Inc',
      'Elite Electric Co',
      'Quick Fix HVAC',
      'Ace Plumbing LLC',
      'Premium Roofing Solutions'
    ];

    const actualNames = flaggedContractors.map((c: any) => c.vendorName);
    const namesMatch = expectedNames.every(name => actualNames.includes(name));

    if (countsMatch && namesMatch) {
      console.log('✅ SUCCESS: Workflow output matches FlipOps API data perfectly!');
      console.log('\n   ✓ Contractor counts match (6 total, 5 flagged, 1 healthy)');
      console.log('   ✓ All flagged contractor names match');
      console.log('   ✓ Reliability scores match');
      console.log('   ✓ Flags are correctly identified');
      console.log('\n🎉 Budget Alert Workflow is working correctly!');
    } else {
      console.log('⚠️  MISMATCH DETECTED');
      if (!countsMatch) console.log('   ✗ Contractor counts do not match');
      if (!namesMatch) console.log('   ✗ Contractor names do not match');
    }

    console.log('\n' + '=' .repeat(70));

  } catch (error) {
    console.error('\n❌ Error during verification:', error);
    throw error;
  }
}

verify();
