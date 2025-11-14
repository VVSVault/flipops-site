import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ endpoint: '/api/change-orders/status' });

/**
 * Get change order processing status and gatekeeper decisions
 * Returns recent change orders with approval/denial statistics
 */
export async function GET(req: NextRequest) {
  try {
    // Optional API key authentication
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.FO_API_KEY || process.env.FLIPOPS_API_KEY;

    if (expectedApiKey && apiKey && apiKey !== expectedApiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recent change orders (last 7 days)
    const recentChangeOrders = await prisma.changeOrder.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Get deal information for each change order
    const dealIds = [...new Set(recentChangeOrders.map(co => co.dealId))];
    const deals = await prisma.dealSpec.findMany({
      where: { id: { in: dealIds } },
      select: {
        id: true,
        address: true,
        maxExposureUsd: true,
        targetRoiPct: true
      }
    });

    const dealMap = deals.reduce((acc, deal) => {
      acc[deal.id] = deal;
      return acc;
    }, {} as Record<string, any>);

    // Get recent G4 events
    const g4Events = await prisma.event.findMany({
      where: {
        actor: 'system:G4',
        action: {
          in: ['APPROVE_CO', 'DENY_CO']
        },
        ts: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { ts: 'desc' },
      take: 50
    });

    // Calculate statistics
    const approvedCount = recentChangeOrders.filter(co => co.status === 'approved').length;
    const deniedCount = recentChangeOrders.filter(co => co.status === 'denied').length;
    const proposedCount = recentChangeOrders.filter(co => co.status === 'proposed').length;

    // Group by deal to see which deals have the most change orders
    const dealActivity = recentChangeOrders.reduce((acc, co) => {
      const dealId = co.dealId;
      if (!acc[dealId]) {
        acc[dealId] = {
          dealId,
          address: dealMap[dealId]?.address || 'Unknown',
          approvedCount: 0,
          deniedCount: 0,
          proposedCount: 0,
          totalDelta: 0,
          changeOrders: []
        };
      }

      if (co.status === 'approved') acc[dealId].approvedCount++;
      if (co.status === 'denied') acc[dealId].deniedCount++;
      if (co.status === 'proposed') acc[dealId].proposedCount++;
      acc[dealId].totalDelta += co.deltaUsd;
      acc[dealId].changeOrders.push({
        id: co.id,
        trade: co.trade,
        deltaUsd: co.deltaUsd,
        impactDays: co.impactDays,
        status: co.status,
        createdAt: co.createdAt,
        decidedAt: co.decidedAt
      });

      return acc;
    }, {} as Record<string, any>);

    const dealsWithActivity = Object.values(dealActivity).sort((a: any, b: any) =>
      b.changeOrders.length - a.changeOrders.length
    );

    // Group by trade to see which trades have the most change orders
    const tradeActivity = recentChangeOrders.reduce((acc, co) => {
      const trade = co.trade;
      if (!acc[trade]) {
        acc[trade] = {
          trade,
          approvedCount: 0,
          deniedCount: 0,
          proposedCount: 0,
          totalDelta: 0,
          changeOrderCount: 0
        };
      }

      if (co.status === 'approved') acc[trade].approvedCount++;
      if (co.status === 'denied') acc[trade].deniedCount++;
      if (co.status === 'proposed') acc[trade].proposedCount++;
      acc[trade].totalDelta += co.deltaUsd;
      acc[trade].changeOrderCount++;

      return acc;
    }, {} as Record<string, any>);

    const tradesWithActivity = Object.values(tradeActivity).sort((a: any, b: any) =>
      b.changeOrderCount - a.changeOrderCount
    );

    // Find denied change orders for alerts
    const deniedChangeOrders = recentChangeOrders
      .filter(co => co.status === 'denied')
      .slice(0, 10)
      .map(co => ({
        id: co.id,
        dealId: co.dealId,
        address: dealMap[co.dealId]?.address || 'Unknown',
        trade: co.trade,
        deltaUsd: co.deltaUsd,
        impactDays: co.impactDays,
        rationale: co.rationale,
        simResults: co.simResults,
        createdAt: co.createdAt,
        decidedAt: co.decidedAt
      }));

    log.info({
      totalChangeOrders: recentChangeOrders.length,
      approvedCount,
      deniedCount,
      proposedCount,
      dealsWithActivity: dealsWithActivity.length,
      tradesWithActivity: tradesWithActivity.length
    }, 'Change Order status retrieved');

    return NextResponse.json({
      success: true,
      summary: {
        total: recentChangeOrders.length,
        approved: approvedCount,
        denied: deniedCount,
        proposed: proposedCount,
        dealsActive: dealsWithActivity.length,
        tradesActive: tradesWithActivity.length
      },
      dealsWithActivity: dealsWithActivity.slice(0, 10), // Top 10 most active deals
      tradesWithActivity,
      deniedChangeOrders,
      recentEvents: g4Events.map(e => ({
        id: e.id,
        dealId: e.dealId,
        action: e.action,
        timestamp: e.ts,
        checksum: e.checksum
      })),
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    log.error({ error }, 'Failed to retrieve change order status');
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
