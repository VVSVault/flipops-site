import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyContractorScores() {
  try {
    console.log('🔍 Verifying contractor score updates...\n');

    const vendors = await prisma.vendor.findMany({
      orderBy: {
        reliability: 'asc' // Worst performers first
      },
      select: {
        id: true,
        name: true,
        trade: true,
        onTimePct: true,
        onBudgetPct: true,
        reliability: true,
        updatedAt: true
      }
    });

    console.log('='.repeat(70));
    console.log('CONTRACTOR RELIABILITY SCORES');
    console.log('='.repeat(70) + '\n');

    vendors.forEach((vendor, idx) => {
      console.log(`${idx + 1}. ${vendor.name} (${vendor.trade})`);
      console.log(`   On-Time: ${vendor.onTimePct.toFixed(1)}%`);
      console.log(`   On-Budget: ${vendor.onBudgetPct.toFixed(1)}%`);
      console.log(`   Reliability: ${vendor.reliability.toFixed(1)}%`);
      console.log(`   Last Updated: ${vendor.updatedAt.toLocaleString()}`);

      // Flag poor performers
      const flags = [];
      if (vendor.onTimePct < 80) flags.push('⚠️ Poor On-Time');
      if (vendor.onBudgetPct < 85) flags.push('⚠️ Poor Budget');
      if (vendor.reliability < 75) flags.push('🚨 Low Reliability');

      if (flags.length > 0) {
        console.log(`   Flags: ${flags.join(', ')}`);
      }
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

verifyContractorScores();
