import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create 2 test investor accounts for beta testing
 *
 * Investor A: Miami-focused, experienced investor
 * Investor B: Multi-market, new investor
 */
async function seedTestInvestors() {
  console.log('🌱 Seeding test investor accounts...\n');

  try {
    // Investor A: Miami Investor (Experienced)
    const investorA = await prisma.user.upsert({
      where: { email: 'investor-miami@test.flipops.com' },
      update: {},
      create: {
        id: 'test-investor-miami',
        email: 'investor-miami@test.flipops.com',
        name: 'Miami Test Investor',
        companyName: 'South Florida Flips LLC',

        // Investment preferences
        targetMarkets: JSON.stringify(['Miami-Dade, FL', 'Broward, FL']),
        propertyTypes: JSON.stringify(['single_family', 'multi_family']),
        minScore: 75, // Higher threshold (experienced investor)
        maxBudget: 500000,

        // Notification preferences
        slackWebhook: 'https://hooks.slack.com/services/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', // Your test webhook
        emailAlerts: true,
        dailyDigest: true,
        digestTime: '08:00',
        timezone: 'America/New_York',

        // Subscription
        tier: 'pro',
        subscriptionStatus: 'active',
        monthlyDeals: 0,

        // Platform
        onboarded: true,
        onboardedAt: new Date(),
      }
    });

    console.log('✅ Created Investor A (Miami):');
    console.log(`   ID: ${investorA.id}`);
    console.log(`   Email: ${investorA.email}`);
    console.log(`   Markets: Miami-Dade, Broward`);
    console.log(`   Min Score: ${investorA.minScore}`);
    console.log('');

    // Investor B: Arizona Investor (New to Platform)
    const investorB = await prisma.user.upsert({
      where: { email: 'investor-arizona@test.flipops.com' },
      update: {},
      create: {
        id: 'test-investor-arizona',
        email: 'investor-arizona@test.flipops.com',
        name: 'Arizona Test Investor',
        companyName: 'Desert Investments Inc',

        // Investment preferences
        targetMarkets: JSON.stringify(['Maricopa, AZ', 'Pima, AZ']),
        propertyTypes: JSON.stringify(['single_family']),
        minScore: 70, // Standard threshold (new investor)
        maxBudget: 300000,

        // Notification preferences
        slackWebhook: 'https://hooks.slack.com/services/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', // Your test webhook
        emailAlerts: true,
        dailyDigest: true,
        digestTime: '07:00', // Arizona time (different from Miami)
        timezone: 'America/Phoenix',

        // Subscription
        tier: 'pro',
        subscriptionStatus: 'active',
        monthlyDeals: 0,

        // Platform
        onboarded: true,
        onboardedAt: new Date(),
      }
    });

    console.log('✅ Created Investor B (Arizona):');
    console.log(`   ID: ${investorB.id}`);
    console.log(`   Email: ${investorB.email}`);
    console.log(`   Markets: Maricopa, Pima`);
    console.log(`   Min Score: ${investorB.minScore}`);
    console.log('');

    // Create user-specific policies for each investor
    console.log('📋 Creating user-specific policies...\n');

    // Miami Investor Policy
    const policyMiami = await prisma.policy.upsert({
      where: {
        userId_region_grade: {
          userId: investorA.id,
          region: 'Miami-Dade',
          grade: 'Standard'
        }
      },
      update: {},
      create: {
        userId: investorA.id,
        region: 'Miami-Dade',
        grade: 'Standard',
        maxExposureUsd: 500000, // Matches their maxBudget
        targetRoiPct: 0.25, // 25% target ROI
        contingencyTargetPct: 0.15, // 15% contingency
        varianceTier1Pct: 0.03, // 3% yellow flag
        varianceTier2Pct: 0.07, // 7% red flag
        bidSpreadMaxPct: 0.15, // 15% max bid spread
        coSlaHours: 48, // 48-hour change order response
      }
    });

    console.log('✅ Created Policy for Miami Investor:');
    console.log(`   Max Exposure: $${policyMiami.maxExposureUsd.toLocaleString()}`);
    console.log(`   Target ROI: ${(policyMiami.targetRoiPct * 100).toFixed(0)}%`);
    console.log('');

    // Arizona Investor Policy
    const policyArizona = await prisma.policy.upsert({
      where: {
        userId_region_grade: {
          userId: investorB.id,
          region: 'Maricopa',
          grade: 'Standard'
        }
      },
      update: {},
      create: {
        userId: investorB.id,
        region: 'Maricopa',
        grade: 'Standard',
        maxExposureUsd: 300000, // Matches their maxBudget
        targetRoiPct: 0.20, // 20% target ROI (less aggressive)
        contingencyTargetPct: 0.20, // 20% contingency (more conservative)
        varianceTier1Pct: 0.03,
        varianceTier2Pct: 0.07,
        bidSpreadMaxPct: 0.15,
        coSlaHours: 48,
      }
    });

    console.log('✅ Created Policy for Arizona Investor:');
    console.log(`   Max Exposure: $${policyArizona.maxExposureUsd.toLocaleString()}`);
    console.log(`   Target ROI: ${(policyArizona.targetRoiPct * 100).toFixed(0)}%`);
    console.log('');

    console.log('═'.repeat(70));
    console.log('✅ Test investors seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • 2 investor accounts created`);
    console.log(`   • 2 user-specific policies created`);
    console.log(`   • Ready for ATTOM property discovery`);
    console.log('');
    console.log('🔑 Test Login Credentials:');
    console.log(`   Miami:   investor-miami@test.flipops.com`);
    console.log(`   Arizona: investor-arizona@test.flipops.com`);
    console.log('═'.repeat(70));

  } catch (error) {
    console.error('❌ Error seeding test investors:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTestInvestors();
