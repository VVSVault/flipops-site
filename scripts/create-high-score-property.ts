import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createHighScoreProperty() {
  try {
    const timestamp = Date.now();
    const address = `${700 + (timestamp % 300)} High Score Ave`;

    const property = await prisma.property.create({
      data: {
        address: address,
        city: 'Miami',
        state: 'FL',
        zip: '33101',
        county: 'Miami-Dade',
        apn: `99-9999-999-${timestamp.toString().slice(-4)}`,
        ownerName: 'High Score Test Owner',
        propertyType: 'single_family',
        bedrooms: 4,
        bathrooms: 3,
        squareFeet: 2500,
        lotSize: 7500,
        yearBuilt: 1990,
        assessedValue: 400000,
        taxAmount: 8000,
        estimatedValue: 450000,

        // Set multiple distress flags for high score
        foreclosure: true,       // 30 points
        preForeclosure: true,    // 25 points
        taxDelinquent: true,     // 20 points
        vacant: true,            // 15 points

        dataSource: 'test',
        sourceId: `high-score-test-${timestamp}`,

        // Calculate and set score
        score: 90,  // 30 + 25 + 20 + 15
        scoreBreakdown: JSON.stringify({
          foreclosure: 30,
          preForeclosure: 25,
          taxDelinquent: 20,
          vacant: 15,
          bankruptcy: 0,
          absenteeOwner: 0
        }),
        scoredAt: new Date(),

        // NOT enriched yet - this is key for skip tracing
        enriched: false,
        phoneNumbers: null,
        emails: null
      },
    });

    console.log('✅ High-score test property created for skip tracing!');
    console.log(`   ID: ${property.id}`);
    console.log(`   Address: ${property.address}, ${property.city}, ${property.state} ${property.zip}`);
    console.log(`   Owner: ${property.ownerName}`);
    console.log(`   Score: ${property.score}/100`);
    console.log(`   Enriched: ${property.enriched} (ready for skip tracing)`);
    console.log(`\n   Distress Flags:`);
    console.log(`   • Foreclosure: ${property.foreclosure}`);
    console.log(`   • Pre-Foreclosure: ${property.preForeclosure}`);
    console.log(`   • Tax Delinquent: ${property.taxDelinquent}`);
    console.log(`   • Vacant: ${property.vacant}`);
    console.log(`\n🚀 Ready to test skip tracing workflow in n8n!`);

  } catch (error) {
    console.error('❌ Failed to create property:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createHighScoreProperty();
