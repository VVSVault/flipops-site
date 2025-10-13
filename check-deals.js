const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deals = await prisma.dealSpec.findMany({
    select: { id: true, address: true }
  });
  console.log('Existing deals:');
  deals.forEach(d => console.log(`  ${d.id} - ${d.address}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());