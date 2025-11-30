/**
 * Create test guardrail violation events for testing cron jobs
 * This creates BLOCK events that the guardrail workflows will pick up
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestViolations() {
  console.log('🔨 Creating test guardrail violations...\n');

  try {
    // Find an existing deal or create one
    let deal = await prisma.dealSpec.findFirst({
      where: {
        userId: 'test-investor-jacksonville',
      },
    });

    if (!deal) {
      console.log('📝 Creating test deal...');
      deal = await prisma.dealSpec.create({
        data: {
          id: 'test-deal-guardrails',
          userId: 'test-investor-jacksonville',
          address: '123 Test Street, Jacksonville, FL 32202',
          type: 'SFH',
          maxExposureUsd: 300000,
          targetRoiPct: 25,
          constraints: '[]',
        },
      });
      console.log('✅ Test deal created\n');
    }

    // Create G1 violation (P80 > maxExposureUsd)
    console.log('Creating G1 violation (Deal Approval)...');
    const g1Event = await prisma.event.create({
      data: {
        dealId: deal.id,
        actor: 'system:G1',
        action: 'BLOCK',
        artifact: 'DealSpec',
        checksum: 'test-g1-' + Date.now(),
        ts: new Date(),
        diff: JSON.stringify({
          reason: 'P80 exceeds max exposure',
          p80: 350000,
          maxExposureUsd: 300000,
          overBy: 50000,
          overByPct: 16.67,
          drivers: [
            'High material costs',
            'Labor market tight',
            'Permit delays'
          ]
        }),
      },
    });
    console.log(`✅ G1 event created: ${g1Event.id}\n`);

    // Create G2 violation (Bid spread > 15%)
    console.log('Creating G2 violation (Bid Spread)...');
    const g2Event = await prisma.event.create({
      data: {
        dealId: deal.id,
        actor: 'system:G2',
        action: 'BLOCK',
        artifact: 'Bid',
        checksum: 'test-g2-' + Date.now(),
        ts: new Date(),
        diff: JSON.stringify({
          reason: 'Bid spread exceeds 15%',
          bidSpread: 0.22,
          lowestBid: 100000,
          highestBid: 122000,
          totalBids: 4,
        }),
      },
    });
    console.log(`✅ G2 event created: ${g2Event.id}\n`);

    // Create G3 violation (Budget overrun)
    console.log('Creating G3 violation (Budget Overrun)...');
    const g3Event = await prisma.event.create({
      data: {
        dealId: deal.id,
        actor: 'system:G3',
        action: 'BLOCK',
        artifact: 'BudgetLedger',
        checksum: 'test-g3-' + Date.now(),
        ts: new Date(),
        diff: JSON.stringify({
          reason: 'Budget variance exceeds threshold',
          budgetVariance: 25000,
          budgetVariancePct: 12.5,
          actual: 225000,
          budgeted: 200000,
        }),
      },
    });
    console.log(`✅ G3 event created: ${g3Event.id}\n`);

    // Create G4 violation (Change order impact)
    console.log('Creating G4 violation (Change Order)...');
    const g4Event = await prisma.event.create({
      data: {
        dealId: deal.id,
        actor: 'system:G4',
        action: 'BLOCK',
        artifact: 'ChangeOrder',
        checksum: 'test-g4-' + Date.now(),
        ts: new Date(),
        diff: JSON.stringify({
          reason: 'Change order impact exceeds threshold',
          changeOrderImpact: 18000,
          changeOrderImpactPct: 9,
          originalBudget: 200000,
          newBudget: 218000,
        }),
      },
    });
    console.log(`✅ G4 event created: ${g4Event.id}\n`);

    console.log('🎉 All test violations created!\n');
    console.log('📋 Summary:');
    console.log(`   Deal: ${deal.address}`);
    console.log(`   G1 Event: ${g1Event.id}`);
    console.log(`   G2 Event: ${g2Event.id}`);
    console.log(`   G3 Event: ${g3Event.id}`);
    console.log(`   G4 Event: ${g4Event.id}`);
    console.log('\n✨ Now run the guardrail workflows to test Slack notifications:');
    console.log('   npm run cron:g1');
    console.log('   npm run cron:g2');
    console.log('   npm run cron:g3');
    console.log('   npm run cron:g4');

  } catch (error) {
    console.error('❌ Error creating test violations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestViolations();
