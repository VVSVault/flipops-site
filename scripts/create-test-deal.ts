/**
 * Create a test deal for Jacksonville investor to verify Slack notifications work
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestDeal() {
  console.log('🏠 Creating test deal for Jacksonville investor...\n');

  try {
    // 1. Create or update a DealSpec
    const deal = await prisma.dealSpec.upsert({
      where: { id: 'test-deal-001' },
      create: {
        id: 'test-deal-001',
        userId: 'test-investor-jacksonville',
        address: '123 Test Street, Jacksonville, FL 32202',
        type: 'SFH', // Single Family Home
        maxExposureUsd: 300000,
        targetRoiPct: 25,
        constraints: '[]', // Empty constraints for now
        createdAt: new Date(),
      },
      update: {
        // Update if already exists
        address: '123 Test Street, Jacksonville, FL 32202',
      }
    });

    console.log('✅ Created DealSpec:', deal.id);

    // 2. Create or update a G1 APPROVE event so it shows up as "active"
    const event = await prisma.event.upsert({
      where: { id: 'test-event-001' },
      create: {
        id: 'test-event-001',
        dealId: 'test-deal-001',
        actor: 'system:G1',
        action: 'APPROVE',
        artifact: 'DealSpec',
        checksum: 'test-checksum-001', // Simple checksum for testing
        ts: new Date(),
      },
      update: {
        // Update if already exists
        action: 'APPROVE',
      }
    });

    console.log('✅ Created Event:', event.id);
    console.log('   Action:', event.action);
    console.log('   Actor:', event.actor);

    // 3. Verify the deal shows up in active deals endpoint
    console.log('\n🔍 Verifying deal appears in API...');

    const response = await fetch('http://localhost:3007/api/deals/active?userId=test-investor-jacksonville');
    const data = await response.json();

    console.log('   Active deals count:', data.count);
    console.log('   Success:', data.count > 0 ? '✅' : '❌');

    if (data.count > 0) {
      console.log('   First deal:', data.deals[0].address);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST DEAL CREATED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log('\n📋 Next steps:');
    console.log('   1. Run "Data Refresh & Sync" workflow in n8n');
    console.log('   2. Check your Slack channel for notification');
    console.log('   3. Should see: "📊 1 active deals for Jacksonville Test Investor"');
    console.log();

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestDeal();
