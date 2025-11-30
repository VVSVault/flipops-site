async function testStalledEndpoint() {
  console.log('🔍 Testing stalled deals endpoint...\n');

  try {
    const response = await fetch('http://localhost:3010/api/deals/stalled', {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log('✅ Endpoint Response:\n');
    console.log('Summary:', JSON.stringify(data.summary, null, 2));
    console.log('\nThresholds:', JSON.stringify(data.thresholds, null, 2));

    if (data.summary.total > 0) {
      console.log('\n📋 Stalled Deals:');
      data.stalledDeals.forEach((deal: any, i: number) => {
        const days = Math.floor(deal.stalledFor / 24);
        const hours = deal.stalledFor % 24;
        console.log(`\n${i + 1}. [${deal.gate}] ${deal.address || 'Unknown'}`);
        console.log(`   Status: ${deal.status}`);
        console.log(`   Stalled: ${days}d ${hours}h`);
        console.log(`   Details:`, JSON.stringify(deal.details, null, 2));
      });
    } else {
      console.log('\n✨ No stalled deals found!');
      console.log('All deals are moving through the pipeline within expected timeframes.');
    }

  } catch (error) {
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      console.error('❌ Error: Local server is not running');
      console.log('\nTo test the endpoint, first start the dev server:');
      console.log('  npm run dev\n');
    } else {
      console.error('❌ Error:', error);
    }
  }
}

testStalledEndpoint();
