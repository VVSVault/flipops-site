import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

/**
 * PATCH /api/buyers/[id]
 * Update a buyer
 * Body: Any buyer fields to update
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify buyer belongs to user
    const existingBuyer = await prisma.buyer.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingBuyer) {
      return NextResponse.json(
        { error: 'Buyer not found or does not belong to user' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.company !== undefined) updateData.company = body.company;
    if (body.propertyTypes !== undefined) {
      updateData.propertyTypes = body.propertyTypes ? JSON.stringify(body.propertyTypes) : null;
    }
    if (body.minPrice !== undefined) updateData.minPrice = body.minPrice;
    if (body.maxPrice !== undefined) updateData.maxPrice = body.maxPrice;
    if (body.targetMarkets !== undefined) {
      updateData.targetMarkets = body.targetMarkets ? JSON.stringify(body.targetMarkets) : null;
    }
    if (body.cashBuyer !== undefined) updateData.cashBuyer = body.cashBuyer;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.dealsClosed !== undefined) updateData.dealsClosed = body.dealsClosed;
    if (body.totalRevenue !== undefined) updateData.totalRevenue = body.totalRevenue;
    if (body.reliability !== undefined) updateData.reliability = body.reliability;

    // Update buyer
    const buyer = await prisma.buyer.update({
      where: { id },
      data: updateData,
    });

    // Parse JSON fields for response
    const formattedBuyer = {
      ...buyer,
      propertyTypes: buyer.propertyTypes ? JSON.parse(buyer.propertyTypes) : null,
      targetMarkets: buyer.targetMarkets ? JSON.parse(buyer.targetMarkets) : null,
    };

    return NextResponse.json({ buyer: formattedBuyer });
  } catch (error) {
    console.error('Error updating buyer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/buyers/[id]
 * Delete a buyer
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify buyer belongs to user
    const existingBuyer = await prisma.buyer.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingBuyer) {
      return NextResponse.json(
        { error: 'Buyer not found or does not belong to user' },
        { status: 404 }
      );
    }

    // Check if buyer has any assignments
    const assignmentCount = await prisma.contractAssignment.count({
      where: { buyerId: id },
    });

    if (assignmentCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete buyer with ${assignmentCount} active assignment(s)` },
        { status: 400 }
      );
    }

    // Delete buyer
    await prisma.buyer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting buyer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
