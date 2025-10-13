// Simple test for G2 to verify it's working
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testG2() {
  console.log('🧪 Testing Gate G2 - Bid Award (Spread Control)');
  console.log('===============================================\n');

  try {
    // Clean up
    console.log('Cleaning database...');
    await prisma.event.deleteMany();
    await prisma.bid.deleteMany();
    await prisma.budgetLedger.deleteMany();
    await prisma.changeOrder.deleteMany();
    await prisma.scopeTreeNode.deleteMany();
    await prisma.dealSpec.deleteMany();
    await prisma.policy.deleteMany();
    await prisma.vendor.deleteMany();

    // Create policy
    console.log('Creating policy...');
    const policy = await prisma.policy.create({
      data: {
        region: 'Miami',
        grade: 'Standard',
        maxExposureUsd: 100000,
        targetRoiPct: 20,
        contingencyTargetPct: 10,
        varianceTier1Pct: 3,
        varianceTier2Pct: 7,
        bidSpreadMaxPct: 15,
        coSlaHours: 72
      }
    });

    // Create vendors
    console.log('Creating vendors...');
    const [vendor1, vendor2, vendor3] = await Promise.all([
      prisma.vendor.create({
        data: {
          name: 'Vendor A',
          trade: ['Roofing'],
          region: 'Miami'
        }
      }),
      prisma.vendor.create({
        data: {
          name: 'Vendor B',
          trade: ['Roofing'],
          region: 'Miami'
        }
      }),
      prisma.vendor.create({
        data: {
          name: 'Vendor C',
          trade: ['Roofing'],
          region: 'Miami'
        }
      })
    ]);

    // Create SAFE deal
    console.log('Creating test deals...');
    const safeDeal = await prisma.dealSpec.create({
      data: {
        address: '123 Test St',
        policyId: policy.id,
        dealType: 'flip',
        rehab: {}
      }
    });

    const riskyDeal = await prisma.dealSpec.create({
      data: {
        address: '456 Test Ave',
        policyId: policy.id,
        dealType: 'flip',
        rehab: {}
      }
    });

    // Create SAFE bids (low spread)
    console.log('Creating safe bids (low spread)...');
    const safeBids = await Promise.all([
      prisma.bid.create({
        data: {
          dealId: safeDeal.id,
          vendorId: vendor1.id,
          items: [{
            trade: 'Roofing',
            task: 'Replace',
            quantity: { value: 15, unit: 'squares' },
            unitPrice: 600,
            totalPrice: 9000
          }],
          subtotal: 9000,
          status: 'pending'
        }
      }),
      prisma.bid.create({
        data: {
          dealId: safeDeal.id,
          vendorId: vendor2.id,
          items: [{
            trade: 'Roofing',
            task: 'Replace',
            quantity: { value: 1500, unit: 'sqft' },
            unitPrice: 6.3,
            totalPrice: 9450
          }],
          subtotal: 9450,
          status: 'pending'
        }
      }),
      prisma.bid.create({
        data: {
          dealId: safeDeal.id,
          vendorId: vendor3.id,
          items: [{
            trade: 'Roofing',
            task: 'Replace',
            quantity: { value: 1500, unit: 'sf' },
            unitPrice: 6.6,
            totalPrice: 9900
          }],
          subtotal: 9900,
          status: 'pending'
        }
      })
    ]);

    // Create RISKY bids (high spread)
    console.log('Creating risky bids (high spread)...');
    const riskyBids = await Promise.all([
      prisma.bid.create({
        data: {
          dealId: riskyDeal.id,
          vendorId: vendor1.id,
          items: [{
            trade: 'Roofing',
            task: 'Replace',
            quantity: { value: 20, unit: 'squares' },
            unitPrice: 1200,
            totalPrice: 24000
          }],
          subtotal: 24000,
          status: 'pending'
        }
      }),
      prisma.bid.create({
        data: {
          dealId: riskyDeal.id,
          vendorId: vendor2.id,
          items: [{
            trade: 'Roofing',
            task: 'Replace',
            quantity: { value: 2000, unit: 'sqft' },
            unitPrice: 14,
            totalPrice: 28000
          }],
          subtotal: 28000,
          status: 'pending'
        }
      }),
      prisma.bid.create({
        data: {
          dealId: riskyDeal.id,
          vendorId: vendor3.id,
          items: [{
            trade: 'Roofing',
            task: 'Replace',
            quantity: { value: 2000, unit: 'sf' },
            unitPrice: 17,
            totalPrice: 34000
          }],
          subtotal: 34000,
          status: 'pending'
        }
      })
    ]);

    console.log('\n✅ Test data created successfully!\n');

    // Test SAFE bid
    console.log('TEST 1: Safe bid award (should pass)...');
    const safeResponse = await fetch('http://localhost:3000/api/bids/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dealId: safeDeal.id,
        winningBidId: safeBids[0].id
      })
    });

    const safeResult = await safeResponse.json();

    if (safeResponse.status === 200 && safeResult.status === 'AWARDED') {
      console.log('✅ PASS: Safe bid awarded successfully');
      console.log(`   Spread: ${safeResult.stats.spreadPct.toFixed(1)}% (under 15% threshold)`);
    } else {
      console.log('❌ FAIL: Safe bid should have been awarded');
      console.log('   Response:', safeResult);
    }

    // Test RISKY bid
    console.log('\nTEST 2: Risky bid award (should block)...');
    const riskyResponse = await fetch('http://localhost:3000/api/bids/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dealId: riskyDeal.id,
        winningBidId: riskyBids[0].id
      })
    });

    const riskyResult = await riskyResponse.json();

    if (riskyResponse.status === 409 && riskyResult.status === 'BLOCKED_G2') {
      console.log('✅ PASS: Risky bid blocked successfully');
      console.log(`   Spread: ${riskyResult.stats.spreadPct.toFixed(1)}% (exceeds 15% threshold)`);
    } else {
      console.log('❌ FAIL: Risky bid should have been blocked');
      console.log('   Response:', riskyResult);
    }

    console.log('\n🎉 G2 Testing Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testG2();