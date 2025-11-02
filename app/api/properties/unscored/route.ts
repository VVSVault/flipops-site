import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Basic authentication via API key in header
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.FO_API_KEY || process.env.FLIPOPS_API_KEY;

    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch unscored properties (where score is null)
    const properties = await prisma.property.findMany({
      where: {
        score: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(limit, 100), // Cap at 100
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.property.count({
      where: {
        score: null,
      },
    });

    // Transform to match n8n workflow expectations
    const formattedProperties = properties.map(prop => ({
      id: prop.id,
      type: 'property',
      source: prop.dataSource,
      property: {
        address1: prop.address,
        city: prop.city,
        state: prop.state,
        zip: prop.zip,
        county: prop.county,
        apn: prop.apn,
        ownerName: prop.ownerName,
        propertyType: prop.propertyType,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        squareFeet: prop.squareFeet,
        lotSize: prop.lotSize,
        yearBuilt: prop.yearBuilt,
      },
      flags: {
        foreclosure: prop.foreclosure,
        preForeclosure: prop.preForeclosure,
        taxDelinquent: prop.taxDelinquent,
        vacant: prop.vacant,
        bankruptcy: prop.bankruptcy,
        absenteeOwner: prop.absenteeOwner,
      },
      financial: {
        assessedValue: prop.assessedValue,
        taxAmount: prop.taxAmount,
        lastSaleDate: prop.lastSaleDate,
        lastSalePrice: prop.lastSalePrice,
        estimatedValue: prop.estimatedValue,
      },
      metadata: {
        scrapeUrl: null,
        recordedAt: prop.createdAt.toISOString(),
        ingestedAt: prop.createdAt.toISOString(),
        raw: prop.metadata ? JSON.parse(prop.metadata) : null,
      },
    }));

    console.log(`[GET /api/properties/unscored] Returning ${formattedProperties.length} unscored properties (total: ${total})`);

    return NextResponse.json({
      success: true,
      data: formattedProperties,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + properties.length < total,
      },
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error('[GET /api/properties/unscored Error]', error);

    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
