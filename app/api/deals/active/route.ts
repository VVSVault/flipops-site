import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ endpoint: '/api/deals/active' });

export async function GET(req: NextRequest) {
  try {
    // Optional API key authentication
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.FO_API_KEY || process.env.FLIPOPS_API_KEY;

    if (expectedApiKey && apiKey && apiKey !== expectedApiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query for deals that need data refresh
    // Active deals are those that:
    // 1. Have been approved (have G1 APPROVE event)
    // 2. Don't have a completion/sale event yet
    // 3. OR are still in pending_approval status (for G1 decision making)

    const approvedDealEvents = await prisma.event.findMany({
      where: {
        artifact: 'DealSpec',
        action: 'APPROVE',
        actor: 'system:G1'
      },
      select: { dealId: true },
      distinct: ['dealId']
    });

    const approvedDealIds = approvedDealEvents.map(e => e.dealId).filter(id => id !== null);

    // Get deals that are either approved or recently created (pending approval)
    const activeDeals = await prisma.dealSpec.findMany({
      where: {
        OR: [
          { id: { in: approvedDealIds } },
          {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Created in last 30 days
            }
          }
        ]
      },
      select: {
        id: true,
        address: true,
        type: true,
        maxExposureUsd: true,
        targetRoiPct: true,
        arv: true,
        region: true,
        grade: true,
        startAt: true,
        dailyBurnUsd: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    log.info({ count: activeDeals.length }, 'Retrieved active deals');

    return NextResponse.json({
      success: true,
      count: activeDeals.length,
      deals: activeDeals,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    log.error({ error }, 'Failed to retrieve active deals');
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
