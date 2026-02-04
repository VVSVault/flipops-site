import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Quick seeding for G2 test...');

  // Clean up
  await prisma.event.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.budgetLedger.deleteMany();
  await prisma.changeOrder.deleteMany();
  await prisma.scopeTreeNode.deleteMany();
  await prisma.dealSpec.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.vendor.deleteMany();

  // Create policy
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
  const [vendor1, vendor2, vendor3] = await Promise.all([
    prisma.vendor.create({
      data: {
        name: 'Miami Roofing Pros',
        trade: ['Roofing'],
        region: 'Miami'
      }
    }),
    prisma.vendor.create({
      data: {
        name: 'Quality Roof Solutions',
        trade: ['Roofing'],
        region: 'Miami'
      }
    }),
    prisma.vendor.create({
      data: {
        name: 'Premium Roofing Co',
        trade: ['Roofing'],
        region: 'Miami'
      }
    })
  ]);

  // Create deal for SAFE test (low spread)
  const safeDeal = await prisma.dealSpec.create({
    data: {
      address: '123 Safe Test St, Miami FL',
      policyId: policy.id,
      dealType: 'flip',
      rehab: {}
    }
  });

  // Create deal for RISKY test (high spread)
  const riskyDeal = await prisma.dealSpec.create({
    data: {
      address: '456 Risky Test Ave, Miami FL',
      policyId: policy.id,
      dealType: 'flip',
      rehab: {}
    }
  });

  // Create SAFE bids (low spread ~10%)
  const safeBids = await Promise.all([
    prisma.bid.create({
      data: {
        dealId: safeDeal.id,
        vendorId: vendor1.id,
        items: [
          {
            trade: 'Roofing',
            task: 'Replace roof',
            quantity: { value: 15, unit: 'squares' },
            unitPrice: 600,
            totalPrice: 9000
          }
        ],
        subtotal: 9000,
        status: 'pending'
      }
    }),
    prisma.bid.create({
      data: {
        dealId: safeDeal.id,
        vendorId: vendor2.id,
        items: [
          {
            trade: 'Roofing',
            task: 'Replace roof',
            quantity: { value: 1500, unit: 'sqft' },
            unitPrice: 6.3,
            totalPrice: 9450
          }
        ],
        subtotal: 9450,
        status: 'pending'
      }
    }),
    prisma.bid.create({
      data: {
        dealId: safeDeal.id,
        vendorId: vendor3.id,
        items: [
          {
            trade: 'Roofing',
            task: 'Replace roof',
            quantity: { value: 1500, unit: 'sf' },
            unitPrice: 6.6,
            totalPrice: 9900
          }
        ],
        subtotal: 9900,
        status: 'pending'
      }
    })
  ]);

  // Create RISKY bids (high spread ~40%)
  const riskyBids = await Promise.all([
    prisma.bid.create({
      data: {
        dealId: riskyDeal.id,
        vendorId: vendor1.id,
        items: [
          {
            trade: 'Roofing',
            task: 'Replace roof',
            quantity: { value: 20, unit: 'squares' },
            unitPrice: 1200,
            totalPrice: 24000
          }
        ],
        subtotal: 24000,
        status: 'pending'
      }
    }),
    prisma.bid.create({
      data: {
        dealId: riskyDeal.id,
        vendorId: vendor2.id,
        items: [
          {
            trade: 'Roofing',
            task: 'Replace roof',
            quantity: { value: 2000, unit: 'sqft' },
            unitPrice: 14,
            totalPrice: 28000
          }
        ],
        subtotal: 28000,
        status: 'pending'
      }
    }),
    prisma.bid.create({
      data: {
        dealId: riskyDeal.id,
        vendorId: vendor3.id,
        items: [
          {
            trade: 'Roofing',
            task: 'Replace roof',
            quantity: { value: 2000, unit: 'sf' },
            unitPrice: 17,
            totalPrice: 34000
          }
        ],
        subtotal: 34000,
        status: 'pending'
      }
    })
  ]);

  console.log('✅ Seeding complete!');
  console.log('\n📋 Test Data Created:');
  console.log('===================');
  console.log(`SAFE Deal: ${safeDeal.id}`);
  console.log(`  - Bids: ${safeBids.map(b => `$${b.subtotal}`).join(', ')}`);
  console.log(`  - Spread: ~10% (should PASS G2)`);
  console.log(`  - First bid ID: ${safeBids[0].id}`);

  console.log(`\nRISKY Deal: ${riskyDeal.id}`);
  console.log(`  - Bids: ${riskyBids.map(b => `$${b.subtotal}`).join(', ')}`);
  console.log(`  - Spread: ~40% (should FAIL G2)`);
  console.log(`  - First bid ID: ${riskyBids[0].id}`);

  console.log('\n🧪 Test Commands:');
  console.log('================');
  console.log('# Test SAFE bid (should award):');
  console.log(`curl -X POST http://localhost:3000/api/bids/award -H "Content-Type: application/json" -d "{\\"dealId\\":\\"${safeDeal.id}\\",\\"winningBidId\\":\\"${safeBids[0].id}\\"}"`);

  console.log('\n# Test RISKY bid (should block):');
  console.log(`curl -X POST http://localhost:3000/api/bids/award -H "Content-Type: application/json" -d "{\\"dealId\\":\\"${riskyDeal.id}\\",\\"winningBidId\\":\\"${riskyBids[0].id}\\"}"`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());