import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserId } from '@/lib/auth-helpers';

/**
 * GET /api/dashboard/investor-stats
 * Get investor-type-specific dashboard statistics
 */
export async function GET() {
  try {
    const authResult = await getAuthenticatedUserId();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const dbUserId = authResult.userId!;

    // Get user with investor type
    const user = await prisma.user.findUnique({
      where: { id: dbUserId },
      select: { investorType: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const investorType = user.investorType || 'hybrid'; // Default to hybrid if not set
    const stats: any = {};

    // Wholesaler stats
    if (investorType === 'wholesaler' || investorType === 'hybrid') {
      const [totalBuyers, activeAssignments, completedAssignments, totalRevenue, avgAssignmentFee] = await Promise.all([
        prisma.buyer.count({ where: { userId: dbUserId } }),
        prisma.contractAssignment.count({
          where: { contract: { userId: dbUserId }, status: { in: ['pending', 'in_progress'] } },
        }),
        prisma.contractAssignment.count({
          where: { contract: { userId: dbUserId }, status: 'completed' },
        }),
        prisma.contractAssignment.aggregate({
          where: { contract: { userId: dbUserId }, status: 'completed', feeReceived: true },
          _sum: { assignmentFee: true },
        }),
        prisma.contractAssignment.aggregate({
          where: { contract: { userId: dbUserId } },
          _avg: { assignmentFee: true },
        }),
      ]);

      stats.wholesaler = {
        totalBuyers,
        activeAssignments,
        completedAssignments,
        totalRevenue: totalRevenue._sum.assignmentFee || 0,
        avgAssignmentFee: avgAssignmentFee._avg.assignmentFee || 0,
      };
    }

    // Flipper stats
    if (investorType === 'flipper' || investorType === 'hybrid') {
      const [totalRenovations, activeRenovations, completedRenovations, totalBudget, avgROI] = await Promise.all([
        prisma.dealSpec.count({ where: { userId: dbUserId, propertyId: { not: null }, contractId: { not: null } } }),
        prisma.dealSpec.count({ where: { userId: dbUserId, propertyId: { not: null }, contractId: { not: null }, status: 'active' } }),
        prisma.dealSpec.count({ where: { userId: dbUserId, propertyId: { not: null }, contractId: { not: null }, status: 'completed' } }),
        prisma.dealSpec.aggregate({
          where: { userId: dbUserId, propertyId: { not: null }, contractId: { not: null }, status: { in: ['planning', 'active'] } },
          _sum: { rehabBudget: true },
        }),
        prisma.dealSpec.findMany({
          where: { userId: dbUserId, propertyId: { not: null }, contractId: { not: null }, status: 'completed', arv: { not: null }, purchasePrice: { not: null }, rehabBudget: { not: null } },
          select: { arv: true, purchasePrice: true, rehabBudget: true },
        }),
      ]);

      let calculatedAvgROI = 0;
      if (avgROI.length > 0) {
        const totalROI = avgROI.reduce((sum, project) => {
          const totalCost = (project.purchasePrice || 0) + (project.rehabBudget || 0);
          const roi = totalCost > 0 ? (((project.arv || 0) - totalCost) / totalCost) * 100 : 0;
          return sum + roi;
        }, 0);
        calculatedAvgROI = totalROI / avgROI.length;
      }

      stats.flipper = {
        totalRenovations,
        activeRenovations,
        completedRenovations,
        totalBudget: totalBudget._sum.rehabBudget || 0,
        avgROI: calculatedAvgROI,
      };
    }

    // Buy-and-Hold stats
    if (investorType === 'buy_and_hold' || investorType === 'hybrid') {
      const [totalRentals, leasedRentals, vacantRentals, totalMonthlyRent, analyticsData] = await Promise.all([
        prisma.rental.count({ where: { userId: dbUserId } }),
        prisma.rental.count({ where: { userId: dbUserId, status: 'leased' } }),
        prisma.rental.count({ where: { userId: dbUserId, status: 'vacant' } }),
        prisma.rental.aggregate({ where: { userId: dbUserId }, _sum: { monthlyRent: true } }),
        prisma.rental.findMany({
          where: { userId: dbUserId },
          select: { monthlyRent: true, mortgagePayment: true, propertyTax: true, insurance: true, hoa: true, utilities: true, maintenance: true, purchasePrice: true },
        }),
      ]);

      const totalMonthlyCashFlow = analyticsData.reduce((sum, rental) => {
        const expenses = (rental.mortgagePayment || 0) + (rental.propertyTax || 0) + (rental.insurance || 0) + (rental.hoa || 0) + (rental.utilities || 0) + (rental.maintenance || 0);
        return sum + (rental.monthlyRent - expenses);
      }, 0);

      const capRates = analyticsData.filter(r => r.purchasePrice && r.purchasePrice > 0).map(r => {
        const annualIncome = r.monthlyRent * 12;
        const annualExpenses = ((r.propertyTax || 0) + (r.insurance || 0) + (r.hoa || 0) + (r.utilities || 0) + (r.maintenance || 0)) * 12;
        const noi = annualIncome - annualExpenses;
        return (noi / r.purchasePrice!) * 100;
      });

      stats.buyAndHold = {
        totalRentals,
        leasedRentals,
        vacantRentals,
        totalMonthlyRent: totalMonthlyRent._sum.monthlyRent || 0,
        totalMonthlyCashFlow,
        avgCapRate: capRates.length > 0 ? capRates.reduce((sum, rate) => sum + rate, 0) / capRates.length : 0,
        occupancyRate: totalRentals > 0 ? (leasedRentals / totalRentals) * 100 : 0,
      };
    }

    return NextResponse.json({ stats, investorType });
  } catch (error) {
    console.error('Error fetching investor stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
