import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { applyInvoiceAndComputeTiers } from '@/lib/budget';
import { writeEvent } from '@/lib/events';
import { logger } from '@/lib/logger';
import { API_RESPONSES } from '@/lib/constants';

// Request validation schema
const InvoiceIngestSchema = z.object({
  dealId: z.string().min(1, 'Deal ID is required'),
  trade: z.string().min(1, 'Trade is required'),
  amount: z.number().positive('Amount must be positive'),
  vendorId: z.string().min(1, 'Vendor ID is required'),
  docUrl: z.string().url().optional(),
  lineItemId: z.string().optional(),
  description: z.string().optional()
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = logger.child({ requestId, endpoint: '/api/invoices/ingest' });

  try {
    // Parse and validate request
    const body = await request.json();
    const validation = InvoiceIngestSchema.safeParse(body);

    if (!validation.success) {
      log.warn({ errors: validation.error.issues }, 'Validation failed');
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten(),
          requestId
        },
        { status: API_RESPONSES.VALIDATION_ERROR }
      );
    }

    const { dealId, trade, amount, vendorId, docUrl, lineItemId, description } = validation.data;
    log.info({ dealId, trade, amount, vendorId }, 'Processing invoice ingestion');

    // Load deal and vendor
    const [deal, vendor] = await Promise.all([
      prisma.dealSpec.findUnique({
        where: { id: dealId }
      }),
      prisma.vendor.findUnique({
        where: { id: vendorId }
      })
    ]);

    if (!deal) {
      log.warn({ dealId }, 'Deal not found');
      return NextResponse.json(
        { error: 'Deal not found', dealId, requestId },
        { status: 404 }
      );
    }

    if (!vendor) {
      log.warn({ vendorId }, 'Vendor not found');
      return NextResponse.json(
        { error: 'Vendor not found', vendorId, requestId },
        { status: 404 }
      );
    }

    // Get policy thresholds
    // For now, use default Miami/Standard policy or fallback values
    const policy = await prisma.policy.findFirst({
      where: { region: 'Miami', grade: 'Standard' }
    }) || {
      varianceTier1Pct: 3,
      varianceTier2Pct: 7
    };

    // Create invoice record
    const invoice = await prisma.invoice.create({
      data: {
        dealId,
        trade,
        amount,
        vendorId,
        docUrl,
        lineItemId,
        status: 'pending'
      }
    });

    log.info({ invoiceId: invoice.id }, 'Invoice created');

    // Apply invoice and compute variance tiers
    const tierDecision = await applyInvoiceAndComputeTiers({
      dealId,
      trade,
      amount,
      tier1Threshold: policy.varianceTier1Pct,
      tier2Threshold: policy.varianceTier2Pct
    });

    log.info({
      tier: tierDecision.tier,
      tradeVariance: tierDecision.tradeAnalysis.variancePct,
      totalVariance: tierDecision.overallAnalysis.totalVariancePct
    }, 'Variance computed');

    // Update invoice status based on tier
    const invoiceStatus = tierDecision.tier === 'TIER2' ? 'flagged' :
                          tierDecision.tier === 'TIER1' ? 'approved_with_warning' :
                          'approved';

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: invoiceStatus }
    });

    // Create event for audit trail
    const eventAction = tierDecision.tier === 'GREEN' ? 'APPROVE' :
                        tierDecision.tier === 'TIER1' ? 'FLAG_TIER1' :
                        'ESCALATE_TIER2';

    const eventId = await writeEvent({
      dealId,
      actor: 'system:G3',
      artifact: 'Invoice',
      action: eventAction,
      after: {
        invoiceId: invoice.id,
        trade,
        amount,
        vendorId,
        vendorName: vendor.name,
        tier: tierDecision.tier,
        tradeAnalysis: tierDecision.tradeAnalysis,
        overallAnalysis: tierDecision.overallAnalysis,
        actions: tierDecision.actions,
        recommendations: tierDecision.recommendations,
        thresholds: {
          tier1: policy.varianceTier1Pct,
          tier2: policy.varianceTier2Pct
        }
      }
    });

    // If TIER2, create additional event for COG simulation queue
    if (tierDecision.tier === 'TIER2') {
      await writeEvent({
        dealId,
        actor: 'system:G3',
        artifact: 'ChangeOrder',
        action: 'QUEUE_COG_SIMULATION',
        after: {
          triggeredBy: 'variance_tier2',
          invoiceId: invoice.id,
          trade,
          variancePct: tierDecision.tradeAnalysis.variancePct,
          totalVariancePct: tierDecision.overallAnalysis.totalVariancePct,
          priority: 'high'
        }
      });

      log.info('COG simulation queued for Tier 2 variance');
    }

    // Build response
    const response = {
      status: tierDecision.tier,
      invoiceId: invoice.id,
      trade,
      amount,
      vendor: {
        id: vendor.id,
        name: vendor.name
      },
      variance: {
        byTrade: {
          baseline: tierDecision.tradeAnalysis.baseline,
          committed: tierDecision.tradeAnalysis.committed,
          actuals: tierDecision.tradeAnalysis.actuals,
          variance: tierDecision.tradeAnalysis.variance,
          variancePct: tierDecision.tradeAnalysis.variancePct
        },
        overall: {
          baseline: tierDecision.overallAnalysis.totalBaseline,
          committed: tierDecision.overallAnalysis.totalCommitted,
          actuals: tierDecision.overallAnalysis.totalActuals,
          variance: tierDecision.overallAnalysis.totalVariance,
          variancePct: tierDecision.overallAnalysis.totalVariancePct
        }
      },
      thresholds: {
        tier1: policy.varianceTier1Pct,
        tier2: policy.varianceTier2Pct
      },
      actions: tierDecision.actions,
      recommendations: tierDecision.recommendations,
      eventId,
      requestId
    };

    // Return appropriate status code
    const statusCode = tierDecision.tier === 'TIER2' ? 202 : // Accepted but requires action
                       tierDecision.tier === 'TIER1' ? 200 : // OK with warning
                       200; // OK

    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    log.error({ error }, 'Invoice ingestion failed');
    return NextResponse.json(
      {
        error: 'Failed to process invoice',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId
      },
      { status: 500 }
    );
  }
}