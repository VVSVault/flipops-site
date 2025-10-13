import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Debug endpoint to get bid IDs for testing
// Only enabled in development
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  const safeBids = await prisma.bid.findMany({
    where: {
      dealId: 'SAFE_DEAL_001',
      status: 'pending'
    },
    select: {
      id: true,
      vendorId: true,
      subtotal: true
    }
  });

  const riskyBids = await prisma.bid.findMany({
    where: {
      dealId: 'RISKY_DEAL_001',
      status: 'pending'
    },
    select: {
      id: true,
      vendorId: true,
      subtotal: true
    }
  });

  return NextResponse.json({
    safe: {
      dealId: 'SAFE_DEAL_001',
      bids: safeBids,
      count: safeBids.length,
      firstId: safeBids[0]?.id || null
    },
    risky: {
      dealId: 'RISKY_DEAL_001',
      bids: riskyBids,
      count: riskyBids.length,
      firstId: riskyBids[0]?.id || null
    },
    testCommand: {
      safe: safeBids[0] ?
        `curl -X POST http://localhost:3000/api/bids/award -H "Content-Type: application/json" -d '{"dealId":"SAFE_DEAL_001","winningBidId":"${safeBids[0].id}"}'` :
        'No safe bids found',
      risky: riskyBids[0] ?
        `curl -X POST http://localhost:3000/api/bids/award -H "Content-Type: application/json" -d '{"dealId":"RISKY_DEAL_001","winningBidId":"${riskyBids[0].id}"}'` :
        'No risky bids found'
    }
  });
}