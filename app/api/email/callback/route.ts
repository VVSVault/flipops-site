import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exchangeCodeForGrant } from '@/lib/nylas';

/**
 * GET /api/email/callback
 * OAuth callback from Nylas after user authorizes email access
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Nylas OAuth error:', error);
      return NextResponse.redirect(
        new URL('/app/settings?error=email_connection_failed', request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/app/settings?error=no_auth_code', request.url)
      );
    }

    // Decode state to get userId
    let userId: string | null = null;
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
        userId = decoded.userId;
      } catch {
        console.error('Failed to decode state');
      }
    }

    if (!userId) {
      return NextResponse.redirect(
        new URL('/app/settings?error=invalid_state', request.url)
      );
    }

    // Exchange code for grant
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3007';
    const redirectUri = `${baseUrl}/api/email/callback`;

    const result = await exchangeCodeForGrant(code, redirectUri);

    if (!result.success) {
      console.error('Failed to exchange code:', result.error);
      return NextResponse.redirect(
        new URL('/app/settings?error=token_exchange_failed', request.url)
      );
    }

    // Store the grant ID in user's record
    // We'll add nylasGrantId to the User model or store in a separate table
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Store in metadata or add a new field
        // For now, we'll use the investorProfile JSON field to store it
        investorProfile: JSON.stringify({
          ...(await prisma.user.findUnique({ where: { id: userId }, select: { investorProfile: true } })
            .then(u => u?.investorProfile ? JSON.parse(u.investorProfile) : {})),
          nylasGrantId: result.grantId,
          connectedEmail: result.email,
        }),
      },
    });

    // Redirect to settings with success
    return NextResponse.redirect(
      new URL('/app/settings?success=email_connected', request.url)
    );
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/app/settings?error=callback_failed', request.url)
    );
  }
}
