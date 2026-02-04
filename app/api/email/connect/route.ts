import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth-helpers';
import { getAuthUrl } from '@/lib/nylas';

/**
 * GET /api/email/connect
 * Get OAuth URL to connect user's email account via Nylas
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUserId();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const userId = authResult.userId!;

    // Build redirect URI
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3007';
    const redirectUri = `${baseUrl}/api/email/callback`;

    // Include userId in state for callback
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

    const authUrl = getAuthUrl(redirectUri, state);

    return NextResponse.json({
      authUrl,
      message: 'Redirect user to authUrl to connect their email account',
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication URL' },
      { status: 500 }
    );
  }
}
