import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ endpoint: '/api/deals/sync-all' });

/**
 * Bulk sync all active deals
 * This endpoint orchestrates the refresh of multiple deals
 */
export async function POST(req: NextRequest) {
  try {
    // Optional API key authentication
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.FO_API_KEY || process.env.FLIPOPS_API_KEY;

    if (expectedApiKey && apiKey && apiKey !== expectedApiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();

    // Get all active deals
    const approvedDealEvents = await prisma.event.findMany({
      where: {
        artifact: 'DealSpec',
        action: 'APPROVE',
        actor: 'system:G1'
      },
      select: { dealId: true },
      distinct: ['dealId']
    });

    const approvedDealIds = approvedDealEvents.map(e => e.dealId).filter(id => id !== null);

    const activeDeals = await prisma.dealSpec.findMany({
      where: {
        OR: [
          { id: { in: approvedDealIds } },
          {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        ]
      },
      select: {
        id: true,
        address: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'asc' }, // Sync oldest first
      take: 50 // Limit to prevent timeout
    });

    // Update timestamp for each deal to mark as synced
    const results = {
      success: [] as string[],
      failed: [] as { dealId: string; error: string }[],
    };

    for (const deal of activeDeals) {
      try {
        await prisma.dealSpec.update({
          where: { id: deal.id },
          data: { updatedAt: new Date() },
        });
        results.success.push(deal.id);
        log.info({ dealId: deal.id }, 'Deal synced successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.failed.push({ dealId: deal.id, error: errorMessage });
        log.error({ dealId: deal.id, error }, 'Failed to sync deal');
      }
    }

    const duration = Date.now() - startTime;

    log.info(
      {
        total: activeDeals.length,
        successful: results.success.length,
        failed: results.failed.length,
        duration,
      },
      'Bulk sync completed'
    );

    return NextResponse.json({
      success: true,
      summary: {
        total: activeDeals.length,
        successful: results.success.length,
        failed: results.failed.length,
        duration: `${duration}ms`,
      },
      results,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    log.error({ error }, 'Failed to sync deals');
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
