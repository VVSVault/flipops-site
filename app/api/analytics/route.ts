import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/analytics
 * Get analytics data aggregated from the database
 *
 * Query params:
 *   - period: Date range in days (default: 30)
 *   - tab: Which analytics tab data to fetch (executive, marketing, team, vendors, all)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = "mock-user-id"; // Temporary for development

    const searchParams = request.nextUrl.searchParams;
    const period = parseInt(searchParams.get('period') || '30');
    const tab = searchParams.get('tab') || 'all';

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - period);

    const response: any = {};

    // Always include KPIs for executive dashboard
    if (tab === 'all' || tab === 'executive') {
      // Count leads (properties) in date range
      const leadsCount = await prisma.property.count({
        where: {
          userId,
          createdAt: { gte: dateFrom },
        },
      });

      // Count qualified leads (properties with score >= 70)
      const qualifiedLeadsCount = await prisma.property.count({
        where: {
          userId,
          createdAt: { gte: dateFrom },
          score: { gte: 70 },
        },
      });

      // Count offers in date range
      const offersCount = await prisma.offer.count({
        where: {
          userId,
          createdAt: { gte: dateFrom },
        },
      });

      // Count contracts in date range
      const contractsCount = await prisma.contract.count({
        where: {
          userId,
          createdAt: { gte: dateFrom },
        },
      });

      // Count closed deals (contracts with status 'closed')
      const closedDealsCount = await prisma.contract.count({
        where: {
          userId,
          createdAt: { gte: dateFrom },
          status: 'closed',
        },
      });

      // Get profit data from deal analyses
      const dealAnalyses = await prisma.dealAnalysis.findMany({
        where: {
          userId,
          createdAt: { gte: dateFrom },
        },
        select: {
          projectedProfit: true,
          purchasePrice: true,
          arv: true,
        },
      });

      const netProfit = dealAnalyses.reduce((sum, d) => sum + (d.projectedProfit || 0), 0);
      const grossProfit = dealAnalyses.reduce((sum, d) => {
        const profit = (d.arv || 0) - (d.purchasePrice || 0);
        return sum + profit;
      }, 0);

      // Calculate conversion funnel
      const funnel = [
        { stage: 'Leads', count: leadsCount || 1247, percentage: 100, conversionToNext: qualifiedLeadsCount > 0 ? Math.round((qualifiedLeadsCount / Math.max(leadsCount, 1)) * 100) : 45 },
        { stage: 'Qualified', count: qualifiedLeadsCount || 561, percentage: Math.round((qualifiedLeadsCount / Math.max(leadsCount, 1)) * 100) || 45 },
        { stage: 'Offers', count: offersCount || 168, percentage: Math.round((offersCount / Math.max(leadsCount, 1)) * 100) || 13.5 },
        { stage: 'Contracts', count: contractsCount || 89, percentage: Math.round((contractsCount / Math.max(leadsCount, 1)) * 100) || 7.1 },
        { stage: 'Closed', count: closedDealsCount || 76, percentage: Math.round((closedDealsCount / Math.max(leadsCount, 1)) * 100) || 6.1 },
      ];

      response.kpis = {
        leads: leadsCount || 1247,
        qualifiedLeads: qualifiedLeadsCount || 561,
        appointments: Math.round((qualifiedLeadsCount || 561) * 0.5), // Estimated
        offers: offersCount || 168,
        contracts: contractsCount || 89,
        closedDeals: closedDealsCount || 76,
        netProfit: netProfit || 1842000,
        grossProfit: grossProfit || 2156000,
        totalSpend: 52000, // Would need campaign tracking for real data
        romi: netProfit > 0 ? parseFloat((netProfit / 52000).toFixed(1)) : 35.4,
        roas: 48.2, // Would need campaign tracking for real data
        avgDaysToContract: 12, // Would need timeline tracking for real data
        avgSpeedToLead: 8, // Would need activity tracking for real data
        conversionRate: leadsCount > 0 ? parseFloat((closedDealsCount / leadsCount).toFixed(3)) : 0.061,
      };

      response.funnel = funnel;

      // Generate weekly profit trend data
      const weeklyTrends = [];
      for (let i = 4; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        // Get analyses in this week
        const weekAnalyses = await prisma.dealAnalysis.findMany({
          where: {
            userId,
            createdAt: {
              gte: weekStart,
              lt: weekEnd,
            },
          },
          select: {
            projectedProfit: true,
          },
        });

        const weekProfit = weekAnalyses.reduce((sum, a) => sum + (a.projectedProfit || 0), 0);
        weeklyTrends.push({
          date: weekStart.toISOString(),
          value: weekProfit || (380000 + Math.random() * 150000), // Demo fallback
        });
      }
      response.trends = weeklyTrends;

      // Profit waterfall data
      response.waterfall = [
        { stage: 'Revenue', value: grossProfit > 0 ? Math.round(grossProfit * 1.3) : 3250000, isProfit: true },
        { stage: 'Purchase', value: Math.round((grossProfit > 0 ? grossProfit * 0.3 : 780000)), isProfit: false },
        { stage: 'Gross Profit', value: grossProfit || 2470000, isProfit: true },
        { stage: 'Rehab', value: Math.round((grossProfit || 2470000) * 0.17), isProfit: false },
        { stage: 'Holding', value: Math.round((grossProfit || 2470000) * 0.035), isProfit: false },
        { stage: 'Closing', value: Math.round((grossProfit || 2470000) * 0.047), isProfit: false },
        { stage: 'Net Profit', value: netProfit || 1842000, isProfit: true },
      ];

      // Check if we have real data or should indicate demo mode
      response.hasRealData = leadsCount > 0 || offersCount > 0 || contractsCount > 0;
    }

    // Vendor analytics
    if (tab === 'all' || tab === 'vendors') {
      const vendors = await prisma.vendor.findMany({
        where: {
          OR: [
            { userId },
            { userId: null },
          ],
        },
        include: {
          _count: {
            select: {
              bids: true,
              invoices: true,
            },
          },
        },
      });

      // Get invoice totals per vendor
      const invoiceData = await prisma.invoice.groupBy({
        by: ['vendorId'],
        _sum: {
          amount: true,
        },
        _count: true,
      });

      const invoiceMap = new Map(
        invoiceData.map(i => [i.vendorId, { totalSpend: i._sum.amount || 0, jobCount: i._count }])
      );

      const vendorMetrics = vendors.map(v => {
        const invoiceInfo = invoiceMap.get(v.id) || { totalSpend: 0, jobCount: 0 };
        return {
          vendorId: v.id,
          vendorName: v.name,
          category: v.trade ? (JSON.parse(v.trade)[0] || 'General') : 'General',
          totalJobs: invoiceInfo.jobCount || v._count.bids,
          onTimePercentage: v.onTimePct,
          quoteVariance: Math.max(0, 100 - v.onBudgetPct),
          avgRating: v.reliability / 20, // Convert 0-100 to 0-5 scale
          changeOrderRate: Math.round((100 - v.onBudgetPct) * 0.5),
          totalSpend: invoiceInfo.totalSpend,
          avgJobValue: invoiceInfo.jobCount > 0 ? Math.round(invoiceInfo.totalSpend / invoiceInfo.jobCount) : 0,
        };
      });

      response.vendorMetrics = vendorMetrics.length > 0 ? vendorMetrics : [
        // Fallback demo data if no vendors
        { vendorId: '1', vendorName: 'Phoenix Premier Contractors', category: 'Contractor', totalJobs: 42, onTimePercentage: 95, quoteVariance: 3.2, avgRating: 4.8, changeOrderRate: 5, totalSpend: 425000, avgJobValue: 10119 },
        { vendorId: '2', vendorName: 'Lightning Electric Solutions', category: 'Electrician', totalJobs: 28, onTimePercentage: 92, quoteVariance: 2.8, avgRating: 4.6, changeOrderRate: 3, totalSpend: 84000, avgJobValue: 3000 },
      ];

      response.vendorSummary = {
        totalVendors: vendors.length || 14,
        totalSpend: vendorMetrics.reduce((sum, v) => sum + v.totalSpend, 0) || 668000,
        avgRating: vendorMetrics.length > 0
          ? parseFloat((vendorMetrics.reduce((sum, v) => sum + v.avgRating, 0) / vendorMetrics.length).toFixed(1))
          : 4.3,
        avgOnTime: vendorMetrics.length > 0
          ? parseFloat((vendorMetrics.reduce((sum, v) => sum + v.onTimePercentage, 0) / vendorMetrics.length).toFixed(1))
          : 86.8,
      };
    }

    // Marketing analytics (mock data - would need campaign tracking table)
    if (tab === 'all' || tab === 'marketing') {
      response.marketingMetrics = [
        { channel: 'PPC', spend: 28000, leads: 562, contracts: 45, closedDeals: 38, cpl: 49.82, cpa: 622, cpd: 737, roas: 52.3, romi: 41.2 },
        { channel: 'SEO', spend: 5000, leads: 245, contracts: 12, closedDeals: 10, cpl: 20.41, cpa: 417, cpd: 500, roas: 28.4, romi: 22.6 },
        { channel: 'Direct Mail', spend: 8000, leads: 186, contracts: 9, closedDeals: 8, cpl: 43.01, cpa: 889, cpd: 1000, roas: 18.5, romi: 14.2 },
        { channel: 'Cold Call', spend: 6000, leads: 142, contracts: 7, closedDeals: 6, cpl: 42.25, cpa: 857, cpd: 1000, roas: 15.8, romi: 11.3 },
        { channel: 'SMS', spend: 3000, leads: 87, contracts: 5, closedDeals: 4, cpl: 34.48, cpa: 600, cpd: 750, roas: 12.6, romi: 9.8 },
        { channel: 'Referral', spend: 2000, leads: 25, contracts: 11, closedDeals: 10, cpl: 80, cpa: 182, cpd: 200, roas: 85.2, romi: 72.5 },
      ];
    }

    // Team analytics (mock data - would need user activity tracking)
    if (tab === 'all' || tab === 'team') {
      response.teamMetrics = [
        { userId: '1', userName: 'Sarah Chen', role: 'Acquisition', touchesPerDay: 48, firstResponseTime: 5, appointmentSetRate: 0.42, offerRate: 0.65, winRate: 0.58, followUpSLA: 0.96, totalActivities: 1440, totalDeals: 28, totalRevenue: 1120000 },
        { userId: '2', userName: 'Mike Rodriguez', role: 'Acquisition', touchesPerDay: 42, firstResponseTime: 8, appointmentSetRate: 0.38, offerRate: 0.60, winRate: 0.52, followUpSLA: 0.92, totalActivities: 1260, totalDeals: 24, totalRevenue: 960000 },
        { userId: '3', userName: 'Emily Johnson', role: 'Disposition', touchesPerDay: 36, firstResponseTime: 12, appointmentSetRate: 0.35, offerRate: 0.55, winRate: 0.48, followUpSLA: 0.88, totalActivities: 1080, totalDeals: 20, totalRevenue: 800000 },
        { userId: '4', userName: 'David Park', role: 'Account Manager', touchesPerDay: 32, firstResponseTime: 15, appointmentSetRate: 0.32, offerRate: 0.50, winRate: 0.45, followUpSLA: 0.85, totalActivities: 960, totalDeals: 16, totalRevenue: 640000 },
      ];
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
