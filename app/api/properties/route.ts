import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

/**
 * GET /api/properties
 * Get all properties for authenticated user
 * Query params:
 *   - limit: number of properties to return
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        propertyType: true,
        bedrooms: true,
        bathrooms: true,
        squareFeet: true,
        yearBuilt: true,
        assessedValue: true,
        estimatedValue: true,
        score: true,
        dataSource: true,
        ownerName: true,
        enriched: true,
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
