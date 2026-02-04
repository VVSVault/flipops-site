import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ endpoint: '/api/deals/budget-variance/status' });

/**
 * Get G3 guardrail violations - deals where budget variance exceeds threshold
 * This endpoint monitors for deals with budget overruns (>10% variance)
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

    // Extract userId from query params (multi-tenant)
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Get all deals with budget ledgers
    const dealsWithBudgets = await prisma.dealSpec.findMany({
      where: {
        userId,
        budgetLedger: {
          isNot: null
        }
      },
      include: {
        budgetLedger: true
      }
    });

    // Calculate budget variances and find violations (>10%)
    const violations = dealsWithBudgets
      .map(deal => {
        if (!deal.budgetLedger) return null;

        const baseline = JSON.parse(deal.budgetLedger.baseline);
        const actuals = JSON.parse(deal.budgetLedger.actuals);
        const variance = JSON.parse(deal.budgetLedger.variance);

        // Calculate total budgeted vs actual cost
        const budgetedCost = Object.values(baseline).reduce((sum: number, val: any) =>
          sum + (typeof val === 'number' ? val : 0), 0
        );
        const actualCost = Object.values(actuals).reduce((sum: number, val: any) =>
          sum + (typeof val === 'number' ? val : 0), 0
        );

        const overageAmount = actualCost - budgetedCost;
        const budgetVariance = budgetedCost > 0
          ? (overageAmount / budgetedCost) * 100
          : 0;

        return {
          dealId: deal.id,
          address: deal.address,
          budgetVariance,
          budgetedCost,
          actualCost,
          overageAmount,
          contingencyRemaining: deal.budgetLedger.contingencyRemaining,
          variance
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && item.budgetVariance > 10)
      .sort((a, b) => b.budgetVariance - a.budgetVariance);

    // Calculate summary statistics
    const summary = {
      total: violations.length,
      uniqueDeals: violations.length,
      totalOverage: violations.reduce((sum, v) => sum + v.overageAmount, 0),
      avgVariancePct: violations.length > 0
        ? violations.reduce((sum, v) => sum + v.budgetVariance, 0) / violations.length
        : 0
    };

    log.info({
      summary,
      violationCount: violations.length
    }, 'Retrieved G3 budget variance violations');

    return NextResponse.json({
      success: true,
      summary,
      violations: violations.map(v => ({
        address: v.address,
        budgetVariance: v.budgetVariance,
        budgetedCost: v.budgetedCost,
        actualCost: v.actualCost,
        overageAmount: v.overageAmount,
        contingencyRemaining: v.contingencyRemaining
      })),
      timeframe: 'current',
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    log.error({ error }, 'Failed to retrieve G3 budget variance status');
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
  // NOTE: Do not call prisma.$disconnect() - uses shared singleton
}
