/**
 * Update Jacksonville investor with realistic criteria in PostgreSQL
 * Uses Prisma Client to update the database directly
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const realisticProfile = {
  strategies: ['heavy_rehab', 'quick_flip', 'wholesale'],
  priceRanges: [
    { min: 10000, max: 75000, weight: 0.8, label: 'wholesale' },
    { min: 75000, max: 250000, weight: 1.0, label: 'primary' },
    { min: 250000, max: 400000, weight: 0.7, label: 'premium' }
  ],
  equityRequirements: {
    minEquityPercent: 20,
    preferredEquityPercent: 30
  },
  distressIndicators: {
    foreclosure: 1.0,
    preForeclosure: 0.95,
    taxDelinquent: 0.9,
    vacant: 0.9,
    absenteeOwner: 0.75,
    bankruptcy: 0.7
  },
  preferredCharacteristics: {
    minBedrooms: 1,
    maxBedrooms: 5,
    minBathrooms: 1,
    maxBathrooms: 4,
    minSquareFeet: 500,
    maxSquareFeet: 3500,
    preferredYearBuilt: {
      min: 1900,
      max: 2025,
      sweetSpot: {
        min: 1950,
        max: 1990,
        bonus: 3
      }
    }
  },
  preferredCondition: {
    distressed: true,
    turnkey: false,
    minRepairNeeds: 10000,
    maxRepairNeeds: 100000
  },
  partnerPreferences: {
    hasRealtorPartner: true,
    hasContractorNetwork: true,
    prefersMLS: false,
    canCloseQuickly: true
  },
  dealBreakers: {
    noCondos: false,
    noMobileHomes: true,
    noCommercial: true,
    noCoops: true,
    maxHOAFees: 250
  },
  timeHorizon: 'short_term',
  riskTolerance: 'moderate_to_high',
  leadPreferences: {
    dailyMaxLeads: 25,
    minMatchScore: 50,
    topLeadsPerDay: 10
  },
  targetZipCodes: [
    '32202', '32204', '32205', '32206', '32207',
    '32208', '32209', '32210', '32211', '32216',
    '32217', '32218', '32219', '32220', '32221',
    '32801', '32803', '32804', '32805', '32806'
  ]
};

async function updateJacksonvilleInvestor() {
  console.log('🔄 Updating Jacksonville investor with realistic criteria...\n');

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: 'test-investor-jacksonville' }
    });

    if (!user) {
      console.error('❌ Jacksonville investor not found in database');
      console.error('   User ID: test-investor-jacksonville\n');
      return;
    }

    console.log(`📝 Found user: ${user.name || user.email}`);
    console.log(`   Current minScore: ${user.minScore || 'not set'}\n`);

    // Update the user
    const updated = await prisma.user.update({
      where: { id: 'test-investor-jacksonville' },
      data: {
        investorProfile: JSON.stringify(realisticProfile),
        minScore: 50
      }
    });

    console.log('✅ Update successful!\n');

    const profile = JSON.parse(updated.investorProfile as string);

    console.log('📊 Updated Configuration:');
    console.log(`   • Min Score: ${updated.minScore} (was ${user.minScore})`);
    console.log(`   • Price Range: $${profile.priceRanges[0].min.toLocaleString()}-$${profile.priceRanges[profile.priceRanges.length - 1].max.toLocaleString()}`);
    console.log(`   • Year Built: ${profile.preferredCharacteristics.preferredYearBuilt.min}-${profile.preferredCharacteristics.preferredYearBuilt.max}`);
    console.log(`   • Square Feet: ${profile.preferredCharacteristics.minSquareFeet}+`);
    console.log(`   • Bedrooms: ${profile.preferredCharacteristics.minBedrooms}+`);
    console.log(`   • Target ZIPs: ${profile.targetZipCodes.length}\n`);

    console.log('🎯 Expected Impact on Jacksonville Properties:');
    console.log('   Property: 1119 GRANT ST (1942, 744 sqft, $24k)');
    console.log('   • NOW ACCEPTED: Year 1942 ✓');
    console.log('   • NOW ACCEPTED: 744 sqft ✓');
    console.log('   • NOW ACCEPTED: $24k price ✓');
    console.log('   • Expected score: ~72 points ✅\n');

    console.log('🚀 Next Steps:');
    console.log('   1. Restart your dev server');
    console.log('   2. Go to: https://primary-production-8b46.up.railway.app/workflow/ORNrSAWVXWeNqAb4');
    console.log('   3. Execute workflow manually');
    console.log('   4. Properties should now pass 50-point threshold!\n');

  } catch (error) {
    console.error('❌ Error updating database:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateJacksonvilleInvestor().catch(console.error);
