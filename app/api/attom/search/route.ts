import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ATTOM API Configuration
const ATTOM_API_KEY = process.env.ATTOM_API_KEY;
const ATTOM_API_BASE = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0';

const SearchSchema = z.object({
  zipCode: z.string().min(5).max(10),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  pageSize: z.number().min(1).max(50).default(20),
});

interface AttomProperty {
  identifier?: {
    attomId?: number | string;
    apn?: string;
    fips?: string;
  };
  address?: {
    line1?: string;
    locality?: string;
    countrySubd?: string;
    postal1?: string;
    oneLine?: string;
  };
  lot?: {
    lotsize1?: number;
  };
  building?: {
    rooms?: {
      beds?: number;
      bathstotal?: number;
    };
    size?: {
      livingsize?: number;
    };
    summary?: {
      yearbuilt?: number;
      propertyType?: string;
    };
  };
  assessment?: {
    assessed?: {
      taxyear?: number;
      owner?: {
        name?: string;
        mailingAddress?: string;
      };
    };
    market?: {
      mktttlvalue?: number;
    };
    tax?: {
      taxtotal?: number;
    };
  };
  sale?: {
    date?: {
      salerecdate?: string;
    };
    amount?: {
      saleamt?: number;
    };
  };
  avm?: {
    amount?: {
      value?: number;
    };
  };
}

/**
 * POST /api/attom/search
 * Search for properties in ATTOM by ZIP code
 */
export async function POST(request: NextRequest) {
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

    if (!ATTOM_API_KEY) {
      return NextResponse.json(
        { error: 'ATTOM API not configured. Please contact support.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validationResult = SearchSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { zipCode, minPrice, maxPrice, pageSize } = validationResult.data;

    // Build ATTOM API query
    const params = new URLSearchParams({
      postalcode: zipCode,
      pagesize: pageSize.toString(),
    });

    if (minPrice) {
      params.append('minsaleamt', minPrice.toString());
    }
    if (maxPrice) {
      params.append('maxsaleamt', maxPrice.toString());
    }

    const url = `${ATTOM_API_BASE}/sale/snapshot?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        apikey: ATTOM_API_KEY,
        accept: 'application/json',
      },
    });

    const data = await response.json();

    // Debug: Log raw ATTOM response to see what building data we're getting
    if (data.property?.length > 0) {
      console.log('[ATTOM Search] Sample raw property from API:', JSON.stringify(data.property[0], null, 2));
    }

    // ATTOM API returns 400 with "SuccessWithoutResult" when no properties found
    // This is not an error - just means no results
    if (!response.ok) {
      // Check if it's a "no results" response (ATTOM returns 400 for this)
      if (data?.status?.msg === 'SuccessWithoutResult' || data?.status?.total === 0) {
        return NextResponse.json({
          success: true,
          count: 0,
          properties: [],
          message: 'No properties found in this ZIP code',
        });
      }

      // Actual error
      console.error('ATTOM API error:', response.status, JSON.stringify(data));
      return NextResponse.json(
        { error: 'Failed to search ATTOM', details: data?.status?.msg || response.statusText },
        { status: response.status }
      );
    }

    const properties = data.property || [];

    // Transform ATTOM properties to our format
    const transformedProperties = properties.map((p: AttomProperty) => ({
      attomId: p.identifier?.attomId ? String(p.identifier.attomId) : null,
      apn: p.identifier?.apn || null,
      address: p.address?.line1 || p.address?.oneLine || '',
      city: p.address?.locality || '',
      state: p.address?.countrySubd || '',
      zip: p.address?.postal1 || zipCode,
      ownerName: p.assessment?.assessed?.owner?.name || null,
      mailingAddress: p.assessment?.assessed?.owner?.mailingAddress || null,
      propertyType: p.building?.summary?.propertyType || null,
      bedrooms: p.building?.rooms?.beds || null,
      bathrooms: p.building?.rooms?.bathstotal || null,
      squareFeet: p.building?.size?.livingsize || null,
      lotSize: p.lot?.lotsize1 || null,
      yearBuilt: p.building?.summary?.yearbuilt || null,
      assessedValue: p.assessment?.market?.mktttlvalue || null,
      taxAmount: p.assessment?.tax?.taxtotal || null,
      taxYear: p.assessment?.assessed?.taxyear || null,
      lastSaleDate: p.sale?.date?.salerecdate || null,
      lastSalePrice: p.sale?.amount?.saleamt || null,
      estimatedValue: p.avm?.amount?.value || null,
    })).filter((p: { address: string }) => p.address); // Only include properties with addresses

    return NextResponse.json({
      success: true,
      count: transformedProperties.length,
      properties: transformedProperties,
    });
  } catch (error) {
    console.error('ATTOM search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
