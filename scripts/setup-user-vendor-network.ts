/**
 * Setup User Vendor Network
 *
 * Admin script to link platform vendors to a user's account.
 * Selects top-rated vendors (up to N per category) from a market.
 *
 * Usage:
 *   npx tsx scripts/setup-user-vendor-network.ts --user-email="user@example.com" --market="Jacksonville, FL"
 *
 * Options:
 *   --user-email   User's email address (required)
 *   --market       Market name e.g. "Jacksonville, FL" (required)
 *   --per-category Max vendors per category (default: 3)
 *   --dry-run      Preview without creating records
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from '@/lib/prisma';
import { VendorCategory } from '@prisma/client';

// Parse command line arguments
function parseArgs() {
  const args: Record<string, string> = {};

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      args[key] = value || 'true';
    }
  }

  return args;
}

// Primary categories to set up
const PRIMARY_CATEGORIES: VendorCategory[] = [
  'GENERAL_CONTRACTOR',
  'ROOFER',
  'PLUMBER',
  'ELECTRICIAN',
  'HVAC',
  'FLOORING',
  'PAINTER',
  'LANDSCAPER',
];

async function main() {
  const args = parseArgs();

  const userEmail = args['user-email'];
  const marketName = args['market'];
  const perCategory = parseInt(args['per-category'] || '3', 10);
  const dryRun = args['dry-run'] === 'true';

  if (!userEmail || !marketName) {
    console.error('Usage: npx tsx scripts/setup-user-vendor-network.ts --user-email="user@example.com" --market="Jacksonville, FL"');
    process.exit(1);
  }

  console.log(`\n🔧 Setting Up Vendor Network\n`);
  console.log(`   User: ${userEmail}`);
  console.log(`   Market: ${marketName}`);
  console.log(`   Per Category: ${perCategory}`);
  console.log(`   Dry Run: ${dryRun}\n`);

  // Find user
  const user = await prisma.user.findFirst({
    where: { email: userEmail },
  });

  if (!user) {
    console.error(`❌ User not found: ${userEmail}`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.name || user.email} (${user.id})\n`);

  // Find market
  const market = await prisma.market.findFirst({
    where: { name: marketName },
  });

  if (!market) {
    console.error(`❌ Market not found: ${marketName}`);
    console.log('\nAvailable markets:');
    const markets = await prisma.market.findMany({ select: { name: true } });
    markets.forEach(m => console.log(`  - ${m.name}`));
    process.exit(1);
  }

  console.log(`✅ Found market: ${market.name} (${market.id})\n`);

  // Get existing relationships to avoid duplicates
  const existingRelationships = await prisma.userVendorRelationship.findMany({
    where: { userId: user.id },
    select: { platformVendorId: true },
  });
  const existingVendorIds = new Set(existingRelationships.map(r => r.platformVendorId));

  let totalLinked = 0;
  let totalSkipped = 0;

  for (const category of PRIMARY_CATEGORIES) {
    console.log(`\n📦 ${category}:`);

    // Get top-rated vendors for this category (that aren't already linked)
    const vendors = await prisma.platformVendor.findMany({
      where: {
        marketId: market.id,
        categories: { has: category },
        deletedAt: null,
        status: 'ACTIVE',
        id: { notIn: Array.from(existingVendorIds) },
      },
      orderBy: [
        { sourceRating: 'desc' },
        { sourceReviewCount: 'desc' },
      ],
      take: perCategory,
    });

    if (vendors.length === 0) {
      console.log(`   No vendors available`);
      continue;
    }

    for (const vendor of vendors) {
      const rating = vendor.sourceRating?.toFixed(1) || 'N/A';
      const reviews = vendor.sourceReviewCount || 0;

      if (dryRun) {
        console.log(`   [DRY RUN] Would link: ${vendor.name} (${rating}★, ${reviews} reviews)`);
      } else {
        await prisma.userVendorRelationship.create({
          data: {
            userId: user.id,
            platformVendorId: vendor.id,
            isFavorite: false,
            isPreferred: false,
          },
        });
        console.log(`   ✅ Linked: ${vendor.name} (${rating}★, ${reviews} reviews)`);
        existingVendorIds.add(vendor.id);
      }

      totalLinked++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Summary:`);
  console.log(`   Vendors linked: ${totalLinked}`);
  console.log(`   Already linked: ${totalSkipped}`);
  console.log(`${'='.repeat(50)}\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
