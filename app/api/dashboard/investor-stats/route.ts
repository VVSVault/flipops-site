import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/dashboard/investor-stats
 * Get investor-type-specific dashboard statistics
 *
 * Returns different stats based on investor type:
 * - Wholesaler: assignment stats, buyer metrics, fee tracking
 * - Flipper: renovation stats, ROI metrics, project timelines
 * - Buy-and-Hold: rental stats, cash flow, occupancy rates
 * - Hybrid: all of the above
 */
export async function GET() {
  try {
    const userId = "mock-user-id"; // Temporary for CSS debugging

    // Get user with investor type
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, investorType: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const dbUserId = user.id;
    const investorType = user.investorType;

    // Fetch stats based on investor type
    const stats: any = {};

    // Wholesaler stats
    if (investorType === 'wholesaler' || investorType === 'hybrid') {
      const [
        totalBuyers,
        activeAssignments,
        completedAssignments,
        totalRevenue,
        avgAssignmentFee,
      ] = await Promise.all([
        // Total buyers
        prisma.buyer.count({
          where: { userId: dbUserId },
        }),
        // Active assignments
        prisma.contractAssignment.count({
          where: {
            contract: { userId: dbUserId },
            status: { in: ['pending', 'in_progress'] },
          },
        }),
        // Completed assignments
        prisma.contractAssignment.count({
          where: {
            contract: { userId: dbUserId },
            status: 'completed',
          },
        }),
        // Total revenue from assignments
        prisma.contractAssignment.aggregate({
          where: {
            contract: { userId: dbUserId },
            status: 'completed',
            paid: true,
          },
          _sum: {
            assignmentFee: true,
          },
        }),
        // Average assignment fee
        prisma.contractAssignment.aggregate({
          where: {
            contract: { userId: dbUserId },
          },
          _avg: {
            assignmentFee: true,
          },
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
      const [
        totalRenovations,
        activeRenovations,
        completedRenovations,
        totalBudget,
        avgROI,
      ] = await Promise.all([
        // Total renovations
        prisma.dealSpec.count({
          where: {
            userId: dbUserId,
            propertyId: { not: null },
            contractId: { not: null },
          },
        }),
        // Active renovations
        prisma.dealSpec.count({
          where: {
            userId: dbUserId,
            propertyId: { not: null },
            contractId: { not: null },
            status: 'active',
          },
        }),
        // Completed renovations
        prisma.dealSpec.count({
          where: {
            userId: dbUserId,
            propertyId: { not: null },
            contractId: { not: null },
            status: 'completed',
          },
        }),
        // Total budget across all active renovations
        prisma.dealSpec.aggregate({
          where: {
            userId: dbUserId,
            propertyId: { not: null },
            contractId: { not: null },
            status: { in: ['planning', 'active'] },
          },
          _sum: {
            rehabBudget: true,
          },
        }),
        // Average ROI (ARV - purchase price - rehab / purchase price + rehab)
        prisma.dealSpec.findMany({
          where: {
            userId: dbUserId,
            propertyId: { not: null },
            contractId: { not: null },
            status: 'completed',
            arv: { not: null },
            purchasePrice: { not: null },
            rehabBudget: { not: null },
          },
          select: {
            arv: true,
            purchasePrice: true,
            rehabBudget: true,
          },
        }),
      ]);

      // Calculate average ROI
      let calculatedAvgROI = 0;
      if (avgROI.length > 0) {
        const totalROI = avgROI.reduce((sum, project) => {
          const arv = project.arv || 0;
          const purchase = project.purchasePrice || 0;
          const rehab = project.rehabBudget || 0;
          const totalCost = purchase + rehab;
          const roi = totalCost > 0 ? ((arv - totalCost) / totalCost) * 100 : 0;
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
      const [
        totalRentals,
        leasedRentals,
        vacantRentals,
        totalMonthlyRent,
        analyticsData,
      ] = await Promise.all([
        // Total rentals
        prisma.rental.count({
          where: { userId: dbUserId },
        }),
        // Leased rentals
        prisma.rental.count({
          where: { userId: dbUserId, status: 'leased' },
        }),
        // Vacant rentals
        prisma.rental.count({
          where: { userId: dbUserId, status: 'vacant' },
        }),
        // Total monthly rent
        prisma.rental.aggregate({
          where: { userId: dbUserId },
          _sum: {
            monthlyRent: true,
          },
        }),
        // Get full analytics for cash flow
        prisma.rental.findMany({
          where: { userId: dbUserId },
          select: {
            monthlyRent: true,
            mortgagePayment: true,
            propertyTax: true,
            insurance: true,
            hoa: true,
            utilities: true,
            maintenance: true,
            purchasePrice: true,
          },
        }),
      ]);

      // Calculate total monthly cash flow
      const totalMonthlyCashFlow = analyticsData.reduce((sum, rental) => {
        const expenses =
          (rental.mortgagePayment || 0) +
          (rental.propertyTax || 0) +
          (rental.insurance || 0) +
          (rental.hoa || 0) +
          (rental.utilities || 0) +
          (rental.maintenance || 0);
        return sum + (rental.monthlyRent - expenses);
      }, 0);

      // Calculate average cap rate
      const capRates = analyticsData
        .filter(r => r.purchasePrice && r.purchasePrice > 0)
        .map(r => {
          const annualIncome = r.monthlyRent * 12;
          const annualExpenses = (
            ((r.propertyTax || 0) * 12) +
            ((r.insurance || 0) * 12) +
            ((r.hoa || 0) * 12) +
            ((r.utilities || 0) * 12) +
            ((r.maintenance || 0) * 12)
          );
          const noi = annualIncome - annualExpenses;
          return (noi / r.purchasePrice!) * 100;
        });

      const avgCapRate = capRates.length > 0
        ? capRates.reduce((sum, rate) => sum + rate, 0) / capRates.length
        : 0;

      const occupancyRate = totalRentals > 0 ? (leasedRentals / totalRentals) * 100 : 0;

      stats.buyAndHold = {
        totalRentals,
        leasedRentals,
        vacantRentals,
        totalMonthlyRent: totalMonthlyRent._sum.monthlyRent || 0,
        totalMonthlyCashFlow,
        avgCapRate,
        occupancyRate,
      };
    }

    return NextResponse.json({ stats, investorType });
  } catch (error) {
    console.error('Error fetching investor stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
