import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestContractorData() {
  try {
    console.log('🏗️  Creating test contractor data...\n');

    // Create 5 contractors with varying performance
    const contractors = [
      {
        name: 'Ace Plumbing LLC',
        email: 'contact@aceplumbing.com',
        phone: '305-555-0101',
        trade: 'Plumbing',
        region: 'Miami-Dade',
        onTimePct: 95,
        onBudgetPct: 92,
        reliability: 93.5
      },
      {
        name: 'Elite Electric Co',
        email: 'info@eliteelectric.com',
        phone: '305-555-0102',
        trade: 'Electrical',
        region: 'Miami-Dade',
        onTimePct: 88,
        onBudgetPct: 75, // Poor budget performance - will be flagged
        reliability: 80
      },
      {
        name: 'Quick Fix HVAC',
        email: 'service@quickfixhvac.com',
        phone: '305-555-0103',
        trade: 'HVAC',
        region: 'Broward',
        onTimePct: 72, // Poor on-time performance - will be flagged
        onBudgetPct: 85,
        reliability: 77
      },
      {
        name: 'Premium Roofing Solutions',
        email: 'jobs@premiumroofing.com',
        phone: '305-555-0104',
        trade: 'Roofing',
        region: 'Miami-Dade',
        onTimePct: 98,
        onBudgetPct: 96,
        reliability: 97
      },
      {
        name: 'Budget Builders Inc',
        email: 'contact@budgetbuilders.com',
        phone: '305-555-0105',
        trade: 'General Contractor',
        region: 'Palm Beach',
        onTimePct: 65, // Very poor - will be flagged
        onBudgetPct: 60, // Very poor - will be flagged
        reliability: 62 // Low reliability - will be flagged
      }
    ];

    const createdVendors = [];
    for (const contractor of contractors) {
      const vendor = await prisma.vendor.create({
        data: contractor
      });
      createdVendors.push(vendor);
      console.log(`✅ Created: ${vendor.name} (${vendor.trade})`);
    }

    console.log(`\n📊 Created ${createdVendors.length} contractors\n`);

    // Get some existing deals to create bids for
    const deals = await prisma.dealSpec.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    if (deals.length === 0) {
      console.log('⚠️  No deals found - skipping bid/invoice creation');
      return;
    }

    console.log(`Found ${deals.length} deals to create bids for\n`);

    // Create bids for each contractor
    let bidCount = 0;
    for (const vendor of createdVendors) {
      // Create 2-3 bids per contractor
      const numBids = Math.floor(Math.random() * 2) + 2;

      for (let i = 0; i < numBids && i < deals.length; i++) {
        const deal = deals[i];
        const bidAmount = Math.floor(Math.random() * 50000) + 20000;

        const bid = await prisma.bid.create({
          data: {
            dealId: deal.id,
            vendorId: vendor.id,
            items: JSON.stringify([
              {
                trade: vendor.trade,
                task: 'Standard installation',
                quantity: 1,
                unit: 'project',
                unitPrice: bidAmount,
                totalPrice: bidAmount
              }
            ]),
            subtotal: bidAmount,
            includes: { materials: true, labor: true },
            excludes: { permits: true },
            status: i === 0 ? 'awarded' : 'pending' // Award first bid
          }
        });

        bidCount++;

        // Create invoice for awarded bid with variance
        if (bid.status === 'awarded') {
          // Simulate budget variance based on contractor's budget performance
          const budgetFactor = vendor.onBudgetPct < 75 ? 1.2 : 1.05; // 20% over or 5% over
          const invoiceAmount = Math.floor(bidAmount * budgetFactor);

          await prisma.invoice.create({
            data: {
              dealId: deal.id,
              vendorId: vendor.id,
              trade: vendor.trade,
              amount: invoiceAmount,
              status: 'approved'
            }
          });

          console.log(`   💰 ${vendor.name}: Bid $${bidAmount.toLocaleString()} → Invoice $${invoiceAmount.toLocaleString()}`);
        }
      }
    }

    console.log(`\n✅ Created ${bidCount} bids`);

    // Create some change orders for contractors with poor performance
    const poorPerformers = createdVendors.filter(v => v.onBudgetPct < 80 || v.onTimePct < 80);

    let changeOrderCount = 0;
    for (const vendor of poorPerformers) {
      // Find awarded bids for this vendor
      const vendorBids = await prisma.bid.findMany({
        where: {
          vendorId: vendor.id,
          status: 'awarded'
        }
      });

      for (const bid of vendorBids) {
        // Create 1-2 change orders
        const numChangeOrders = Math.floor(Math.random() * 2) + 1;

        for (let i = 0; i < numChangeOrders; i++) {
          await prisma.changeOrder.create({
            data: {
              dealId: bid.dealId,
              trade: vendor.trade,
              deltaUsd: Math.floor(Math.random() * 5000) + 1000,
              impactDays: Math.floor(Math.random() * 10) + 3,
              status: 'approved',
              rationale: 'Unexpected site conditions'
            }
          });

          changeOrderCount++;
        }
      }
    }

    console.log(`✅ Created ${changeOrderCount} change orders for poor performers\n`);

    console.log('='.repeat(70));
    console.log('✅ TEST CONTRACTOR DATA CREATED!');
    console.log('='.repeat(70));
    console.log('\n📊 Summary:');
    console.log(`   • Contractors: ${createdVendors.length}`);
    console.log(`   • Bids: ${bidCount}`);
    console.log(`   • Change Orders: ${changeOrderCount}`);
    console.log('\n🚨 Expected Flags:');
    console.log('   • Elite Electric Co: POOR_BUDGET_PERFORMANCE');
    console.log('   • Quick Fix HVAC: POOR_ON_TIME_PERFORMANCE');
    console.log('   • Budget Builders Inc: Multiple flags (poor performance)');
    console.log('\n✅ Ready to test workflow!');

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Details:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestContractorData();
