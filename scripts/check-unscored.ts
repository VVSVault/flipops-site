import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const properties = await prisma.property.findMany({
    where: { score: null }
  });

  console.log(`Unscored properties: ${properties.length}`);

  if (properties.length > 0) {
    console.log('\nFirst property:');
    console.log(`  ID: ${properties[0].id}`);
    console.log(`  Address: ${properties[0].address}`);
    console.log(`  Foreclosure: ${properties[0].foreclosure}`);
    console.log(`  Tax Delinquent: ${properties[0].taxDelinquent}`);
  }

  await prisma.$disconnect();
}

check();
