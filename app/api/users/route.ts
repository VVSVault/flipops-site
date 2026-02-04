import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ endpoint: '/api/users' });

/**
 * GET /api/users
 *
 * Fetch all users (for workflow automation)
 * Requires API key authentication
 */
export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const reqLog = log.child({ requestId });

  try {
    // API key authentication
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
    const expectedKey = process.env.FO_API_KEY || process.env.FLIPOPS_API_KEY;

    if (!expectedKey || apiKey !== expectedKey) {
      reqLog.warn({ apiKey: apiKey ? '[redacted]' : 'none' }, 'Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // e.g., "active"

    // Build filter
    const where: any = {};
    if (status === 'active') {
      where.subscriptionStatus = 'active';
    }

    // Fetch all users with relevant fields
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        targetMarkets: true,
        propertyTypes: true,
        minScore: true,
        maxBudget: true,
        investorProfile: true,
        slackWebhook: true,
        emailAlerts: true,
        dailyDigest: true,
        digestTime: true,
        timezone: true,
        tier: true,
        subscriptionStatus: true,
        onboarded: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    reqLog.info({ count: users.length }, 'Users fetched');

    return NextResponse.json({
      success: true,
      count: users.length,
      users,
      requestId
    }, { status: 200 });

  } catch (error) {
    reqLog.error({ error }, 'Failed to fetch users');

    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      requestId
    }, { status: 500 });
  }
  // NOTE: Do not call prisma.$disconnect() - uses shared singleton
}
