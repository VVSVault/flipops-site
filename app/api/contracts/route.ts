import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// POST /api/contracts
// Create a contract from an accepted offer
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { offerId, closingDate, notes } = body;

    if (!offerId) {
      return NextResponse.json({ error: 'offerId is required' }, { status: 400 });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the offer and verify it belongs to the user
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        property: true,
      },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    if (offer.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to access this offer' }, { status: 403 });
    }

    // Verify offer is accepted
    if (offer.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Can only create contracts from accepted offers' },
        { status: 400 }
      );
    }

    // Check if contract already exists for this offer
    const existingContract = await prisma.contract.findUnique({
      where: { offerId },
    });

    if (existingContract) {
      return NextResponse.json(
        { error: 'Contract already exists for this offer' },
        { status: 400 }
      );
    }

    // Create the contract
    const contract = await prisma.contract.create({
      data: {
        userId: user.id,
        propertyId: offer.propertyId,
        offerId: offer.id,
        purchasePrice: offer.amount,
        closingDate: closingDate ? new Date(closingDate) : null,
        notes: notes || null,
        status: 'pending',
      },
      include: {
        property: true,
        offer: true,
      },
    });

    return NextResponse.json({
      success: true,
      contract: {
        id: contract.id,
        propertyId: contract.propertyId,
        offerId: contract.offerId,
        purchasePrice: contract.purchasePrice,
        status: contract.status,
        closingDate: contract.closingDate,
        signedAt: contract.signedAt,
        escrowOpenedAt: contract.escrowOpenedAt,
        closedAt: contract.closedAt,
        notes: contract.notes,
        createdAt: contract.createdAt,
        property: contract.property,
        offer: contract.offer,
      },
    });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
  }
}

// GET /api/contracts
// List all contracts for the current user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all contracts for this user
    const contracts = await prisma.contract.findMany({
      where: { userId: user.id },
      include: {
        property: true,
        offer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      contracts: contracts.map((contract) => ({
        id: contract.id,
        propertyId: contract.propertyId,
        offerId: contract.offerId,
        purchasePrice: contract.purchasePrice,
        status: contract.status,
        closingDate: contract.closingDate,
        signedAt: contract.signedAt,
        escrowOpenedAt: contract.escrowOpenedAt,
        closedAt: contract.closedAt,
        notes: contract.notes,
        documentUrls: contract.documentUrls ? JSON.parse(contract.documentUrls) : [],
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
        property: {
          id: contract.property.id,
          address: contract.property.address,
          city: contract.property.city,
          state: contract.property.state,
          zip: contract.property.zip,
        },
        offer: {
          id: contract.offer.id,
          amount: contract.offer.amount,
          status: contract.offer.status,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}
