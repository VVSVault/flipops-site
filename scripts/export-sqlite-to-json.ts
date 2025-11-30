/**
 * Export all data from SQLite database to JSON files
 * This creates a complete backup before migrating to PostgreSQL
 *
 * IMPORTANT: This does NOT export n8n data - n8n has its own separate database
 * This only exports FlipOps application data (users, properties, deals, etc.)
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function exportAllData() {
  console.log('📦 Exporting SQLite database to JSON...\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportDir = path.join(__dirname, '../backups/sqlite-export-' + timestamp);

  // Create export directory
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  console.log(`📁 Export directory: ${exportDir}\n`);

  try {
    // Export Users
    console.log('👥 Exporting users...');
    const users = await prisma.user.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'users.json'),
      JSON.stringify(users, null, 2)
    );
    console.log(`   ✅ ${users.length} users exported\n`);

    // Export Properties
    console.log('🏠 Exporting properties...');
    const properties = await prisma.property.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'properties.json'),
      JSON.stringify(properties, null, 2)
    );
    console.log(`   ✅ ${properties.length} properties exported\n`);

    // Export DealSpecs
    console.log('📋 Exporting deals...');
    const deals = await prisma.dealSpec.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'deals.json'),
      JSON.stringify(deals, null, 2)
    );
    console.log(`   ✅ ${deals.length} deals exported\n`);

    // Export Vendors
    console.log('🔧 Exporting vendors...');
    const vendors = await prisma.vendor.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'vendors.json'),
      JSON.stringify(vendors, null, 2)
    );
    console.log(`   ✅ ${vendors.length} vendors exported\n`);

    // Export Policies
    console.log('📜 Exporting policies...');
    const policies = await prisma.policy.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'policies.json'),
      JSON.stringify(policies, null, 2)
    );
    console.log(`   ✅ ${policies.length} policies exported\n`);

    // Export CostModels
    console.log('💰 Exporting cost models...');
    const costModels = await prisma.costModel.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'cost_models.json'),
      JSON.stringify(costModels, null, 2)
    );
    console.log(`   ✅ ${costModels.length} cost models exported\n`);

    // Export Notifications
    console.log('🔔 Exporting notifications...');
    const notifications = await prisma.notification.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'notifications.json'),
      JSON.stringify(notifications, null, 2)
    );
    console.log(`   ✅ ${notifications.length} notifications exported\n`);

    // Export Events (may be large)
    console.log('📝 Exporting events...');
    const events = await prisma.event.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'events.json'),
      JSON.stringify(events, null, 2)
    );
    console.log(`   ✅ ${events.length} events exported\n`);

    // Export Bids
    console.log('💵 Exporting bids...');
    const bids = await prisma.bid.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'bids.json'),
      JSON.stringify(bids, null, 2)
    );
    console.log(`   ✅ ${bids.length} bids exported\n`);

    // Export Invoices
    console.log('🧾 Exporting invoices...');
    const invoices = await prisma.invoice.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'invoices.json'),
      JSON.stringify(invoices, null, 2)
    );
    console.log(`   ✅ ${invoices.length} invoices exported\n`);

    // Create summary
    const summary = {
      exportedAt: new Date().toISOString(),
      sourceDatabase: 'SQLite (dev.db)',
      targetDatabase: 'PostgreSQL (Railway)',
      tables: {
        users: users.length,
        properties: properties.length,
        deals: deals.length,
        vendors: vendors.length,
        policies: policies.length,
        costModels: costModels.length,
        notifications: notifications.length,
        events: events.length,
        bids: bids.length,
        invoices: invoices.length
      },
      totalRecords: users.length + properties.length + deals.length + vendors.length +
                    policies.length + costModels.length + notifications.length +
                    events.length + bids.length + invoices.length
    };

    fs.writeFileSync(
      path.join(exportDir, 'EXPORT_SUMMARY.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Export Complete!\n');
    console.log(`📊 Total records exported: ${summary.totalRecords}`);
    console.log(`📁 Location: ${exportDir}\n`);
    console.log('📋 Summary:');
    Object.entries(summary.tables).forEach(([table, count]) => {
      console.log(`   ${table}: ${count}`);
    });
    console.log('\n🔒 IMPORTANT NOTES:');
    console.log('   • This export contains ONLY FlipOps application data');
    console.log('   • n8n workflows are stored in n8n\'s own database on Railway');
    console.log('   • n8n data will NOT be affected by this migration');
    console.log('   • Your n8n instance will continue working normally\n');

    console.log('🚀 Next Steps:');
    console.log('   1. Set up Railway PostgreSQL database');
    console.log('   2. Get DATABASE_URL connection string');
    console.log('   3. Update Prisma schema to use PostgreSQL');
    console.log('   4. Push schema to PostgreSQL');
    console.log('   5. Import this data into PostgreSQL\n');

    return exportDir;
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

exportAllData().catch(console.error);
