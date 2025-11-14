import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import log from '@/lib/logger';

const prisma = new PrismaClient();

interface ContractorPerformance {
  vendorId: string;
  vendorName: string;
  trade: string;
  totalBids: number;
  awardedBids: number;
  totalInvoices: number;
  totalInvoiced: number;
  avgBidAmount: number;
  avgInvoiceAmount: number;
  budgetVariance: number; // Percentage over/under bid
  changeOrders: number;
  avgChangeOrderCost: number;
  currentReliability: number;
  onTimePct: number;
  onBudgetPct: number;
  flags: string[];
}

export async function GET(req: NextRequest) {
  try {
    // Optional API key validation
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.FO_API_KEY || process.env.FLIPOPS_API_KEY;

    if (expectedApiKey && apiKey && apiKey !== expectedApiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all vendors with their bids, invoices, and change orders
    const vendors = await prisma.vendor.findMany({
      include: {
        bids: {
          select: {
            id: true,
            dealId: true,
            subtotal: true,
            status: true,
            createdAt: true
          }
        },
        invoices: {
          select: {
            id: true,
            dealId: true,
            amount: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    // Get all change orders
    const allChangeOrders = await prisma.changeOrder.findMany({
      select: {
        id: true,
        dealId: true,
        deltaUsd: true,
        status: true
      }
    });

    // Calculate performance metrics for each vendor
    const performance: ContractorPerformance[] = await Promise.all(
      vendors.map(async (vendor) => {
        const totalBids = vendor.bids.length;
        const awardedBids = vendor.bids.filter(b => b.status === 'awarded').length;
        const totalInvoices = vendor.invoices.length;
        const totalInvoiced = vendor.invoices.reduce((sum, inv) => sum + inv.amount, 0);
        const avgBidAmount = totalBids > 0
          ? vendor.bids.reduce((sum, bid) => sum + bid.subtotal, 0) / totalBids
          : 0;
        const avgInvoiceAmount = totalInvoices > 0
          ? totalInvoiced / totalInvoices
          : 0;

        // Get change orders for this vendor's deals
        const vendorDealIds = [...new Set(vendor.bids.map(b => b.dealId))];
        const vendorChangeOrders = allChangeOrders.filter(co =>
          vendorDealIds.includes(co.dealId) && co.status === 'approved'
        );
        const changeOrderCount = vendorChangeOrders.length;
        const avgChangeOrderCost = changeOrderCount > 0
          ? vendorChangeOrders.reduce((sum, co) => sum + co.deltaUsd, 0) / changeOrderCount
          : 0;

        // Calculate budget variance (invoices vs awarded bids)
        const awardedBidTotal = vendor.bids
          .filter(b => b.status === 'awarded')
          .reduce((sum, bid) => sum + bid.subtotal, 0);

        const budgetVariance = awardedBidTotal > 0
          ? ((totalInvoiced - awardedBidTotal) / awardedBidTotal) * 100
          : 0;

        // Flag issues
        const flags: string[] = [];
        if (budgetVariance > 15) {
          flags.push('BUDGET_OVERRUN');
        }
        if (changeOrderCount > awardedBids * 0.5 && awardedBids > 0) {
          flags.push('HIGH_CHANGE_ORDERS');
        }
        if (vendor.onTimePct < 80) {
          flags.push('POOR_ON_TIME_PERFORMANCE');
        }
        if (vendor.onBudgetPct < 85) {
          flags.push('POOR_BUDGET_PERFORMANCE');
        }
        if (vendor.reliability < 75) {
          flags.push('LOW_RELIABILITY_SCORE');
        }

        return {
          vendorId: vendor.id,
          vendorName: vendor.name,
          trade: vendor.trade,
          totalBids,
          awardedBids,
          totalInvoices,
          totalInvoiced,
          avgBidAmount,
          avgInvoiceAmount,
          budgetVariance,
          changeOrders: changeOrderCount,
          avgChangeOrderCost,
          currentReliability: vendor.reliability,
          onTimePct: vendor.onTimePct,
          onBudgetPct: vendor.onBudgetPct,
          flags
        };
      })
    );

    // Sort by reliability (worst first) to highlight problems
    performance.sort((a, b) => a.currentReliability - b.currentReliability);

    const flaggedContractors = performance.filter(p => p.flags.length > 0);

    return NextResponse.json({
      success: true,
      count: performance.length,
      flaggedCount: flaggedContractors.length,
      contractors: performance,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    log.error({ error }, 'Failed to retrieve contractor performance data');
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
