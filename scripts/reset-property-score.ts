import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetScore() {
  const property = await prisma.property.update({
    where: {
      address_city_state_zip: {
        address: '123 Main St',
        city: 'Miami',
        state: 'FL',
        zip: '33101'
      }
    },
    data: {
      score: null,
      scoredAt: null,
      scoreBreakdown: null
    }
  });

  console.log(`✅ Reset score for property: ${property.address}, ${property.city}, ${property.state}`);
  console.log(`   Foreclosure: ${property.foreclosure}, Tax Delinquent: ${property.taxDelinquent}`);
  console.log(`   Property is now unscored and ready for the scoring workflow!`);

  await prisma.$disconnect();
}

resetScore();
