import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ endpoint: '/api/bids/award/status' });

/**
 * Get G2 guardrail violations - bids where spread exceeds threshold
 * This endpoint monitors for bid awards that were blocked due to excessive spread
 */
export async function GET(req: NextRequest) {
  try {
    // API key authentication (required)
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
    const expectedApiKey = process.env.FO_API_KEY || process.env.FLIPOPS_API_KEY;

    // SECURITY: Check BOTH that expectedKey exists AND matches
    if (!expectedApiKey || apiKey !== expectedApiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all BLOCK events from G2 in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const blockEvents = await prisma.event.findMany({
      where: {
        actor: 'system:G2',
        action: 'BLOCK',
        artifact: 'Bid',
        ts: {
          gte: sevenDaysAgo
        }
      },
      orderBy: { ts: 'desc' },
      take: 50
    });

    // Get unique deal IDs from blocked events
    const blockedDealIds = [...new Set(blockEvents.map(e => e.dealId).filter(id => id !== null))];

    // Fetch deal details for blocked bids
    const deals = await prisma.dealSpec.findMany({
      where: {
        id: { in: blockedDealIds }
      },
      select: {
        id: true,
        address: true,
        createdAt: true
      }
    });

    // Create a map of deals for easy lookup
    const dealMap = new Map(deals.map(d => [d.id, d]));

    // Build detailed blocked bid list with event metadata
    const blockedBids = blockEvents.map(event => {
      const deal = dealMap.get(event.dealId || '');
      const metadata = event.diff ? JSON.parse(event.diff as string) : {};

      return {
        dealId: event.dealId,
        address: deal?.address || 'Unknown',
        blockedAt: event.ts,
        trade: metadata.trade,
        task: metadata.task,
        reason: metadata.reason || 'Bid spread exceeds threshold',
        stats: {
          min: metadata.stats?.min,
          median: metadata.stats?.median,
          max: metadata.stats?.max,
          spread: metadata.stats?.spread,
          spreadPct: metadata.stats?.spreadPct
        },
        threshold: metadata.threshold || 15,
        winningBidId: metadata.winningBidId,
        winningVendor: metadata.winningVendor,
        outliers: metadata.outliers || [],
        allBids: metadata.allBids || [],
        eventId: event.id
      };
    }).filter(b => b.dealId); // Remove any null dealIds

    // Calculate summary statistics
    const summary = {
      total: blockedBids.length,
      uniqueDeals: blockedDealIds.length,
      avgSpread: blockedBids.length > 0
        ? blockedBids.reduce((sum, b) => sum + (b.stats.spreadPct || 0), 0) / blockedBids.length
        : 0,
      tradesAffected: [...new Set(blockedBids.map(b => b.trade))].length
    };

    // Group by trade to see patterns
    const tradeBreakdown = blockedBids.reduce((acc, bid) => {
      const trade = bid.trade || 'Unknown';
      if (!acc[trade]) {
        acc[trade] = {
          trade,
          count: 0,
          avgSpread: 0,
          totalSpread: 0
        };
      }
      acc[trade].count++;
      acc[trade].totalSpread += bid.stats.spreadPct || 0;
      acc[trade].avgSpread = acc[trade].totalSpread / acc[trade].count;
      return acc;
    }, {} as Record<string, any>);

    const tradesWithIssues = Object.values(tradeBreakdown).sort((a: any, b: any) =>
      b.count - a.count
    );

    log.info({
      summary,
      blockedCount: blockedBids.length
    }, 'Retrieved G2 blocked bids');

    return NextResponse.json({
      success: true,
      summary,
      blockedBids,
      tradesWithIssues,
      timeframe: '7 days',
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    log.error({ error }, 'Failed to retrieve G2 status');
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
  // NOTE: Do not call prisma.$disconnect() - uses shared singleton
}
