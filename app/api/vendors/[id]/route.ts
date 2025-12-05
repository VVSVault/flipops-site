import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/vendors/[id]
 * Get a single vendor with related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = "mock-user-id"; // Temporary for development
    const { id } = await params;

    const vendor = await prisma.vendor.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { userId: null }, // Include platform vendors
        ],
      },
      include: {
        _count: {
          select: {
            bids: true,
            invoices: true,
          },
        },
        bids: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        invoices: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Parse trade
    const formattedVendor = {
      ...vendor,
      trade: vendor.trade ? JSON.parse(vendor.trade) : [],
    };

    return NextResponse.json({ vendor: formattedVendor });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/vendors/[id]
 * Update a vendor
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = "mock-user-id"; // Temporary for development
    const { id } = await params;
    const body = await request.json();

    // Verify vendor belongs to user (or is editable)
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        id,
        userId, // Only allow editing user's own vendors
      },
    });

    if (!existingVendor) {
      return NextResponse.json(
        { error: 'Vendor not found or not editable' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.trade !== undefined) {
      updateData.trade = body.trade ? JSON.stringify(body.trade) : null;
    }
    if (body.region !== undefined) updateData.region = body.region;
    if (body.onTimePct !== undefined) updateData.onTimePct = body.onTimePct;
    if (body.onBudgetPct !== undefined) updateData.onBudgetPct = body.onBudgetPct;
    if (body.reliability !== undefined) updateData.reliability = body.reliability;

    // Update vendor
    const vendor = await prisma.vendor.update({
      where: { id },
      data: updateData,
    });

    // Parse trade for response
    const formattedVendor = {
      ...vendor,
      trade: vendor.trade ? JSON.parse(vendor.trade) : [],
    };

    return NextResponse.json({ vendor: formattedVendor });
  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vendors/[id]
 * Delete a vendor
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = "mock-user-id"; // Temporary for development
    const { id } = await params;

    // Verify vendor belongs to user
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        id,
        userId, // Only allow deleting user's own vendors
      },
    });

    if (!existingVendor) {
      return NextResponse.json(
        { error: 'Vendor not found or not deletable' },
        { status: 404 }
      );
    }

    // Check for associated bids/invoices
    const bidCount = await prisma.bid.count({
      where: { vendorId: id },
    });

    const invoiceCount = await prisma.invoice.count({
      where: { vendorId: id },
    });

    if (bidCount > 0 || invoiceCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete vendor with ${bidCount} bid(s) and ${invoiceCount} invoice(s)` },
        { status: 400 }
      );
    }

    // Delete vendor
    await prisma.vendor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
