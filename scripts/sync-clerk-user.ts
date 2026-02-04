/**
 * Manually sync an existing Clerk user to the Prisma database
 * Usage: npx tsx scripts/sync-clerk-user.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Your Clerk user data (from the webhook payload)
const CLERK_USER = {
  clerkId: 'user_36FBlivCr3k9oBhQv4FB8YgF9rF',
  email: 'tannercarlson@vvsvault.com',
  firstName: 'Tanner',
  lastName: 'Carlson',
};

async function main() {
  console.log('🔄 Syncing Clerk user to database...\n');

  const { clerkId, email, firstName, lastName } = CLERK_USER;
  const name = `${firstName} ${lastName}`.trim();

  console.log(`Clerk ID: ${clerkId}`);
  console.log(`Email: ${email}`);
  console.log(`Name: ${name}`);
  console.log('');

  try {
    // Check if user already exists by clerkId or email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { clerkId },
          { email }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.clerkId === clerkId) {
        console.log(`✅ User already exists with matching Clerk ID: ${existingUser.id}`);
        return;
      }

      // Update existing user with clerkId
      const updated = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          clerkId,
          name: name || existingUser.name,
          updatedAt: new Date()
        }
      });

      console.log(`✅ Updated existing user ${updated.id} with Clerk ID`);
      return;
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        clerkId,
        email,
        name,
        targetMarkets: '', // Required field, will be set during onboarding
        onboardingComplete: false,
        tier: 'free',
        emailAlerts: true,
        dailyDigest: true,
        digestTime: '08:00',
        timezone: 'America/New_York',
      }
    });

    console.log(`✅ Created new user: ${newUser.id}`);
    console.log(`\nUser details:`);
    console.log(`  ID: ${newUser.id}`);
    console.log(`  Email: ${newUser.email}`);
    console.log(`  Name: ${newUser.name}`);
    console.log(`  Clerk ID: ${newUser.clerkId}`);

  } catch (error) {
    console.error('❌ Error syncing user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
