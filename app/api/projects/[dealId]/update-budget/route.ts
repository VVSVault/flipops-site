import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    // Optional API key validation
    const apiKey = request.headers.get('x-api-key');
    const expectedApiKey = process.env.FO_API_KEY || process.env.FLIPOPS_API_KEY;

    if (expectedApiKey && apiKey !== expectedApiKey) {
      console.log('API key mismatch or missing');
    }

    const { dealId } = await params;
    const body = await request.json();
    const { actualCost, trade } = body;

    // Verify deal exists
    const deal = await prisma.dealSpec.findUnique({
      where: { id: dealId },
      include: { budgetLedger: true },
    });

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found', dealId },
        { status: 404 }
      );
    }

    // Update budget ledger
    let budgetLedger = deal.budgetLedger;

    if (!budgetLedger) {
      // Create new budget ledger if it doesn't exist
      budgetLedger = await prisma.budgetLedger.create({
        data: {
          dealId: dealId,
          baseline: JSON.stringify({}),
          committed: JSON.stringify({}),
          actuals: JSON.stringify({ [trade]: actualCost }),
          variance: JSON.stringify({}),
          contingencyRemaining: 0,
        },
      });
    } else {
      // Update existing actuals
      const actuals = JSON.parse(budgetLedger.actuals);
      actuals[trade] = actualCost;

      await prisma.budgetLedger.update({
        where: { dealId: dealId },
        data: {
          actuals: JSON.stringify(actuals),
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      dealId,
      trade,
      actualCost,
      message: 'Budget updated successfully',
    });
  } catch (error) {
    console.error('Error updating budget:', error);
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    );
  }
}
