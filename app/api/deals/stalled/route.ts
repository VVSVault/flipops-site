import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ endpoint: '/api/deals/stalled' });

interface StalledDeal {
  gate: string;
  dealId: string;
  address?: string;
  stalledFor: number; // hours
  status: string;
  details: any;
}

export async function GET(req: NextRequest) {
  try {
    // Optional API key authentication (if configured)
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.FO_API_KEY || process.env.FLIPOPS_API_KEY;

    // Only enforce auth if an API key is configured
    if (expectedApiKey && apiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

    const stalledDeals: StalledDeal[] = [];
    const now = new Date();

    // G1: Deals without APPROVE or BLOCK events (stuck in approval limbo)
    // These are deals that exist but haven't been evaluated yet
    const g1Threshold = 72; // 3 days in hours
    const g1DealsWithEvents = await prisma.event.findMany({
      where: {
        artifact: 'DealSpec',
        action: { in: ['APPROVE', 'BLOCK'] },
        actor: 'system:G1'
      },
      select: { dealId: true },
      distinct: ['dealId']
    });

    const g1ProcessedDealIds = g1DealsWithEvents.map(e => e.dealId).filter(id => id !== null);

    const g1StalledDeals = await prisma.dealSpec.findMany({
      where: {
        userId,
        id: { notIn: g1ProcessedDealIds },
        createdAt: {
          lte: new Date(now.getTime() - g1Threshold * 60 * 60 * 1000)
        }
      },
      select: {
        id: true,
        address: true,
        createdAt: true,
        maxExposureUsd: true,
        targetRoiPct: true
      },
      take: 20
    });

    for (const deal of g1StalledDeals) {
      const hoursSinceCreation = Math.floor((now.getTime() - deal.createdAt.getTime()) / (1000 * 60 * 60));
      stalledDeals.push({
        gate: 'G1',
        dealId: deal.id,
        address: deal.address,
        stalledFor: hoursSinceCreation,
        status: 'pending_approval',
        details: {
          maxExposureUsd: deal.maxExposureUsd,
          targetRoiPct: deal.targetRoiPct,
          createdAt: deal.createdAt
        }
      });
    }

    // G2: Bids pending award for > 5 days (120 hours)
    const g2Threshold = 120; // 5 days in hours
    const g2StalledBids = await prisma.bid.findMany({
      where: {
        status: 'pending',
        createdAt: {
          lte: new Date(now.getTime() - g2Threshold * 60 * 60 * 1000)
        }
      },
      include: {
        deal: {
          select: {
            id: true,
            address: true
          }
        },
        vendor: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 20
    });

    for (const bid of g2StalledBids) {
      const hoursSinceCreation = Math.floor((now.getTime() - bid.createdAt.getTime()) / (1000 * 60 * 60));
      stalledDeals.push({
        gate: 'G2',
        dealId: bid.dealId,
        address: bid.deal.address,
        stalledFor: hoursSinceCreation,
        status: 'bid_pending',
        details: {
          bidId: bid.id,
          vendorId: bid.vendorId,
          vendorName: bid.vendor?.name || 'Unknown',
          subtotal: bid.subtotal,
          createdAt: bid.createdAt
        }
      });
    }

    // G3: Invoices pending processing for > 2 days (48 hours)
    const g3Threshold = 48; // 2 days in hours
    const g3StalledInvoices = await prisma.invoice.findMany({
      where: {
        status: 'pending',
        createdAt: {
          lte: new Date(now.getTime() - g3Threshold * 60 * 60 * 1000)
        }
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 20
    });

    // Group invoices by dealId to get deal addresses
    const g3DealIds = [...new Set(g3StalledInvoices.map(inv => inv.dealId))];
    const g3Deals = await prisma.dealSpec.findMany({
      where: {
        userId,
        id: { in: g3DealIds }
      },
      select: {
        id: true,
        address: true
      }
    });

    const dealMap = new Map(g3Deals.map(d => [d.id, d]));

    for (const invoice of g3StalledInvoices) {
      const hoursSinceCreation = Math.floor((now.getTime() - invoice.createdAt.getTime()) / (1000 * 60 * 60));
      const deal = dealMap.get(invoice.dealId);
      stalledDeals.push({
        gate: 'G3',
        dealId: invoice.dealId,
        address: deal?.address || 'Unknown',
        stalledFor: hoursSinceCreation,
        status: 'invoice_pending',
        details: {
          invoiceId: invoice.id,
          trade: invoice.trade,
          amount: invoice.amount,
          vendorId: invoice.vendorId,
          vendorName: invoice.vendor?.name || 'Unknown',
          createdAt: invoice.createdAt
        }
      });
    }

    // G4: Change orders pending approval for > 1 day (24 hours)
    const g4Threshold = 24; // 1 day in hours
    const g4StalledCOs = await prisma.changeOrder.findMany({
      where: {
        status: 'proposed',
        createdAt: {
          lte: new Date(now.getTime() - g4Threshold * 60 * 60 * 1000)
        }
      },
      include: {
        deal: {
          select: {
            id: true,
            address: true
          }
        }
      },
      take: 20
    });

    for (const co of g4StalledCOs) {
      const hoursSinceCreation = Math.floor((now.getTime() - co.createdAt.getTime()) / (1000 * 60 * 60));
      stalledDeals.push({
        gate: 'G4',
        dealId: co.dealId,
        address: co.deal.address,
        stalledFor: hoursSinceCreation,
        status: 'change_order_pending',
        details: {
          changeOrderId: co.id,
          trade: co.trade,
          deltaUsd: co.deltaUsd,
          impactDays: co.impactDays,
          createdAt: co.createdAt
        }
      });
    }

    // Sort by stalledFor (most stalled first)
    stalledDeals.sort((a, b) => b.stalledFor - a.stalledFor);

    const summary = {
      G1: stalledDeals.filter(d => d.gate === 'G1').length,
      G2: stalledDeals.filter(d => d.gate === 'G2').length,
      G3: stalledDeals.filter(d => d.gate === 'G3').length,
      G4: stalledDeals.filter(d => d.gate === 'G4').length,
      total: stalledDeals.length
    };

    log.info({ summary }, 'Retrieved stalled deals');

    return NextResponse.json({
      success: true,
      summary,
      stalledDeals,
      thresholds: {
        G1: `${g1Threshold / 24} days`,
        G2: `${g2Threshold / 24} days`,
        G3: `${g3Threshold / 24} days`,
        G4: `${g4Threshold / 24} days`
      },
      timestamp: now.toISOString()
    }, { status: 200 });

  } catch (error) {
    log.error({ error }, 'Failed to retrieve stalled deals');
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
