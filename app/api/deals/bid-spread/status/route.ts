import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ endpoint: '/api/deals/bid-spread/status' });

/**
 * Get G2 guardrail violations - deals where bid spread exceeds 15%
 * This endpoint monitors for deals that have wide bid spreads (>15% between lowest and highest bid)
 */
export async function GET(req: NextRequest) {
  try {
    // Optional API key authentication
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.FO_API_KEY || process.env.FLIPOPS_API_KEY;

    if (expectedApiKey && apiKey && apiKey !== expectedApiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract userId from query params (multi-tenant)
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Get all deals with at least 2 bids
    const dealsWithBids = await prisma.dealSpec.findMany({
      where: {
        userId,
        bids: {
          some: {}
        }
      },
      include: {
        bids: {
          where: {
            status: {
              in: ['pending', 'awarded']
            }
          },
          select: {
            id: true,
            subtotal: true,
            status: true
          }
        }
      }
    });

    // Calculate bid spreads and find violations (>15%)
    const violations = dealsWithBids
      .filter(deal => deal.bids.length >= 2)
      .map(deal => {
        const bidAmounts = deal.bids.map(b => b.subtotal);
        const lowestBid = Math.min(...bidAmounts);
        const highestBid = Math.max(...bidAmounts);
        const bidSpread = ((highestBid - lowestBid) / lowestBid) * 100;

        return {
          dealId: deal.id,
          address: deal.address,
          bidSpread,
          lowestBid,
          highestBid,
          bidCount: deal.bids.length,
          bids: deal.bids
        };
      })
      .filter(item => item.bidSpread > 15)
      .sort((a, b) => b.bidSpread - a.bidSpread);

    // Calculate summary statistics
    const summary = {
      total: violations.length,
      uniqueDeals: violations.length,
      avgSpread: violations.length > 0
        ? violations.reduce((sum, v) => sum + v.bidSpread, 0) / violations.length
        : 0
    };

    log.info({
      summary,
      violationCount: violations.length
    }, 'Retrieved G2 bid spread violations');

    return NextResponse.json({
      success: true,
      summary,
      violations: violations.map(v => ({
        address: v.address,
        bidSpread: v.bidSpread,
        lowestBid: v.lowestBid,
        highestBid: v.highestBid,
        bidCount: v.bidCount
      })),
      timeframe: 'current',
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    log.error({ error }, 'Failed to retrieve G2 bid spread status');
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
