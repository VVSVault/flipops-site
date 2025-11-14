import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Optional API key validation
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.FO_API_KEY || process.env.FLIPOPS_API_KEY;

    if (expectedApiKey && apiKey !== expectedApiKey) {
      // For now, just log if API key doesn't match but don't block
      console.log('API key mismatch or missing');
    }

    // Fetch all deals with budget ledgers
    const deals = await prisma.dealSpec.findMany({
      include: {
        budgetLedger: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate budget status for each project
    const projects = deals.map((deal) => {
      let baselineTotal = 0;
      let actualsTotal = 0;
      let committedTotal = 0;

      if (deal.budgetLedger) {
        try {
          const baseline = JSON.parse(deal.budgetLedger.baseline);
          const actuals = JSON.parse(deal.budgetLedger.actuals);
          const committed = JSON.parse(deal.budgetLedger.committed);

          // Sum up all trades
          baselineTotal = Object.values(baseline).reduce((sum: number, val: any) => sum + (val || 0), 0);
          actualsTotal = Object.values(actuals).reduce((sum: number, val: any) => sum + (val || 0), 0);
          committedTotal = Object.values(committed).reduce((sum: number, val: any) => sum + (val || 0), 0);
        } catch (e) {
          console.error(`Error parsing budget data for deal ${deal.id}:`, e);
        }
      }

      // Use maxExposureUsd as the budgeted amount if no baseline
      const budgetedCost = baselineTotal > 0 ? baselineTotal : deal.maxExposureUsd;
      const actualCost = actualsTotal;
      const utilization = budgetedCost > 0 ? (actualCost / budgetedCost) * 100 : 0;
      const variance = actualCost - budgetedCost;

      // Determine status
      let status = 'healthy';
      let flag = null;
      if (utilization >= 100) {
        status = 'critical';
        flag = 'BUDGET_EXCEEDED';
      } else if (utilization >= 80) {
        status = 'warning';
        flag = 'APPROACHING_BUDGET';
      }

      return {
        dealId: deal.id,
        address: deal.address,
        type: deal.type,
        region: deal.region,
        budgetedCost,
        actualCost,
        committedCost: committedTotal,
        utilization: Math.round(utilization * 100) / 100,
        variance: Math.round(variance * 100) / 100,
        status,
        flag,
        contingencyRemaining: deal.budgetLedger?.contingencyRemaining || 0,
        startAt: deal.startAt,
        dailyBurnUsd: deal.dailyBurnUsd || 0,
        updatedAt: deal.budgetLedger?.updatedAt || deal.updatedAt,
      };
    });

    // Separate flagged projects
    const flaggedProjects = projects.filter(p => p.flag !== null);
    const healthyProjects = projects.filter(p => p.flag === null);

    return NextResponse.json({
      success: true,
      count: projects.length,
      flaggedCount: flaggedProjects.length,
      healthyCount: healthyProjects.length,
      projects: projects,
      flaggedProjects: flaggedProjects,
    });
  } catch (error) {
    console.error('Error fetching budget status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget status' },
      { status: 500 }
    );
  }
}
