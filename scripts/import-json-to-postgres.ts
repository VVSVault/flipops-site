/**
 * Import data from JSON export into PostgreSQL database
 * Run this AFTER setting up Railway PostgreSQL and pushing the schema
 *
 * Prerequisites:
 * 1. Railway PostgreSQL database created
 * 2. DATABASE_URL set in .env.local
 * 3. Schema pushed to PostgreSQL: npx prisma db push
 *
 * Usage:
 * npx tsx scripts/import-json-to-postgres.ts backups/sqlite-export-2025-11-20T04-27-17-772Z
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function importAllData(exportDir: string) {
  console.log('📥 Importing data into PostgreSQL...\n');
  console.log(`📁 Source: ${exportDir}\n`);

  // Verify export directory exists
  if (!fs.existsSync(exportDir)) {
    throw new Error(`Export directory not found: ${exportDir}`);
  }

  // Load summary to verify data
  const summaryPath = path.join(exportDir, 'EXPORT_SUMMARY.json');
  if (!fs.existsSync(summaryPath)) {
    throw new Error('EXPORT_SUMMARY.json not found - invalid export directory');
  }

  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
  console.log('📊 Import Summary:');
  console.log(`   Total records to import: ${summary.totalRecords}`);
  console.log(`   Export date: ${summary.exportedAt}\n`);

  try {
    // Import in order to respect foreign key constraints
    // 1. Users first (no dependencies)
    console.log('👥 Importing users...');
    const usersData = JSON.parse(fs.readFileSync(path.join(exportDir, 'users.json'), 'utf-8'));
    for (const user of usersData) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      });
    }
    console.log(`   ✅ ${usersData.length} users imported\n`);

    // 2. Vendors (depends on User - optional FK)
    console.log('🔧 Importing vendors...');
    const vendorsData = JSON.parse(fs.readFileSync(path.join(exportDir, 'vendors.json'), 'utf-8'));
    for (const vendor of vendorsData) {
      await prisma.vendor.upsert({
        where: { id: vendor.id },
        update: vendor,
        create: vendor
      });
    }
    console.log(`   ✅ ${vendorsData.length} vendors imported\n`);

    // 3. Policies (depends on User - optional FK)
    console.log('📜 Importing policies...');
    const policiesData = JSON.parse(fs.readFileSync(path.join(exportDir, 'policies.json'), 'utf-8'));
    for (const policy of policiesData) {
      await prisma.policy.upsert({
        where: { id: policy.id },
        update: policy,
        create: policy
      });
    }
    console.log(`   ✅ ${policiesData.length} policies imported\n`);

    // 4. Properties (depends on User)
    console.log('🏠 Importing properties...');
    const propertiesData = JSON.parse(fs.readFileSync(path.join(exportDir, 'properties.json'), 'utf-8'));
    for (const property of propertiesData) {
      await prisma.property.upsert({
        where: { id: property.id },
        update: property,
        create: property
      });
    }
    console.log(`   ✅ ${propertiesData.length} properties imported\n`);

    // 5. DealSpecs (depends on User)
    console.log('📋 Importing deals...');
    const dealsData = JSON.parse(fs.readFileSync(path.join(exportDir, 'deals.json'), 'utf-8'));
    for (const deal of dealsData) {
      await prisma.dealSpec.upsert({
        where: { id: deal.id },
        update: deal,
        create: deal
      });
    }
    console.log(`   ✅ ${dealsData.length} deals imported\n`);

    // 6. Bids (depends on DealSpec and Vendor)
    console.log('💵 Importing bids...');
    const bidsData = JSON.parse(fs.readFileSync(path.join(exportDir, 'bids.json'), 'utf-8'));
    for (const bid of bidsData) {
      await prisma.bid.upsert({
        where: { id: bid.id },
        update: bid,
        create: bid
      });
    }
    console.log(`   ✅ ${bidsData.length} bids imported\n`);

    // 7. Invoices (depends on Vendor)
    console.log('🧾 Importing invoices...');
    const invoicesData = JSON.parse(fs.readFileSync(path.join(exportDir, 'invoices.json'), 'utf-8'));
    for (const invoice of invoicesData) {
      await prisma.invoice.upsert({
        where: { id: invoice.id },
        update: invoice,
        create: invoice
      });
    }
    console.log(`   ✅ ${invoicesData.length} invoices imported\n`);

    // 8. Events (depends on DealSpec - optional FK)
    console.log('📝 Importing events...');
    const eventsData = JSON.parse(fs.readFileSync(path.join(exportDir, 'events.json'), 'utf-8'));
    for (const event of eventsData) {
      await prisma.event.upsert({
        where: { id: event.id },
        update: event,
        create: event
      });
    }
    console.log(`   ✅ ${eventsData.length} events imported\n`);

    // 9. Notifications (no FK constraints)
    console.log('🔔 Importing notifications...');
    const notificationsData = JSON.parse(fs.readFileSync(path.join(exportDir, 'notifications.json'), 'utf-8'));
    for (const notification of notificationsData) {
      await prisma.notification.upsert({
        where: { id: notification.id },
        update: notification,
        create: notification
      });
    }
    console.log(`   ✅ ${notificationsData.length} notifications imported\n`);

    // 10. Cost Models (no FK constraints)
    console.log('💰 Importing cost models...');
    const costModelsData = JSON.parse(fs.readFileSync(path.join(exportDir, 'cost_models.json'), 'utf-8'));
    for (const costModel of costModelsData) {
      await prisma.costModel.upsert({
        where: { id: costModel.id },
        update: costModel,
        create: costModel
      });
    }
    console.log(`   ✅ ${costModelsData.length} cost models imported\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Import Complete!\n');

    // Verify import
    const verifyUsers = await prisma.user.count();
    const verifyProperties = await prisma.property.count();
    const verifyDeals = await prisma.dealSpec.count();

    console.log('📊 Verification:');
    console.log(`   Users in PostgreSQL: ${verifyUsers} (expected: ${usersData.length})`);
    console.log(`   Properties in PostgreSQL: ${verifyProperties} (expected: ${propertiesData.length})`);
    console.log(`   Deals in PostgreSQL: ${verifyDeals} (expected: ${dealsData.length})\n`);

    if (verifyUsers === usersData.length &&
        verifyProperties === propertiesData.length &&
        verifyDeals === dealsData.length) {
      console.log('✅ All data verified successfully!\n');
      console.log('🚀 Next Steps:');
      console.log('   1. Update Jacksonville investor profile');
      console.log('   2. Restart dev server to use PostgreSQL');
      console.log('   3. Test n8n workflow with new database\n');
    } else {
      console.log('⚠️  Data counts don\'t match - please verify manually\n');
    }

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get export directory from command line argument
const exportDir = process.argv[2];

if (!exportDir) {
  console.error('❌ Usage: npx tsx scripts/import-json-to-postgres.ts <export-directory>');
  console.error('   Example: npx tsx scripts/import-json-to-postgres.ts backups/sqlite-export-2025-11-20T04-27-17-772Z\n');
  process.exit(1);
}

importAllData(exportDir).catch(console.error);
