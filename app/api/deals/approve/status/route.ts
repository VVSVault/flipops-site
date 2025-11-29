import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ endpoint: '/api/deals/approve/status' });

/**
 * Get G1 guardrail violations - deals where P80 exceeds max exposure
 * This endpoint monitors for deals that have been blocked by the G1 gate
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

    // Get all BLOCK events from G1 in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const blockEvents = await prisma.event.findMany({
      where: {
        actor: 'system:G1',
        action: 'BLOCK',
        artifact: 'DealSpec',
        ts: {
          gte: sevenDaysAgo
        }
      },
      orderBy: { ts: 'desc' },
      take: 50
    });

    // Get unique deal IDs from blocked events
    const blockedDealIds = [...new Set(blockEvents.map(e => e.dealId).filter(id => id !== null))];

    // Fetch deal details for blocked deals
    const blockedDeals = await prisma.dealSpec.findMany({
      where: {
        userId,
        id: { in: blockedDealIds }
      },
      select: {
        id: true,
        address: true,
        maxExposureUsd: true,
        targetRoiPct: true,
        createdAt: true
      }
    });

    // Create a map of deals for easy lookup
    const dealMap = new Map(blockedDeals.map(d => [d.id, d]));

    // Build detailed blocked deal list with event metadata
    const blockedDealsWithDetails = blockEvents.map(event => {
      const deal = dealMap.get(event.dealId || '');
      const metadata = event.diff ? JSON.parse(event.diff as string) : {};

      return {
        dealId: event.dealId,
        address: deal?.address || 'Unknown',
        blockedAt: event.ts,
        reason: metadata.reason || 'P80 exceeds max exposure',
        metrics: {
          p80: metadata.p80,
          maxExposureUsd: metadata.maxExposureUsd,
          overBy: metadata.overBy,
          overByPct: metadata.overByPct
        },
        drivers: metadata.drivers || [],
        eventId: event.id,
        deal: {
          maxExposureUsd: deal?.maxExposureUsd,
          targetRoiPct: deal?.targetRoiPct,
          createdAt: deal?.createdAt
        }
      };
    }).filter(d => d.dealId); // Remove any null dealIds

    // Calculate summary statistics
    const summary = {
      total: blockedDealsWithDetails.length,
      uniqueDeals: blockedDealIds.length,
      totalOverage: blockedDealsWithDetails.reduce((sum, d) =>
        sum + (d.metrics.overBy || 0), 0
      ),
      avgOveragePct: blockedDealsWithDetails.length > 0
        ? blockedDealsWithDetails.reduce((sum, d) =>
            sum + (d.metrics.overByPct || 0), 0
          ) / blockedDealsWithDetails.length
        : 0
    };

    log.info({
      summary,
      blockedCount: blockedDealsWithDetails.length
    }, 'Retrieved G1 blocked deals');

    return NextResponse.json({
      success: true,
      summary,
      blockedDeals: blockedDealsWithDetails,
      timeframe: '7 days',
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    log.error({ error }, 'Failed to retrieve G1 status');
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
