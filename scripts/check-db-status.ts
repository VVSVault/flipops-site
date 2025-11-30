import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseStatus() {
  try {
    console.log('📊 Checking database status...\n');

    const [dealCount, bidCount, invoiceCount, changeOrderCount] = await Promise.all([
      prisma.dealSpec.count(),
      prisma.bid.count(),
      prisma.invoice.count(),
      prisma.changeOrder.count(),
    ]);

    console.log('Current counts:');
    console.log(`  • Deals: ${dealCount}`);
    console.log(`  • Bids: ${bidCount}`);
    console.log(`  • Invoices: ${invoiceCount}`);
    console.log(`  • Change Orders: ${changeOrderCount}\n`);

    if (dealCount > 0) {
      const recentDeals = await prisma.dealSpec.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          address: true,
          createdAt: true,
        }
      });

      console.log('Recent deals:');
      recentDeals.forEach((deal, i) => {
        console.log(`  ${i + 1}. ${deal.address || 'Unknown'} (created ${deal.createdAt.toISOString()})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStatus();
