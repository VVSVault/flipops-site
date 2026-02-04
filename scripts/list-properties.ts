/**
 * List properties for a specific user
 * Usage: npx tsx scripts/list-properties.ts [userId]
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = process.argv[2] || 'cmite33vr0000mfpce5s3nj0v';

  console.log(`\n🏠 Fetching properties for user: ${userId}\n`);

  try {
    const properties = await prisma.property.findMany({
      where: { userId },
      select: {
        id: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        estimatedValue: true,
        dataSource: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    if (properties.length === 0) {
      console.log('❌ No properties found for this user.');
      return;
    }

    console.log(`Found ${properties.length} properties:\n`);
    console.log('='.repeat(80));

    properties.forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.address}`);
      console.log(`   ${p.city}, ${p.state} ${p.zip}`);
      console.log(`   Value: $${p.estimatedValue?.toLocaleString() || 'N/A'} | Source: ${p.dataSource}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Total: ${properties.length} properties`);

  } catch (error) {
    console.error('❌ Error fetching properties:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
