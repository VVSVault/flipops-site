import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStalledDeals() {
  console.log('🔍 Checking for stalled deals in database...\n');

  try {
    const now = new Date();

    // G1: Deals without APPROVE or BLOCK events (>72 hours)
    const g1Threshold = 72; // 3 days in hours
    const g1DealsWithEvents = await prisma.event.findMany({
      where: {
        artifact: 'DealSpec',
        action: { in: ['APPROVE', 'BLOCK'] },
        actor: 'system:G1'
      },
      select: { dealId: true },
      distinct: ['dealId']
    });

    const g1ProcessedDealIds = g1DealsWithEvents.map(e => e.dealId).filter(id => id !== null);

    const g1StalledDeals = await prisma.dealSpec.findMany({
      where: {
        id: { notIn: g1ProcessedDealIds },
        createdAt: {
          lte: new Date(now.getTime() - g1Threshold * 60 * 60 * 1000)
        }
      },
      select: {
        id: true,
        address: true,
        createdAt: true,
      }
    });

    console.log('G1 (Deal Approval) - Threshold: 3 days');
    console.log(`  Stalled deals: ${g1StalledDeals.length}`);
    if (g1StalledDeals.length > 0) {
      g1StalledDeals.forEach((deal, i) => {
        const hoursSinceCreation = Math.floor((now.getTime() - deal.createdAt.getTime()) / (1000 * 60 * 60));
        const days = Math.floor(hoursSinceCreation / 24);
        console.log(`    ${i + 1}. ${deal.address} - stalled ${days}d ${hoursSinceCreation % 24}h`);
      });
    }
    console.log();

    // G2: Bids pending award (>120 hours)
    const g2Threshold = 120; // 5 days
    const g2StalledBids = await prisma.bid.findMany({
      where: {
        status: 'pending',
        createdAt: {
          lte: new Date(now.getTime() - g2Threshold * 60 * 60 * 1000)
        }
      },
      include: {
        deal: {
          select: { address: true }
        }
      }
    });

    console.log('G2 (Bid Award) - Threshold: 5 days');
    console.log(`  Stalled bids: ${g2StalledBids.length}`);
    if (g2StalledBids.length > 0) {
      g2StalledBids.forEach((bid, i) => {
        const hoursSinceCreation = Math.floor((now.getTime() - bid.createdAt.getTime()) / (1000 * 60 * 60));
        const days = Math.floor(hoursSinceCreation / 24);
        console.log(`    ${i + 1}. ${bid.deal.address} - stalled ${days}d ${hoursSinceCreation % 24}h`);
      });
    }
    console.log();

    // G3: Invoices pending processing (>48 hours)
    const g3Threshold = 48; // 2 days
    const g3StalledInvoices = await prisma.invoice.findMany({
      where: {
        status: 'pending',
        createdAt: {
          lte: new Date(now.getTime() - g3Threshold * 60 * 60 * 1000)
        }
      }
    });

    console.log('G3 (Invoice Processing) - Threshold: 2 days');
    console.log(`  Stalled invoices: ${g3StalledInvoices.length}`);
    if (g3StalledInvoices.length > 0) {
      g3StalledInvoices.forEach((invoice, i) => {
        const hoursSinceCreation = Math.floor((now.getTime() - invoice.createdAt.getTime()) / (1000 * 60 * 60));
        const days = Math.floor(hoursSinceCreation / 24);
        console.log(`    ${i + 1}. Invoice ${invoice.id.slice(0, 8)}... - stalled ${days}d ${hoursSinceCreation % 24}h`);
      });
    }
    console.log();

    // G4: Change orders pending (>24 hours)
    const g4Threshold = 24; // 1 day
    const g4StalledCOs = await prisma.changeOrder.findMany({
      where: {
        status: 'proposed',
        createdAt: {
          lte: new Date(now.getTime() - g4Threshold * 60 * 60 * 1000)
        }
      },
      include: {
        deal: {
          select: { address: true }
        }
      }
    });

    console.log('G4 (Change Orders) - Threshold: 1 day');
    console.log(`  Stalled change orders: ${g4StalledCOs.length}`);
    if (g4StalledCOs.length > 0) {
      g4StalledCOs.forEach((co, i) => {
        const hoursSinceCreation = Math.floor((now.getTime() - co.createdAt.getTime()) / (1000 * 60 * 60));
        const days = Math.floor(hoursSinceCreation / 24);
        console.log(`    ${i + 1}. ${co.deal.address} - stalled ${days}d ${hoursSinceCreation % 24}h`);
      });
    }
    console.log();

    const totalStalled = g1StalledDeals.length + g2StalledBids.length + g3StalledInvoices.length + g4StalledCOs.length;

    if (totalStalled > 0) {
      console.log(`\n⚠️  Total stalled items: ${totalStalled}`);
      console.log('These would trigger a Slack alert when the workflow runs.\n');
    } else {
      console.log('✨ No stalled items found! Pipeline is healthy.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStalledDeals();
