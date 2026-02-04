import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

/**
 * Helper to get userId from Clerk auth
 */
async function getAuthenticatedUserId() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return { error: 'Unauthorized', status: 401, userId: null };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    return { error: 'User not found', status: 404, userId: null };
  }

  return { error: null, status: null, userId: user.id };
}

/**
 * POST /api/campaigns
 * Create a new campaign
 * Body: {
 *   name: string,
 *   contractId?: string,
 *   subject?: string,
 *   message: string,
 *   method?: string,
 *   buyerIds?: string[],
 *   scheduledAt?: string,
 *   notes?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { error, status, userId } = await getAuthenticatedUserId();
    if (error) {
      return NextResponse.json({ error }, { status: status! });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: name, message' },
        { status: 400 }
      );
    }

    // Verify contract belongs to user if provided
    if (body.contractId) {
      const contract = await prisma.contract.findFirst({
        where: {
          id: body.contractId,
          userId,
        },
      });

      if (!contract) {
        return NextResponse.json(
          { error: 'Contract not found or does not belong to user' },
          { status: 404 }
        );
      }
    }

    // Calculate recipient count
    const buyerIds = body.buyerIds || [];
    const recipientCount = buyerIds.length;

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        userId,
        contractId: body.contractId || null,
        name: body.name,
        subject: body.subject || null,
        message: body.message,
        method: body.method || 'email',
        buyerIds: buyerIds.length > 0 ? JSON.stringify(buyerIds) : null,
        recipientCount,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        notes: body.notes || null,
        status: body.scheduledAt ? 'scheduled' : 'draft',
      },
      include: {
        contract: {
          include: {
            property: {
              select: {
                id: true,
                address: true,
                city: true,
                state: true,
              },
            },
          },
        },
      },
    });

    // Parse JSON fields for response
    const formattedCampaign = {
      ...campaign,
      buyerIds: campaign.buyerIds ? JSON.parse(campaign.buyerIds) : [],
    };

    return NextResponse.json({ campaign: formattedCampaign }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/campaigns
 * Get all campaigns for authenticated user
 * Query params:
 *   - status: filter by status (draft, scheduled, sent, cancelled)
 *   - contractId: filter by contract
 */
export async function GET(request: NextRequest) {
  try {
    const { error, status, userId } = await getAuthenticatedUserId();
    if (error) {
      return NextResponse.json({ error }, { status: status! });
    }

    const searchParams = request.nextUrl.searchParams;
    const campaignStatus = searchParams.get('status');
    const contractId = searchParams.get('contractId');

    const where: Record<string, unknown> = { userId };

    if (campaignStatus) {
      where.status = campaignStatus;
    }

    if (contractId) {
      where.contractId = contractId;
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        contract: {
          include: {
            property: {
              select: {
                id: true,
                address: true,
                city: true,
                state: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse JSON fields
    const formattedCampaigns = campaigns.map((campaign) => ({
      ...campaign,
      buyerIds: campaign.buyerIds ? JSON.parse(campaign.buyerIds) : [],
    }));

    return NextResponse.json({ campaigns: formattedCampaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
