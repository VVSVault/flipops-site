import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserId } from '@/lib/auth-helpers';
import { sendEmail, createDraft } from '@/lib/nylas';

/**
 * Helper to get user's Nylas grant ID
 */
async function getUserGrantId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { investorProfile: true },
  });

  if (!user?.investorProfile) return null;

  try {
    const profile = JSON.parse(user.investorProfile);
    return profile.nylasGrantId || null;
  } catch {
    return null;
  }
}

/**
 * POST /api/email/send
 * Send an email via Nylas
 *
 * Body:
 * - to: array of {email, name?}
 * - subject: string
 * - body: string (HTML)
 * - cc?: array of {email, name?}
 * - bcc?: array of {email, name?}
 * - replyToMessageId?: string (for replies)
 * - draft?: boolean (save as draft instead of sending)
 * - attachments?: array of {filename, contentType, content (base64)}
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Validate required fields
    if (!body.to || !Array.isArray(body.to) || body.to.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: to (array of recipients)' },
        { status: 400 }
      );
    }

    if (!body.subject) {
      return NextResponse.json(
        { error: 'Missing required field: subject' },
        { status: 400 }
      );
    }

    if (!body.body) {
      return NextResponse.json(
        { error: 'Missing required field: body' },
        { status: 400 }
      );
    }

    // If draft mode, create draft instead of sending
    if (body.draft) {
      const result = await createDraft(grantId, {
        to: body.to,
        subject: body.subject,
        body: body.body,
        cc: body.cc,
        bcc: body.bcc,
        replyToMessageId: body.replyToMessageId,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Draft created successfully',
        draft: result.draft,
      });
    }

    // Send email
    const result = await sendEmail({
      grantId,
      to: body.to,
      subject: body.subject,
      body: body.body,
      cc: body.cc,
      bcc: body.bcc,
      replyToMessageId: body.replyToMessageId,
      attachments: body.attachments,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      sentMessage: result.message,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
