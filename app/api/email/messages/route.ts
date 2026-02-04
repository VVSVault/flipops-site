import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserId } from '@/lib/auth-helpers';
import { getMessages, getMessagesWithContact, getMessage } from '@/lib/nylas';

/**
 * Helper to get user's Nylas grant ID
 * Falls back to env NYLAS_GRANT_ID for development/single-user setups
 */
async function getUserGrantId(userId: string): Promise<string | null> {
  // First check user profile for per-user grant ID
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { investorProfile: true },
  });

  if (user?.investorProfile) {
    try {
      const profile = JSON.parse(user.investorProfile);
      if (profile.nylasGrantId) {
        return profile.nylasGrantId;
      }
    } catch {
      // Fall through to env fallback
    }
  }

  // Fallback to environment variable (useful for development)
  return process.env.NYLAS_GRANT_ID || null;
}

/**
 * GET /api/email/messages
 * Get email messages for authenticated user
 *
 * Query params:
 * - contact: filter messages with specific contact email
 * - messageId: get a single message
 * - limit: number of messages to return (default 50)
 * - unread: filter by unread status (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUserId();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const userId = authResult.userId!;

    // Get user's Nylas grant ID
    const grantId = await getUserGrantId(userId);

    if (!grantId) {
      return NextResponse.json(
        {
          error: 'Email not connected',
          message: 'Please connect your email account first via /api/email/connect',
        },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const contact = searchParams.get('contact');
    const messageId = searchParams.get('messageId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const unread = searchParams.get('unread');

    // Get single message by ID
    if (messageId) {
      const result = await getMessage(grantId, messageId);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({ message: result.message });
    }

    // Get messages with specific contact (for vendor messaging)
    if (contact) {
      const result = await getMessagesWithContact(grantId, contact, { limit });
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({ messages: result.messages });
    }

    // Get all messages with optional filters
    const result = await getMessages(grantId, {
      limit,
      unread: unread ? unread === 'true' : undefined,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      messages: result.messages,
      nextPageToken: result.nextPageToken,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
