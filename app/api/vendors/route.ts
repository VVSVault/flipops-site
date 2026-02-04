import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserId } from '@/lib/auth-helpers';

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
    const authResult = await getAuthenticatedUserId();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const userId = authResult.userId!;

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

    // Parse trade for response - handle both JSON arrays and plain strings
    let trade: string[] = [];
    if (vendor.trade) {
      try {
        const parsed = JSON.parse(vendor.trade);
        trade = Array.isArray(parsed) ? parsed : [vendor.trade];
      } catch {
        trade = [vendor.trade];
      }
    }
    const formattedVendor = {
      ...vendor,
      trade,
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
    const authResult = await getAuthenticatedUserId();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const userId = authResult.userId!;

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const tradeFilter = searchParams.get('trade');
    const regionFilter = searchParams.get('region');

    const where: any = {
      userId, // Only return vendors owned by the current user
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

    // Parse trade for each vendor - handle both JSON arrays and plain strings
    const formattedVendors = vendors.map((vendor) => {
      let trade: string[] = [];
      try {
        if (vendor.trade) {
          // First check if it looks like JSON (starts with [ or ")
          if (vendor.trade.startsWith('[') || vendor.trade.startsWith('"')) {
            const parsed = JSON.parse(vendor.trade);
            trade = Array.isArray(parsed) ? parsed : [String(parsed)];
          } else {
            // Plain string - treat as single trade
            trade = [vendor.trade];
          }
        }
      } catch {
        // If anything fails, treat as single trade string
        trade = vendor.trade ? [vendor.trade] : [];
      }
      return {
        ...vendor,
        trade,
      };
    });

    return NextResponse.json({ vendors: formattedVendors });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
