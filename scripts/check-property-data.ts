/**
 * Check raw property data in database
 * Usage: npx tsx scripts/check-property-data.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const props = await prisma.property.findMany({
    where: { userId: 'cmite33vr0000mfpce5s3nj0v' },
    take: 3
  });

  console.log('RAW DATABASE DATA:\n');
  props.forEach((p, i) => {
    console.log(`\n--- Property ${i+1}: ${p.address} ---`);
    console.log('ownerName:', p.ownerName);
    console.log('bedrooms:', p.bedrooms);
    console.log('bathrooms:', p.bathrooms);
    console.log('squareFeet:', p.squareFeet);
    console.log('yearBuilt:', p.yearBuilt);
    console.log('estimatedValue:', p.estimatedValue);
    console.log('assessedValue:', p.assessedValue);
    console.log('lastSalePrice:', p.lastSalePrice);
    console.log('lastSaleDate:', p.lastSaleDate);
    console.log('score:', p.score);
    console.log('metadata:', JSON.stringify(p.metadata, null, 2));
  });

  await prisma.$disconnect();
}
main();
