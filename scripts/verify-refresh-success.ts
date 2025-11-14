import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyRefreshSuccess() {
  try {
    console.log('🔍 Verifying Property Data Refresh Success...\n');

    // Check for DATA_REFRESH events
    const refreshEvents = await prisma.event.findMany({
      where: {
        artifact: 'DealSpec',
        action: 'DATA_REFRESH',
        actor: 'system:property-data-refresh'
      },
      include: {
        deal: {
          select: {
            id: true,
            address: true,
            arv: true,
            maxExposureUsd: true,
            targetRoiPct: true,
            updatedAt: true
          }
        }
      },
      orderBy: {
        ts: 'desc'
      },
      take: 10
    });

    console.log('📊 Recent DATA_REFRESH Events:');
    console.log(`   Found: ${refreshEvents.length} events\n`);

    if (refreshEvents.length > 0) {
      console.log('   Most Recent Refreshes:');
      refreshEvents.forEach((event, idx) => {
        if (event.deal) {
          console.log(`   ${idx + 1}. ${event.deal.address}`);
          console.log(`      ARV: $${event.deal.arv?.toLocaleString() || 'N/A'}`);
          console.log(`      Max Exposure: $${event.deal.maxExposureUsd?.toLocaleString() || 'N/A'}`);
          console.log(`      Target ROI: ${event.deal.targetRoiPct?.toFixed(2) || 'N/A'}%`);
          console.log(`      Updated: ${event.deal.updatedAt.toLocaleString()}`);
          console.log('');
        }
      });
    }

    // Get all active deals to show current state
    const activeDeals = await prisma.dealSpec.findMany({
      take: 8,
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        id: true,
        address: true,
        arv: true,
        maxExposureUsd: true,
        targetRoiPct: true,
        updatedAt: true
      }
    });

    console.log('='.repeat(70));
    console.log('📋 Current State of Deals (Most Recently Updated):');
    console.log('='.repeat(70) + '\n');

    activeDeals.forEach((deal, idx) => {
      console.log(`${idx + 1}. ${deal.address}`);
      console.log(`   ID: ${deal.id}`);
      console.log(`   ARV: $${deal.arv?.toLocaleString() || 'N/A'}`);
      console.log(`   Max Exposure: $${deal.maxExposureUsd?.toLocaleString() || 'N/A'}`);
      console.log(`   Target ROI: ${deal.targetRoiPct?.toFixed(2) || 'N/A'}%`);
      console.log(`   Last Updated: ${deal.updatedAt.toLocaleString()}`);
      console.log('');
    });

    console.log('='.repeat(70));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Details:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

verifyRefreshSuccess();
