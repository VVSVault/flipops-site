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
 * GET /api/campaigns/[id]
 * Get a single campaign
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, status, userId } = await getAuthenticatedUserId();
    if (error) {
      return NextResponse.json({ error }, { status: status! });
    }

    const { id } = await params;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId,
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
                zip: true,
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields
    const formattedCampaign = {
      ...campaign,
      buyerIds: campaign.buyerIds ? JSON.parse(campaign.buyerIds) : [],
    };

    return NextResponse.json({ campaign: formattedCampaign });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/campaigns/[id]
 * Update a campaign
 * Body: Any fields to update
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, status, userId } = await getAuthenticatedUserId();
    if (error) {
      return NextResponse.json({ error }, { status: status! });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify campaign belongs to user
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.message !== undefined) updateData.message = body.message;
    if (body.method !== undefined) updateData.method = body.method;
    if (body.notes !== undefined) updateData.notes = body.notes;

    if (body.buyerIds !== undefined) {
      updateData.buyerIds = Array.isArray(body.buyerIds)
        ? JSON.stringify(body.buyerIds)
        : body.buyerIds;
      updateData.recipientCount = Array.isArray(body.buyerIds)
        ? body.buyerIds.length
        : 0;
    }

    if (body.scheduledAt !== undefined) {
      updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    }

    // Status updates with timestamps
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'sent') {
        updateData.sentAt = new Date();
      }
    }

    // Performance metrics updates
    if (body.openCount !== undefined) updateData.openCount = body.openCount;
    if (body.clickCount !== undefined) updateData.clickCount = body.clickCount;
    if (body.replyCount !== undefined) updateData.replyCount = body.replyCount;
    if (body.offerCount !== undefined) updateData.offerCount = body.offerCount;

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
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

    // Parse JSON fields
    const formattedCampaign = {
      ...updatedCampaign,
      buyerIds: updatedCampaign.buyerIds ? JSON.parse(updatedCampaign.buyerIds) : [],
    };

    return NextResponse.json({ campaign: formattedCampaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/campaigns/[id]
 * Delete a campaign
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, status, userId } = await getAuthenticatedUserId();
    if (error) {
      return NextResponse.json({ error }, { status: status! });
    }

    const { id } = await params;

    // Verify campaign belongs to user
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Don't allow deleting sent campaigns
    if (existingCampaign.status === 'sent') {
      return NextResponse.json(
        { error: 'Cannot delete a sent campaign' },
        { status: 400 }
      );
    }

    await prisma.campaign.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
