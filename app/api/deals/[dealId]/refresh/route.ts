import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ endpoint: '/api/deals/[dealId]/refresh' });

/**
 * Refresh deal data from external source (e.g., HubSpot)
 * This endpoint simulates fetching updated data and updating the local database
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    // Optional API key authentication
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.FO_API_KEY || process.env.FLIPOPS_API_KEY;

    if (expectedApiKey && apiKey && apiKey !== expectedApiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dealId } = await params;

    // Find the existing deal
    const existingDeal = await prisma.dealSpec.findUnique({
      where: { id: dealId },
      include: {
        budgetLedger: true,
        scopeNodes: true,
        bids: true,
        changeOrders: true,
        events: true,
      },
    });

    if (!existingDeal) {
      return NextResponse.json(
        { error: 'Deal not found', dealId },
        { status: 404 }
      );
    }

    // TODO: In production, fetch updated data from HubSpot API here
    // For now, we'll simulate a refresh by updating the updatedAt timestamp
    // and optionally accept body data for testing purposes

    const body = await req.json().catch(() => ({}));
    const updates: any = {};

    // Allow updating specific fields if provided in request body
    if (body.maxExposureUsd !== undefined) updates.maxExposureUsd = body.maxExposureUsd;
    if (body.targetRoiPct !== undefined) updates.targetRoiPct = body.targetRoiPct;
    if (body.arv !== undefined) updates.arv = body.arv;
    if (body.region !== undefined) updates.region = body.region;
    if (body.grade !== undefined) updates.grade = body.grade;
    if (body.startAt !== undefined) updates.startAt = new Date(body.startAt);
    if (body.dailyBurnUsd !== undefined) updates.dailyBurnUsd = body.dailyBurnUsd;

    // Always update the timestamp
    updates.updatedAt = new Date();

    // Update the deal
    const updatedDeal = await prisma.dealSpec.update({
      where: { id: dealId },
      data: updates,
      include: {
        budgetLedger: true,
      },
    });

    log.info({ dealId, updates: Object.keys(updates) }, 'Deal refreshed successfully');

    return NextResponse.json({
      success: true,
      dealId: updatedDeal.id,
      address: updatedDeal.address,
      updatedFields: Object.keys(updates).filter(k => k !== 'updatedAt'),
      updatedAt: updatedDeal.updatedAt.toISOString(),
      message: 'Deal data refreshed successfully',
    }, { status: 200 });

  } catch (error) {
    log.error({ error }, 'Failed to refresh deal data');
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
