import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/properties/[id]
 * Get a single property by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = "mock-user-id"; // Temporary for CSS debugging

    const { id } = await params;

    const property = await prisma.property.findFirst({
      where: {
        id,
        userId, // Ensure user can only access their own properties
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/properties/[id]
 * Update a property's outreach tracking fields
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = "mock-user-id"; // Temporary for CSS debugging

    const { id } = await params;
    const body = await request.json();

    // Verify the property belongs to the user
    const existing = await prisma.property.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Allowed fields for update (outreach tracking only)
    const allowedFields = [
      'outreachStatus',
      'lastContactDate',
      'lastContactMethod',
      'ownerResponse',
      'nextFollowUpDate',
      'sentiment',
      'offerAmount',
      'offerDate',
      'offerStatus',
    ];

    // Filter body to only include allowed fields
    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Update the property
    const updated = await prisma.property.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/properties/[id]
 * Delete a property
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = "mock-user-id"; // Temporary for CSS debugging

    const { id } = await params;

    // Verify the property belongs to the user
    const existing = await prisma.property.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    await prisma.property.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
