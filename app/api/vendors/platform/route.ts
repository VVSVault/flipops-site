import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { VendorCategory, VendorStatus } from '@prisma/client';

/**
 * GET /api/vendors/platform
 * Browse platform vendors in a market
 * Query params:
 *   - marketId: required - the market to search in
 *   - category: filter by trade category (e.g., "ROOFER", "PLUMBER")
 *   - search: search by name or description
 *   - minRating: minimum source rating (1-5)
 *   - verified: filter by verified status (true/false)
 *   - page: page number (default 1)
 *   - limit: results per page (default 20, max 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user to check for existing relationships
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const marketId = searchParams.get('marketId');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const minRating = searchParams.get('minRating');
    const verified = searchParams.get('verified');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    if (!marketId) {
      return NextResponse.json(
        { error: 'marketId is required' },
        { status: 400 }
      );
    }

    const where: any = {
      marketId,
      status: VendorStatus.ACTIVE,
      deletedAt: null,
    };

    // Filter by category
    if (category && Object.values(VendorCategory).includes(category as VendorCategory)) {
      where.categories = { has: category as VendorCategory };
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Minimum rating filter
    if (minRating) {
      where.sourceRating = { gte: parseFloat(minRating) };
    }

    // Verified filter
    if (verified !== null && verified !== undefined) {
      where.isVerified = verified === 'true';
    }

    // Get total count for pagination
    const total = await prisma.platformVendor.count({ where });

    // Get vendors with pagination
    const vendors = await prisma.platformVendor.findMany({
      where,
      orderBy: [
        { isVerified: 'desc' },
        { sourceRating: 'desc' },
        { sourceReviewCount: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        market: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
      },
    });

    // Check which vendors the user has already added to their list
    const vendorIds = vendors.map(v => v.id);
    const existingRelationships = await prisma.userVendorRelationship.findMany({
      where: {
        userId: user.id,
        platformVendorId: { in: vendorIds },
      },
      select: {
        platformVendorId: true,
        id: true,
      },
    });

    const relationshipMap = new Map(
      existingRelationships.map(r => [r.platformVendorId, r.id])
    );

    // Add relationship info to response
    const vendorsWithRelationship = vendors.map(vendor => ({
      ...vendor,
      isInMyList: relationshipMap.has(vendor.id),
      relationshipId: relationshipMap.get(vendor.id) || null,
    }));

    return NextResponse.json({
      vendors: vendorsWithRelationship,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching platform vendors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
