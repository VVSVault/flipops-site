import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// NOTE: Use shared prisma singleton, never create new PrismaClient instances

/**
 * GET /api/properties/needs-skip-trace
 * Returns properties that:
 * - Have a high score (≥70)
 * - Don't have contact information yet
 * - Haven't been enriched
 */
export async function GET(req: NextRequest) {
  try {
    // API key authentication (required)
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
    const expectedApiKey = process.env.FO_API_KEY || process.env.FLIPOPS_API_KEY;

    // SECURITY: Check BOTH that expectedKey exists AND matches
    if (!expectedApiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const minScore = parseInt(searchParams.get('minScore') || '70');

    // Find properties that need skip tracing
    const properties = await prisma.property.findMany({
      where: {
        AND: [
          { score: { gte: minScore } },          // High score properties
          { enriched: false },                    // Not yet enriched
          {
            OR: [
              { phoneNumbers: null },             // No phone numbers
              { phoneNumbers: '' },               // Or empty phone numbers
              { emails: null },                   // No emails
              { emails: '' },                     // Or empty emails
            ],
          },
        ],
      },
      orderBy: [
        { score: 'desc' },                       // Highest scores first
        { createdAt: 'asc' },                    // Oldest first
      ],
      take: limit,
    });

    console.log(`[GET /api/properties/needs-skip-trace] Found ${properties.length} properties needing skip tracing`);

    return NextResponse.json({
      success: true,
      count: properties.length,
      data: properties.map(p => ({
        id: p.id,
        address: p.address,
        city: p.city,
        state: p.state,
        zip: p.zip,
        ownerName: p.ownerName,
        score: p.score,
        createdAt: p.createdAt,
      })),
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error('[GET /api/properties/needs-skip-trace Error]', error);

    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
  // NOTE: Do not call prisma.$disconnect() - uses shared singleton
}
