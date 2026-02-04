/**
 * Refresh Platform Vendors from Google Places
 *
 * This script updates existing PlatformVendor records with fresh data
 * from Google Places API. Run periodically (e.g., weekly cron job) to
 * keep vendor data current.
 *
 * Usage:
 *   npx tsx scripts/refresh-platform-vendors.ts [options]
 *
 * Options:
 *   --market-id  Refresh vendors in a specific market
 *   --stale-days Only refresh vendors older than N days (default: 30)
 *   --limit      Maximum vendors to refresh per run (default: 100)
 *   --dry-run    Preview without updating records
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from '@/lib/prisma';
import { getPlaceDetails, convertPlaceToVendor } from '@/lib/vendors/google-places';
import { VendorStatus } from '@prisma/client';

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

async function main() {
  const args = parseArgs();

  const marketId = args['market-id'];
  const staleDays = parseInt(args['stale-days'] || '30', 10);
  const limit = parseInt(args.limit || '100', 10);
  const dryRun = args['dry-run'] === 'true';

  console.log(`\n🔄 Refreshing Platform Vendors\n`);
  console.log(`   Stale threshold: ${staleDays} days`);
  console.log(`   Limit: ${limit} vendors`);
  console.log(`   Dry Run: ${dryRun}\n`);

  // Calculate stale date
  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - staleDays);

  // Build query
  const where: any = {
    deletedAt: null,
    googlePlaceId: { not: null },
    OR: [
      { lastRefreshedAt: null },
      { lastRefreshedAt: { lt: staleDate } },
    ],
  };

  if (marketId) {
    where.marketId = marketId;
    console.log(`   Market ID: ${marketId}\n`);
  }

  // Get stale vendors
  const staleVendors = await prisma.platformVendor.findMany({
    where,
    orderBy: [
      { lastRefreshedAt: 'asc' },
      { refreshFailCount: 'asc' },
    ],
    take: limit,
    include: {
      market: {
        select: { name: true },
      },
    },
  });

  console.log(`📋 Found ${staleVendors.length} vendors to refresh\n`);

  if (staleVendors.length === 0) {
    console.log('✅ All vendors are up to date!\n');
    return;
  }

  let updated = 0;
  let failed = 0;
  let closed = 0;

  for (const vendor of staleVendors) {
    console.log(`\n🔍 Refreshing: ${vendor.name} (${vendor.market.name})`);

    if (!vendor.googlePlaceId) {
      console.log('   ⚠️  No Google Place ID, skipping');
      continue;
    }

    try {
      const details = await getPlaceDetails(vendor.googlePlaceId);

      if (!details) {
        // Place not found - might be closed
        console.log('   ⚠️  Place not found in Google - marking as unverified');

        if (!dryRun) {
          await prisma.platformVendor.update({
            where: { id: vendor.id },
            data: {
              status: VendorStatus.UNVERIFIED,
              refreshFailCount: vendor.refreshFailCount + 1,
              lastRefreshedAt: new Date(),
            },
          });
        }

        failed++;
        continue;
      }

      // Convert to vendor data
      const freshData = convertPlaceToVendor(details, vendor.categories[0]);

      // Check if business is closed
      if (freshData.status === VendorStatus.CLOSED) {
        console.log('   🚫 Business is permanently closed');
        closed++;

        if (!dryRun) {
          await prisma.platformVendor.update({
            where: { id: vendor.id },
            data: {
              status: VendorStatus.CLOSED,
              lastRefreshedAt: new Date(),
              refreshFailCount: 0,
            },
          });
        }

        continue;
      }

      // Update vendor with fresh data
      const updates: any = {
        sourceRating: freshData.sourceRating,
        sourceReviewCount: freshData.sourceReviewCount,
        phone: freshData.phone || vendor.phone,
        website: freshData.website || vendor.website,
        status: freshData.status,
        lastRefreshedAt: new Date(),
        refreshFailCount: 0,
      };

      // Log changes
      if (freshData.sourceRating !== vendor.sourceRating) {
        console.log(`   📊 Rating: ${vendor.sourceRating?.toFixed(1) || 'N/A'} → ${freshData.sourceRating?.toFixed(1) || 'N/A'}`);
      }
      if (freshData.sourceReviewCount !== vendor.sourceReviewCount) {
        console.log(`   📝 Reviews: ${vendor.sourceReviewCount || 0} → ${freshData.sourceReviewCount || 0}`);
      }

      if (dryRun) {
        console.log('   [DRY RUN] Would update');
      } else {
        await prisma.platformVendor.update({
          where: { id: vendor.id },
          data: updates,
        });
        console.log('   ✅ Updated');
      }

      updated++;

      // Rate limit: wait between API calls
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);

      if (!dryRun) {
        await prisma.platformVendor.update({
          where: { id: vendor.id },
          data: {
            refreshFailCount: vendor.refreshFailCount + 1,
          },
        });
      }

      failed++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Refresh Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Closed: ${closed}`);
  console.log(`${'='.repeat(50)}\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
