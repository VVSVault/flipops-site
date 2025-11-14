import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ endpoint: '/api/invoices/status' });

/**
 * Get invoice processing status and budget tier alerts
 * Returns invoices flagged for budget variance (Tier 1 and Tier 2)
 */
export async function GET(req: NextRequest) {
  try {
    // Optional API key authentication
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.FO_API_KEY || process.env.FLIPOPS_API_KEY;

    if (expectedApiKey && apiKey && apiKey !== expectedApiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all invoices with budget concerns (flagged or with warnings)
    const flaggedInvoices = await prisma.invoice.findMany({
      where: {
        OR: [
          { status: 'flagged' },              // TIER2 - Critical
          { status: 'approved_with_warning' }  // TIER1 - Warning
        ]
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            reliability: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Get deal information for each invoice
    const dealIds = [...new Set(flaggedInvoices.map(inv => inv.dealId))];
    const deals = await prisma.dealSpec.findMany({
      where: { id: { in: dealIds } },
      select: {
        id: true,
        address: true,
        maxExposureUsd: true
      }
    });

    const dealMap = deals.reduce((acc, deal) => {
      acc[deal.id] = deal;
      return acc;
    }, {} as Record<string, any>);

    // Get recent events related to budget tiers
    const tierEvents = await prisma.event.findMany({
      where: {
        actor: 'system:G3',
        action: {
          in: ['FLAG_TIER1', 'ESCALATE_TIER2', 'QUEUE_COG_SIMULATION']
        },
        ts: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: { ts: 'desc' },
      take: 50
    });

    // Calculate statistics
    const tier2Count = flaggedInvoices.filter(inv => inv.status === 'flagged').length;
    const tier1Count = flaggedInvoices.filter(inv => inv.status === 'approved_with_warning').length;

    // Group by deal to see which deals have the most issues
    const dealIssues = flaggedInvoices.reduce((acc, inv) => {
      const dealId = inv.dealId;
      if (!acc[dealId]) {
        acc[dealId] = {
          dealId,
          address: dealMap[dealId]?.address || 'Unknown',
          tier1Count: 0,
          tier2Count: 0,
          totalAmount: 0,
          invoices: []
        };
      }

      if (inv.status === 'flagged') acc[dealId].tier2Count++;
      if (inv.status === 'approved_with_warning') acc[dealId].tier1Count++;
      acc[dealId].totalAmount += inv.amount;
      acc[dealId].invoices.push({
        id: inv.id,
        trade: inv.trade,
        amount: inv.amount,
        vendor: inv.vendor?.name || 'Unknown',
        status: inv.status,
        createdAt: inv.createdAt
      });

      return acc;
    }, {} as Record<string, any>);

    const dealsWithIssues = Object.values(dealIssues).sort((a: any, b: any) =>
      (b.tier2Count * 10 + b.tier1Count) - (a.tier2Count * 10 + a.tier1Count)
    );

    // Group by trade to see which trades are over budget most frequently
    const tradeIssues = flaggedInvoices.reduce((acc, inv) => {
      const trade = inv.trade;
      if (!acc[trade]) {
        acc[trade] = {
          trade,
          tier1Count: 0,
          tier2Count: 0,
          totalAmount: 0,
          invoiceCount: 0
        };
      }

      if (inv.status === 'flagged') acc[trade].tier2Count++;
      if (inv.status === 'approved_with_warning') acc[trade].tier1Count++;
      acc[trade].totalAmount += inv.amount;
      acc[trade].invoiceCount++;

      return acc;
    }, {} as Record<string, any>);

    const tradesWithIssues = Object.values(tradeIssues).sort((a: any, b: any) =>
      (b.tier2Count * 10 + b.tier1Count) - (a.tier2Count * 10 + a.tier1Count)
    );

    log.info({
      totalFlagged: flaggedInvoices.length,
      tier2Count,
      tier1Count,
      dealsAffected: dealsWithIssues.length,
      tradesAffected: tradesWithIssues.length
    }, 'Invoice status retrieved');

    return NextResponse.json({
      success: true,
      summary: {
        total: flaggedInvoices.length,
        tier2Critical: tier2Count,
        tier1Warning: tier1Count,
        dealsAffected: dealsWithIssues.length,
        tradesAffected: tradesWithIssues.length
      },
      dealsWithIssues: dealsWithIssues.slice(0, 10), // Top 10 problematic deals
      tradesWithIssues,
      recentEvents: tierEvents.map(e => ({
        id: e.id,
        dealId: e.dealId,
        action: e.action,
        timestamp: e.ts,
        checksum: e.checksum
      })),
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    log.error({ error }, 'Failed to retrieve invoice status');
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
