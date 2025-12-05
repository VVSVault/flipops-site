import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/vendors
 * Create a new vendor
 * Body: {
 *   name: string (required),
 *   email?: string,
 *   phone?: string,
 *   trade: string (JSON array of trades),
 *   region?: string,
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = "mock-user-id"; // Temporary for development

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    // Create vendor
    const vendor = await prisma.vendor.create({
      data: {
        userId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        trade: body.trade ? JSON.stringify(body.trade) : JSON.stringify([]),
        region: body.region,
        onTimePct: body.onTimePct ?? 100,
        onBudgetPct: body.onBudgetPct ?? 100,
        reliability: body.reliability ?? 100,
      },
    });

    // Parse trade for response
    const formattedVendor = {
      ...vendor,
      trade: vendor.trade ? JSON.parse(vendor.trade) : [],
    };

    return NextResponse.json({ vendor: formattedVendor }, { status: 201 });
  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vendors
 * Get all vendors for authenticated user
 * Query params:
 *   - search: filter by name, email, or trade
 *   - trade: filter by specific trade (e.g., "roofing")
 *   - region: filter by region
 */
export async function GET(request: NextRequest) {
  try {
    const userId = "mock-user-id"; // Temporary for development

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const tradeFilter = searchParams.get('trade');
    const regionFilter = searchParams.get('region');

    const where: any = {
      OR: [
        { userId },
        { userId: null }, // Include platform/shared vendors
      ],
    };

    // Add search filter
    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { trade: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    // Add trade filter
    if (tradeFilter) {
      if (where.AND) {
        where.AND.push({ trade: { contains: tradeFilter, mode: 'insensitive' } });
      } else {
        where.AND = [{ trade: { contains: tradeFilter, mode: 'insensitive' } }];
      }
    }

    // Add region filter
    if (regionFilter) {
      if (where.AND) {
        where.AND.push({ region: { contains: regionFilter, mode: 'insensitive' } });
      } else {
        where.AND = [{ region: { contains: regionFilter, mode: 'insensitive' } }];
      }
    }

    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        _count: {
          select: {
            bids: true,
            invoices: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Parse trade for each vendor
    const formattedVendors = vendors.map((vendor) => ({
      ...vendor,
      trade: vendor.trade ? JSON.parse(vendor.trade) : [],
    }));

    return NextResponse.json({ vendors: formattedVendors });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
