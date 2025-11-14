import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestInvoiceData() {
  console.log('📋 Creating test invoice and budget data...\n');

  try {
    // 1. Create test vendors
    console.log('Creating test vendors...');
    const vendors = await Promise.all([
      prisma.vendor.upsert({
        where: { id: 'test-vendor-plumbing' },
        update: {},
        create: {
          id: 'test-vendor-plumbing',
          name: 'ABC Plumbing Co',
          email: 'contact@abcplumbing.com',
          phone: '555-0101',
          trade: 'Plumbing',
          region: 'Miami',
          reliability: 85.5
        }
      }),
      prisma.vendor.upsert({
        where: { id: 'test-vendor-electrical' },
        update: {},
        create: {
          id: 'test-vendor-electrical',
          name: 'Lightning Electric',
          email: 'info@lightning.com',
          phone: '555-0102',
          trade: 'Electrical',
          region: 'Miami',
          reliability: 92.0
        }
      }),
      prisma.vendor.upsert({
        where: { id: 'test-vendor-hvac' },
        update: {},
        create: {
          id: 'test-vendor-hvac',
          name: 'Cool Air HVAC',
          email: 'service@coolair.com',
          phone: '555-0103',
          trade: 'HVAC',
          region: 'Miami',
          reliability: 78.5
        }
      })
    ]);
    console.log('✅ Created 3 test vendors\n');

    // 2. Get existing deals or create test deals
    console.log('Finding existing deals...');
    const existingDeals = await prisma.dealSpec.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' }
    });

    if (existingDeals.length === 0) {
      console.log('❌ No deals found. Please create some deals first.');
      return;
    }

    const [deal1, deal2, deal3] = existingDeals;
    console.log(`✅ Found ${existingDeals.length} deals to use for testing\n`);

    // 3. Note: Budget ledger uses JSON format, skipping for now
    // The invoices with status flags are what trigger the alerts
    console.log('Skipping budget ledger (uses JSON format)...\n');

    // 4. Create invoices with flagged status
    console.log('Creating flagged invoices...');

    // Invoice 1: Tier 1 warning (approved_with_warning)
    const invoice1 = await prisma.invoice.create({
      data: {
        dealId: deal1.id,
        vendorId: 'test-vendor-plumbing',
        trade: 'Plumbing',
        amount: 750,
        status: 'approved_with_warning', // TIER1
        docUrl: 'https://example.com/invoice1.pdf'
      }
    });

    // Invoice 2: Tier 2 critical (flagged)
    const invoice2 = await prisma.invoice.create({
      data: {
        dealId: deal2.id,
        vendorId: 'test-vendor-electrical',
        trade: 'Electrical',
        amount: 2000,
        status: 'flagged', // TIER2
        docUrl: 'https://example.com/invoice2.pdf'
      }
    });

    // Invoice 3: Tier 2 critical (flagged)
    const invoice3 = await prisma.invoice.create({
      data: {
        dealId: deal3.id,
        vendorId: 'test-vendor-hvac',
        trade: 'HVAC',
        amount: 2160,
        status: 'flagged', // TIER2
        docUrl: 'https://example.com/invoice3.pdf'
      }
    });

    // Invoice 4: Additional Tier 1 warning for same deal
    const invoice4 = await prisma.invoice.create({
      data: {
        dealId: deal1.id,
        vendorId: 'test-vendor-plumbing',
        trade: 'Plumbing',
        amount: 500,
        status: 'approved_with_warning', // TIER1
        docUrl: 'https://example.com/invoice4.pdf'
      }
    });

    console.log('✅ Created 4 test invoices\n');

    // 5. Create test events for budget tiers
    console.log('Creating budget tier events...');

    await prisma.event.create({
      data: {
        dealId: deal1.id,
        actor: 'system:G3',
        artifact: 'Invoice',
        action: 'FLAG_TIER1',
        checksum: 'test-checksum-1',
        diff: JSON.stringify({
          invoiceId: invoice1.id,
          trade: 'Plumbing',
          variance: 5.0
        })
      }
    });

    await prisma.event.create({
      data: {
        dealId: deal2.id,
        actor: 'system:G3',
        artifact: 'Invoice',
        action: 'ESCALATE_TIER2',
        checksum: 'test-checksum-2',
        diff: JSON.stringify({
          invoiceId: invoice2.id,
          trade: 'Electrical',
          variance: 10.0
        })
      }
    });

    await prisma.event.create({
      data: {
        dealId: deal3.id,
        actor: 'system:G3',
        artifact: 'Invoice',
        action: 'ESCALATE_TIER2',
        checksum: 'test-checksum-3',
        diff: JSON.stringify({
          invoiceId: invoice3.id,
          trade: 'HVAC',
          variance: 12.0
        })
      }
    });

    await prisma.event.create({
      data: {
        dealId: deal2.id,
        actor: 'system:G3',
        artifact: 'ChangeOrder',
        action: 'QUEUE_COG_SIMULATION',
        checksum: 'test-checksum-4',
        diff: JSON.stringify({
          triggeredBy: 'variance_tier2',
          invoiceId: invoice2.id,
          priority: 'high'
        })
      }
    });

    console.log('✅ Created 4 budget tier events\n');

    // 6. Summary
    console.log('=' .repeat(70));
    console.log('✅ TEST DATA CREATED SUCCESSFULLY!\n');
    console.log('Summary:');
    console.log(`  • Vendors: 3`);
    console.log(`  • Deals with issues: 3`);
    console.log(`  • Flagged invoices: 4`);
    console.log(`    - Tier 1 (Warning): 2 invoices`);
    console.log(`    - Tier 2 (Critical): 2 invoices`);
    console.log(`  • Budget tier events: 4\n`);

    console.log('Test Scenario Created:');
    console.log(`  1. ${deal1.address || 'Deal 1'}:`);
    console.log(`     - Plumbing: 5% over budget (Tier 1 Warning)`);
    console.log(`     - 2 invoices with warnings\n`);

    console.log(`  2. ${deal2.address || 'Deal 2'}:`);
    console.log(`     - Electrical: 10% over budget (Tier 2 Critical)`);
    console.log(`     - COG simulation queued\n`);

    console.log(`  3. ${deal3.address || 'Deal 3'}:`);
    console.log(`     - HVAC: 12% over budget (Tier 2 Critical)\n`);

    console.log('Next Steps:');
    console.log('  1. Run the Invoice & Budget Guardian workflow');
    console.log('  2. Check Slack for budget alert notification');
    console.log('  3. Review the detailed breakdown by deal and trade\n');

    console.log('=' .repeat(70));

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestInvoiceData();
