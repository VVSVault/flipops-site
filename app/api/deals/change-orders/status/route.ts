import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ endpoint: '/api/deals/change-orders/status' });

/**
 * Get G4 guardrail violations - deals with pending change order approvals
 * This endpoint monitors for change orders awaiting approval
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

    // Get all pending change orders with deal details
    const pendingChangeOrders = await prisma.changeOrder.findMany({
      where: {
        deal: { userId },
        status: 'proposed'
      },
      include: {
        deal: {
          select: {
            id: true,
            address: true,
            maxExposureUsd: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate impact percentages
    const pendingApprovals = pendingChangeOrders.map(co => {
      const impactPct = co.deal.maxExposureUsd > 0
        ? (co.deltaUsd / co.deal.maxExposureUsd) * 100
        : 0;

      return {
        dealId: co.dealId,
        address: co.deal.address,
        changeOrderId: co.id,
        deltaUsd: co.deltaUsd,
        impactPct,
        impactDays: co.impactDays,
        trade: co.trade,
        reason: co.rationale || 'No reason provided',
        createdAt: co.createdAt
      };
    });

    // Calculate summary statistics
    const summary = {
      total: pendingApprovals.length,
      uniqueDeals: new Set(pendingApprovals.map(p => p.dealId)).size,
      totalImpact: pendingApprovals.reduce((sum, p) => sum + p.deltaUsd, 0),
      totalDaysImpact: pendingApprovals.reduce((sum, p) => sum + p.impactDays, 0)
    };

    log.info({
      summary,
      pendingCount: pendingApprovals.length
    }, 'Retrieved G4 pending change orders');

    return NextResponse.json({
      success: true,
      summary,
      pendingApprovals: pendingApprovals.map(p => ({
        address: p.address,
        changeOrderId: p.changeOrderId,
        deltaUsd: p.deltaUsd,
        impactPct: p.impactPct,
        impactDays: p.impactDays,
        trade: p.trade,
        reason: p.reason
      })),
      timeframe: 'current',
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    log.error({ error }, 'Failed to retrieve G4 change order status');
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
