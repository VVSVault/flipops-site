import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/properties
 * Get all properties for authenticated user
 * Query params:
 *   - limit: number of properties to return
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Look up the database user by clerkId
    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = dbUser.id;

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const properties = await prisma.property.findMany({
      where: { userId },
      select: {
        id: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        county: true,
        propertyType: true,
        bedrooms: true,
        bathrooms: true,
        squareFeet: true,
        lotSize: true,
        yearBuilt: true,
        assessedValue: true,
        estimatedValue: true,
        lastSaleDate: true,
        lastSalePrice: true,
        listingDate: true,
        daysOnMarket: true,
        score: true,
        scoreBreakdown: true,
        dataSource: true,
        ownerName: true,
        enriched: true,
        phoneNumbers: true,
        emails: true,
        // Distress flags
        foreclosure: true,
        preForeclosure: true,
        taxDelinquent: true,
        vacant: true,
        bankruptcy: true,
        absenteeOwner: true,
        // Metadata (contains REAPI-specific data like equity, yearsOwned, etc.)
        metadata: true,
        createdAt: true,
      },
      orderBy: [
        { score: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return NextResponse.json({ properties });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
