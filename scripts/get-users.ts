/**
 * Quick script to list all users in the database
 * Usage: npx tsx scripts/get-users.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Fetching users from database...\n');

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        clerkId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    if (users.length === 0) {
      console.log('❌ No users found in database.');
      console.log('   You need to sign in to the app first: http://localhost:3007/sign-in');
      return;
    }

    console.log(`Found ${users.length} user(s):\n`);
    console.log('='.repeat(80));

    users.forEach((user, i) => {
      console.log(`\nUser ${i + 1}:`);
      console.log(`  ID:       ${user.id}`);
      console.log(`  Email:    ${user.email || 'N/A'}`);
      console.log(`  Name:     ${user.name || 'N/A'}`);
      console.log(`  Clerk ID: ${user.clerkId || 'N/A'}`);
      console.log(`  Created:  ${user.createdAt?.toISOString() || 'N/A'}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Copy the ID of the user you want to use for testing.');
    console.log('   Then run: npx tsx scripts/test-attom-ingest.ts <USER_ID>');

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
