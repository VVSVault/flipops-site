/**
 * Update Existing Users with targetZipCodes in investorProfile
 *
 * This script updates test users to include targetZipCodes in their investorProfile
 * so they work with the production-ready ATTOM Property Discovery workflow.
 *
 * Usage:
 *   npx tsx scripts/update-users-with-target-zips.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ZIP code mapping for known markets
const MARKET_TO_ZIPS: Record<string, string[]> = {
  'Duval County, FL': ['32202', '32204', '32205', '32206', '32207', '32208', '32209', '32210', '32211', '32216', '32217', '32218', '32219', '32220', '32221'],
  'Orange County, FL': ['32801', '32803', '32804', '32805', '32806', '32807', '32808', '32809', '32810', '32811', '32812', '32814', '32818', '32819', '32822'],
  'Hillsborough County, FL': ['33602', '33603', '33604', '33605', '33606', '33607', '33609', '33610', '33611', '33612', '33613', '33614', '33615', '33616', '33617'],
  'Miami-Dade County, FL': ['33125', '33126', '33127', '33128', '33129', '33130', '33131', '33132', '33133', '33134', '33135', '33136', '33137', '33138', '33139', '33141'],
  'Maricopa County, AZ': ['85003', '85004', '85006', '85007', '85008', '85009', '85012', '85013', '85014', '85015', '85016', '85017', '85018', '85019', '85020']
};

async function main() {
  console.log('🔄 Updating users with targetZipCodes...\n');

  try {
    // Fetch all users
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: 'system-default-user' // Exclude system user
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        targetMarkets: true,
        investorProfile: true
      }
    });

    console.log(`Found ${users.length} users to process\n`);

    let updated = 0;
    let skipped = 0;

    for (const user of users) {
      console.log(`\n📧 Processing: ${user.name || user.email} (${user.id})`);

      // Parse targetMarkets
      let targetMarkets: string[] = [];
      try {
        if (typeof user.targetMarkets === 'string') {
          targetMarkets = JSON.parse(user.targetMarkets);
        } else if (Array.isArray(user.targetMarkets)) {
          targetMarkets = user.targetMarkets;
        }
      } catch (e) {
        console.log(`   ⚠️  Could not parse targetMarkets, skipping`);
        skipped++;
        continue;
      }

      // Parse investorProfile
      let investorProfile: any = {};
      try {
        if (typeof user.investorProfile === 'string') {
          investorProfile = JSON.parse(user.investorProfile);
        } else if (user.investorProfile && typeof user.investorProfile === 'object') {
          investorProfile = user.investorProfile;
        }
      } catch (e) {
        console.log(`   ⚠️  Could not parse investorProfile, skipping`);
        skipped++;
        continue;
      }

      // Check if already has targetZipCodes
      if (investorProfile.targetZipCodes && investorProfile.targetZipCodes.length > 0) {
        console.log(`   ✅ Already has ${investorProfile.targetZipCodes.length} target ZIP codes`);
        skipped++;
        continue;
      }

      // Convert targetMarkets to ZIP codes
      let allZips: string[] = [];
      for (const market of targetMarkets) {
        const zips = MARKET_TO_ZIPS[market] || [];
        if (zips.length > 0) {
          allZips = allZips.concat(zips);
          console.log(`   📍 ${market}: ${zips.length} ZIPs`);
        } else {
          console.log(`   ⚠️  No ZIP mapping for: ${market}`);
        }
      }

      if (allZips.length === 0) {
        console.log(`   ❌ No ZIP codes found for user's markets`);
        skipped++;
        continue;
      }

      // Limit to 20 ZIPs
      const targetZipCodes = allZips.slice(0, 20);

      // Update investorProfile with targetZipCodes
      const updatedProfile = {
        ...investorProfile,
        targetZipCodes
      };

      // Update user in database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          investorProfile: JSON.stringify(updatedProfile)
        }
      });

      console.log(`   ✅ Updated with ${targetZipCodes.length} target ZIP codes`);
      console.log(`   📦 ZIPs: ${targetZipCodes.join(', ')}`);
      updated++;
    }

    console.log('\n\n📊 Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📋 Total: ${users.length}`);

    if (updated > 0) {
      console.log('\n🎉 Users are now ready for ATTOM Property Discovery workflow!');
      console.log('   Next: Run the ATTOM workflow manually to test');
      console.log('   URL: https://primary-production-8b46.up.railway.app/workflow/aIB67joSAh1vT5Sb');
    }

  } catch (error) {
    console.error('❌ Error updating users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
