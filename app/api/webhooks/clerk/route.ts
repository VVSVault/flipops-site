import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Clerk Webhook Handler
 *
 * This endpoint receives webhook events from Clerk when users are created,
 * updated, or deleted. It syncs user data to our Prisma database.
 *
 * Required Clerk Dashboard Setup:
 * 1. Go to Clerk Dashboard → Webhooks
 * 2. Add endpoint: https://your-domain.com/api/webhooks/clerk
 * 3. Subscribe to events: user.created, user.updated, user.deleted
 * 4. Copy the Signing Secret and add to .env.local as CLERK_WEBHOOK_SECRET
 */

// Clerk webhook event types
interface ClerkUserData {
  id: string;
  email_addresses: Array<{
    id: string;
    email_address: string;
    verification: { status: string } | null;
  }>;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  created_at: number;
  updated_at: number;
}

interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserData;
  object: 'event';
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Missing svix headers');
    return NextResponse.json(
      { error: 'Missing webhook headers' },
      { status: 400 }
    );
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: ClerkWebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    );
  }

  // Handle the webhook event
  const eventType = evt.type;
  console.log(`Clerk webhook received: ${eventType}`);

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;

      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;

      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error handling ${eventType}:`, error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

/**
 * Handle user.created event
 * Creates a new user in our database when someone signs up via Clerk
 */
async function handleUserCreated(data: ClerkUserData) {
  const { id: clerkId, email_addresses, first_name, last_name } = data;

  // Get the primary email (first verified one, or just the first one)
  const primaryEmail = email_addresses.find(
    (e) => e.verification?.status === 'verified'
  ) || email_addresses[0];

  if (!primaryEmail) {
    console.error('No email address found for user:', clerkId);
    return;
  }

  const email = primaryEmail.email_address;
  const name = [first_name, last_name].filter(Boolean).join(' ') || null;

  console.log(`Creating user: ${email} (Clerk ID: ${clerkId})`);

  // Check if user already exists (by clerkId or email)
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { clerkId },
        { email }
      ]
    }
  });

  if (existingUser) {
    // Update existing user with clerkId if they don't have one
    if (!existingUser.clerkId) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          clerkId,
          name: name || existingUser.name,
          updatedAt: new Date()
        }
      });
      console.log(`Updated existing user ${existingUser.id} with Clerk ID`);
    } else {
      console.log(`User already exists: ${existingUser.id}`);
    }
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

  console.log(`Created new user: ${newUser.id} (${email})`);
}

/**
 * Handle user.updated event
 * Updates user info when they change their profile in Clerk
 */
async function handleUserUpdated(data: ClerkUserData) {
  const { id: clerkId, email_addresses, first_name, last_name } = data;

  const primaryEmail = email_addresses.find(
    (e) => e.verification?.status === 'verified'
  ) || email_addresses[0];

  const email = primaryEmail?.email_address;
  const name = [first_name, last_name].filter(Boolean).join(' ') || null;

  console.log(`Updating user: Clerk ID ${clerkId}`);

  const user = await prisma.user.findUnique({
    where: { clerkId }
  });

  if (!user) {
    console.log(`User not found for Clerk ID: ${clerkId}, creating...`);
    await handleUserCreated(data);
    return;
  }

  await prisma.user.update({
    where: { clerkId },
    data: {
      email: email || user.email,
      name: name || user.name,
      updatedAt: new Date()
    }
  });

  console.log(`Updated user: ${user.id}`);
}

/**
 * Handle user.deleted event
 * We soft-delete or mark user as inactive rather than hard delete
 * to preserve data integrity and audit trails
 */
async function handleUserDeleted(data: ClerkUserData) {
  const { id: clerkId } = data;

  console.log(`User deleted from Clerk: ${clerkId}`);

  const user = await prisma.user.findUnique({
    where: { clerkId }
  });

  if (!user) {
    console.log(`User not found for Clerk ID: ${clerkId}`);
    return;
  }

  // Option 1: Soft delete - mark as inactive (recommended)
  // You could add an `isActive` or `deletedAt` field to your User model
  // For now, we'll just log it and leave the user in place

  console.log(`User ${user.id} was deleted from Clerk. Consider cleanup.`);

  // Option 2: Hard delete (uncomment if you want this behavior)
  // await prisma.user.delete({ where: { clerkId } });
  // console.log(`Deleted user: ${user.id}`);
}
