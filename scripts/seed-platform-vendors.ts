/**
 * Seed Platform Vendors from Google Places
 *
 * This script:
 * 1. Creates a market if it doesn't exist
 * 2. Searches Google Places for vendors in each trade category
 * 3. Creates PlatformVendor records for each result
 *
 * Usage:
 *   npx tsx scripts/seed-platform-vendors.ts --city="Jacksonville" --state="FL"
 *
 * Options:
 *   --city       City name (required)
 *   --state      State code (required)
 *   --radius     Search radius in miles (default: 50)
 *   --categories Comma-separated list of categories (default: all primary)
 *   --dry-run    Preview without creating records
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from '@/lib/prisma';
import {
  searchVendorsByCategory,
  getPrimaryCategories,
  type PlatformVendorInput,
} from '@/lib/vendors/google-places';
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

// Market coordinates for common Florida/Arizona cities
const MARKET_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Jacksonville, FL': { lat: 30.3322, lng: -81.6557 },
  'Orlando, FL': { lat: 28.5383, lng: -81.3792 },
  'Tampa, FL': { lat: 27.9506, lng: -82.4572 },
  'Miami, FL': { lat: 25.7617, lng: -80.1918 },
  'Phoenix, AZ': { lat: 33.4484, lng: -112.0740 },
  'Tucson, AZ': { lat: 32.2226, lng: -110.9747 },
  'Las Vegas, NV': { lat: 36.1699, lng: -115.1398 },
  'Denver, CO': { lat: 39.7392, lng: -104.9903 },
  'Austin, TX': { lat: 30.2672, lng: -97.7431 },
  'Houston, TX': { lat: 29.7604, lng: -95.3698 },
  'Dallas, TX': { lat: 32.7767, lng: -96.7970 },
  'Atlanta, GA': { lat: 33.7490, lng: -84.3880 },
};

async function main() {
  const args = parseArgs();

  const city = args.city;
  const state = args.state?.toUpperCase();
  const radius = parseInt(args.radius || '50', 10);
  const dryRun = args['dry-run'] === 'true';

  if (!city || !state) {
    console.error('Usage: npx tsx scripts/seed-platform-vendors.ts --city="Jacksonville" --state="FL"');
    process.exit(1);
  }

  const marketKey = `${city}, ${state}`;
  const coordinates = MARKET_COORDINATES[marketKey];

  if (!coordinates) {
    console.error(`Unknown market: ${marketKey}`);
    console.log('Available markets:', Object.keys(MARKET_COORDINATES).join(', '));
    console.log('\nAdd coordinates to MARKET_COORDINATES in the script for new markets.');
    process.exit(1);
  }

  console.log(`\n🏙️  Seeding Platform Vendors for ${marketKey}\n`);
  console.log(`   Radius: ${radius} miles`);
  console.log(`   Dry Run: ${dryRun}\n`);

  // Parse categories
  let categories: VendorCategory[];
  if (args.categories) {
    categories = args.categories.split(',').map(c => c.trim().toUpperCase() as VendorCategory);
  } else {
    categories = getPrimaryCategories();
  }

  console.log(`   Categories: ${categories.join(', ')}\n`);

  // Create or find market
  let market = await prisma.market.findFirst({
    where: {
      city,
      state,
      country: 'US',
    },
  });

  if (!market) {
    if (dryRun) {
      console.log(`[DRY RUN] Would create market: ${marketKey}`);
      market = {
        id: 'dry-run-market-id',
        name: marketKey,
        city,
        state,
        country: 'US',
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        radiusMiles: radius,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      market = await prisma.market.create({
        data: {
          name: marketKey,
          city,
          state,
          country: 'US',
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          radiusMiles: radius,
          isActive: true,
        },
      });
      console.log(`✅ Created market: ${market.name} (${market.id})\n`);
    }
  } else {
    console.log(`✅ Found existing market: ${market.name} (${market.id})\n`);
  }

  // Get existing vendors to avoid duplicates
  const existingVendors = await prisma.platformVendor.findMany({
    where: { marketId: market.id },
    select: { googlePlaceId: true },
  });
  const existingPlaceIds = new Set(existingVendors.map(v => v.googlePlaceId).filter(Boolean));

  console.log(`   Existing vendors in market: ${existingVendors.length}\n`);

  // Search and create vendors for each category
  let totalCreated = 0;
  let totalSkipped = 0;

  for (const category of categories) {
    console.log(`\n📦 Searching for ${category}...`);

    try {
      const vendors = await searchVendorsByCategory(
        category,
        { lat: coordinates.lat, lng: coordinates.lng, city, state },
        radius
      );

      console.log(`   Found ${vendors.length} vendors`);

      for (const vendor of vendors) {
        // Skip if already exists
        if (existingPlaceIds.has(vendor.googlePlaceId)) {
          totalSkipped++;
          continue;
        }

        if (dryRun) {
          console.log(`   [DRY RUN] Would create: ${vendor.name}`);
        } else {
          try {
            await prisma.platformVendor.create({
              data: {
                marketId: market.id,
                name: vendor.name,
                description: vendor.description,
                address: vendor.address,
                city: vendor.city,
                state: vendor.state,
                zip: vendor.zip,
                latitude: vendor.latitude,
                longitude: vendor.longitude,
                phone: vendor.phone,
                website: vendor.website,
                categories: vendor.categories,
                source: vendor.source,
                googlePlaceId: vendor.googlePlaceId,
                sourceRating: vendor.sourceRating,
                sourceReviewCount: vendor.sourceReviewCount,
                priceLevel: vendor.priceLevel,
                status: vendor.status,
                lastRefreshedAt: new Date(),
              },
            });

            existingPlaceIds.add(vendor.googlePlaceId);
            totalCreated++;
            console.log(`   ✅ Created: ${vendor.name}`);
          } catch (err: any) {
            if (err.code === 'P2002') {
              // Unique constraint violation - already exists
              totalSkipped++;
            } else {
              console.error(`   ❌ Error creating ${vendor.name}:`, err.message);
            }
          }
        }
      }

      // Rate limit: wait between category searches
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`   ❌ Error searching ${category}:`, error);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Summary for ${marketKey}:`);
  console.log(`   Created: ${totalCreated} vendors`);
  console.log(`   Skipped (duplicates): ${totalSkipped}`);
  console.log(`${'='.repeat(50)}\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
