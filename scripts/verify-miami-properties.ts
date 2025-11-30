import { prisma } from '@/lib/prisma';

async function verifyMiamiProperties() {
  console.log('🔍 Verifying Miami Investor Properties...\n');

  const properties = await prisma.property.findMany({
    where: { userId: 'test-investor-miami' },
    select: {
      address: true,
      city: true,
      state: true,
      zip: true,
      bedrooms: true,
      bathrooms: true,
      lastSalePrice: true,
      lastSaleDate: true,
      sourceId: true,
      metadata: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`✅ Found ${properties.length} properties for test-investor-miami\n`);

  console.log('Recent Properties:');
  console.log('='.repeat(80));
  properties.slice(0, 5).forEach((p, i) => {
    console.log(`${i + 1}. ${p.address}, ${p.city}, ${p.state} ${p.zip}`);
    console.log(`   Beds: ${p.bedrooms || 'N/A'} | Baths: ${p.bathrooms || 'N/A'}`);
    console.log(`   Last Sale: ${p.lastSaleDate || 'N/A'} - $${p.lastSalePrice?.toLocaleString() || 'N/A'}`);
    console.log(`   Source ID: ${p.sourceId}`);
    console.log(`   Metadata: ${p.metadata ? 'Present' : 'None'}`);
    if (p.metadata) {
      const meta = JSON.parse(p.metadata);
      console.log(`   FIPS: ${meta.fips}, GeoID: ${meta.geoid?.substring(0, 30)}...`);
    }
    console.log('');
  });

  await prisma.$disconnect();
}

verifyMiamiProperties();
