import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestStalledDeals() {
  try {
    console.log('🧪 Creating test stalled deals for pipeline monitoring...\n');

    // Calculate dates for stalled deals
    const now = new Date();
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    // Create test vendor first
    console.log('📋 Step 1: Creating test vendor...');
    const vendor = await prisma.vendor.create({
      data: {
        name: 'Test HVAC Company',
        email: 'test@hvac.com',
        phone: '555-0100',
        trade: 'HVAC',
        region: 'Miami'
      }
    });
    console.log(`   ✅ Created vendor: ${vendor.name} (${vendor.id})`);

    // G1: Create deal without approval (4 days old - exceeds 3 day threshold)
    console.log('\n📋 Step 2: Creating G1 stalled deal (pending approval)...');
    const g1Deal = await prisma.dealSpec.create({
      data: {
        address: '123 Stalled Ave',
        type: 'SFH',
        maxExposureUsd: 250000,
        targetRoiPct: 20,
        arv: 400000,
        region: 'Miami',
        grade: 'Standard',
        dailyBurnUsd: 0,
        constraints: '[]',
        createdAt: fourDaysAgo
      }
    });
    console.log(`   ✅ Created G1 deal: ${g1Deal.address} (${g1Deal.id})`);
    console.log(`      Stalled for: 4 days (threshold: 3 days)`);

    // G2: Create deal with pending bid (6 days old - exceeds 5 day threshold)
    console.log('\n📋 Step 3: Creating G2 stalled deal (pending bid)...');
    const g2Deal = await prisma.dealSpec.create({
      data: {
        address: '456 Bid Pending Rd',
        type: 'SFH',
        maxExposureUsd: 300000,
        targetRoiPct: 25,
        arv: 500000,
        region: 'Miami',
        grade: 'Premium',
        dailyBurnUsd: 0,
        constraints: '[]',
        createdAt: sixDaysAgo
      }
    });

    // Create pending bid
    const g2Bid = await prisma.bid.create({
      data: {
        dealId: g2Deal.id,
        vendorId: vendor.id,
        items: JSON.stringify([
          {
            trade: 'HVAC',
            task: 'Replace AC Unit',
            quantity: { value: 1, unit: 'ea' },
            unitPrice: 5000,
            totalPrice: 5000
          }
        ]),
        subtotal: 5000,
        includes: JSON.stringify(['Labor', 'Materials']),
        excludes: JSON.stringify(['Permits']),
        status: 'pending',
        createdAt: sixDaysAgo
      }
    });
    console.log(`   ✅ Created G2 deal: ${g2Deal.address} (${g2Deal.id})`);
    console.log(`   ✅ Created pending bid: ${g2Bid.id}`);
    console.log(`      Stalled for: 6 days (threshold: 5 days)`);

    // G3: Create deal with pending invoice (3 days old - exceeds 2 day threshold)
    console.log('\n📋 Step 4: Creating G3 stalled deal (pending invoice)...');
    const g3Deal = await prisma.dealSpec.create({
      data: {
        address: '789 Invoice Pending Ln',
        type: 'Multi-family',
        maxExposureUsd: 400000,
        targetRoiPct: 22,
        arv: 650000,
        region: 'Miami',
        grade: 'Standard',
        dailyBurnUsd: 0,
        constraints: '[]',
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      }
    });

    // Create pending invoice
    const g3Invoice = await prisma.invoice.create({
      data: {
        dealId: g3Deal.id,
        vendorId: vendor.id,
        trade: 'Plumbing',
        amount: 8500,
        status: 'pending',
        createdAt: threeDaysAgo
      }
    });
    console.log(`   ✅ Created G3 deal: ${g3Deal.address} (${g3Deal.id})`);
    console.log(`   ✅ Created pending invoice: ${g3Invoice.id}`);
    console.log(`      Stalled for: 3 days (threshold: 2 days)`);

    // G4: Create deal with pending change order (2 days old - exceeds 1 day threshold)
    console.log('\n📋 Step 5: Creating G4 stalled deal (pending change order)...');
    const g4Deal = await prisma.dealSpec.create({
      data: {
        address: '321 Change Order St',
        type: 'SFH',
        maxExposureUsd: 350000,
        targetRoiPct: 18,
        arv: 550000,
        region: 'Miami',
        grade: 'Luxury',
        dailyBurnUsd: 0,
        constraints: '[]',
        createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
      }
    });

    // Create proposed change order
    const g4CO = await prisma.changeOrder.create({
      data: {
        dealId: g4Deal.id,
        trade: 'Electrical',
        deltaUsd: 12000,
        impactDays: 5,
        status: 'proposed',
        rationale: 'Need to upgrade panel for additional circuits',
        createdAt: twoDaysAgo
      }
    });
    console.log(`   ✅ Created G4 deal: ${g4Deal.address} (${g4Deal.id})`);
    console.log(`   ✅ Created pending change order: ${g4CO.id}`);
    console.log(`      Stalled for: 2 days (threshold: 1 day)`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ TEST DATA CREATED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('\n📊 Summary:');
    console.log(`   • G1: 1 deal pending approval (4 days stalled)`);
    console.log(`   • G2: 1 bid pending award (6 days stalled)`);
    console.log(`   • G3: 1 invoice pending processing (3 days stalled)`);
    console.log(`   • G4: 1 change order pending approval (2 days stalled)`);
    console.log(`   • Total: 4 stalled deals`);
    console.log('\n🔗 Test the API:');
    console.log('   curl https://5110458fa3eb.ngrok-free.app/api/deals/stalled');
    console.log('\n⚡ Test the n8n workflow:');
    console.log('   https://primary-production-8b46.up.railway.app/workflow/nAo1KXMEKnXvNSyD');
    console.log('   → Click "Execute Workflow" → "Manual Trigger"');

  } catch (error) {
    console.error('\n❌ Failed to create test data:', error);
    if (error instanceof Error) {
      console.error('   Details:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestStalledDeals();
