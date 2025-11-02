import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';

// Schema for property data from n8n
const PropertySchema = z.object({
  // Core Property Info
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  county: z.string().optional(),
  apn: z.string().optional(), // Assessor Parcel Number

  // Owner Information
  ownerName: z.string(),
  mailingAddress: z.string().optional(),
  ownerType: z.enum(['individual', 'corporate', 'trust', 'estate']).optional(),

  // Property Details
  propertyType: z.enum(['single_family', 'multi_family', 'condo', 'townhouse', 'land', 'commercial']).optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  squareFeet: z.number().optional(),
  lotSize: z.number().optional(),
  yearBuilt: z.number().optional(),

  // Financial Data
  assessedValue: z.number().optional(),
  taxAmount: z.number().optional(),
  lastSaleDate: z.string().optional(),
  lastSalePrice: z.number().optional(),
  estimatedValue: z.number().optional(),

  // Status Indicators
  preForeclosure: z.boolean().optional(),
  foreclosure: z.boolean().optional(),
  bankruptcy: z.boolean().optional(),
  taxDelinquent: z.boolean().optional(),
  vacant: z.boolean().optional(),
  absenteeOwner: z.boolean().optional(),

  // Contact Information (from skip tracing)
  phoneNumbers: z.array(z.string()).optional(),
  emails: z.array(z.string()).optional(),

  // Source Information
  dataSource: z.string(),
  sourceId: z.string().optional(),
  importedAt: z.string().optional(),

  // Custom Fields
  metadata: z.record(z.any()).optional(),
});

const WebhookPayloadSchema = z.object({
  type: z.enum(['property', 'lead', 'update', 'batch']),
  action: z.enum(['create', 'update', 'enrich']),
  data: z.union([
    PropertySchema,
    z.array(PropertySchema),
  ]),
  workflowId: z.string().optional(),
  workflowName: z.string().optional(),
  executionId: z.string().optional(),
  timestamp: z.string().optional(),
});

// Verify webhook signature for security
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Process individual property record
async function processProperty(property: z.infer<typeof PropertySchema>) {
  // Calculate property score based on various factors (0-100 scale)
  let score = 50; // Base score

  // Distress indicators add to score
  if (property.preForeclosure) score += 20;
  if (property.foreclosure) score += 25;
  if (property.taxDelinquent) score += 15;
  if (property.vacant) score += 10;
  if (property.absenteeOwner) score += 5;

  // Cap score at 100
  score = Math.min(score, 100);

  // Calculate potential profit (simplified)
  const arv = property.estimatedValue || 0;
  const purchasePrice = property.lastSalePrice || arv * 0.7;
  const repairCosts = arv * 0.15; // Assume 15% for repairs
  const potentialProfit = arv - purchasePrice - repairCosts;

  return {
    ...property,
    score,
    potentialProfit,
    processedAt: new Date().toISOString(),
    status: 'new',
  };
}

export async function POST(req: NextRequest) {
  try {
    // Get webhook secret from environment (using existing FO_WEBHOOK_SECRET from Railway setup)
    const webhookSecret = process.env.FO_WEBHOOK_SECRET;

    // Basic authentication via API key in header (using existing FO_API_KEY)
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.FO_API_KEY || process.env.FLIPOPS_API_KEY;

    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get raw body for signature verification
    const rawBody = await req.text();

    // Verify signature if secret is configured AND signature is provided
    const signature = req.headers.get('x-n8n-signature');
    if (webhookSecret && signature) {
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse and validate payload
    const body = JSON.parse(rawBody);
    const payload = WebhookPayloadSchema.parse(body);

    // Process based on webhook type
    const results = [];

    if (payload.type === 'property') {
      // Handle single or batch property imports
      const properties = Array.isArray(payload.data) ? payload.data : [payload.data];

      for (const property of properties) {
        try {
          const processed = await processProperty(property);

          // Save to database via Prisma
          const { PrismaClient } = await import('@prisma/client');
          const prisma = new PrismaClient();

          try {
            await prisma.property.upsert({
              where: {
                address_city_state_zip: {
                  address: processed.address,
                  city: processed.city,
                  state: processed.state,
                  zip: processed.zip,
                },
              },
              create: {
                address: processed.address,
                city: processed.city,
                state: processed.state,
                zip: processed.zip,
                county: processed.county,
                apn: processed.apn,
                ownerName: processed.ownerName,
                propertyType: processed.propertyType,
                bedrooms: processed.bedrooms,
                bathrooms: processed.bathrooms,
                squareFeet: processed.squareFeet,
                lotSize: processed.lotSize,
                yearBuilt: processed.yearBuilt,
                assessedValue: processed.assessedValue,
                taxAmount: processed.taxAmount,
                lastSaleDate: processed.lastSaleDate,
                lastSalePrice: processed.lastSalePrice,
                estimatedValue: processed.estimatedValue,
                foreclosure: processed.foreclosure || false,
                preForeclosure: processed.preForeclosure || false,
                taxDelinquent: processed.taxDelinquent || false,
                vacant: processed.vacant || false,
                bankruptcy: processed.bankruptcy || false,
                absenteeOwner: processed.absenteeOwner || false,
                phoneNumbers: processed.phoneNumbers ? JSON.stringify(processed.phoneNumbers) : null,
                emails: processed.emails ? JSON.stringify(processed.emails) : null,
                dataSource: processed.dataSource,
                sourceId: processed.sourceId,
                metadata: processed.metadata ? JSON.stringify(processed.metadata) : null,
                // Don't set score yet - let the scoring workflow handle that
              },
              update: {
                // Update existing property with new data (but don't overwrite score)
                ownerName: processed.ownerName,
                propertyType: processed.propertyType,
                bedrooms: processed.bedrooms,
                bathrooms: processed.bathrooms,
                squareFeet: processed.squareFeet,
                lotSize: processed.lotSize,
                yearBuilt: processed.yearBuilt,
                assessedValue: processed.assessedValue,
                taxAmount: processed.taxAmount,
                lastSaleDate: processed.lastSaleDate,
                lastSalePrice: processed.lastSalePrice,
                estimatedValue: processed.estimatedValue,
                foreclosure: processed.foreclosure || false,
                preForeclosure: processed.preForeclosure || false,
                taxDelinquent: processed.taxDelinquent || false,
                vacant: processed.vacant || false,
                bankruptcy: processed.bankruptcy || false,
                absenteeOwner: processed.absenteeOwner || false,
                phoneNumbers: processed.phoneNumbers ? JSON.stringify(processed.phoneNumbers) : null,
                emails: processed.emails ? JSON.stringify(processed.emails) : null,
                metadata: processed.metadata ? JSON.stringify(processed.metadata) : null,
                updatedAt: new Date(),
              },
            });
            await prisma.$disconnect();

            results.push({
              success: true,
              address: processed.address,
              score: null, // Score will be calculated by scoring workflow
              potentialProfit: null,
            });
          } catch (dbError) {
            console.error('Failed to save property to database:', dbError);
            await prisma.$disconnect();
            throw dbError;
          }

          // TODO: Queue for enrichment if needed
          // if (!property.phoneNumbers?.length) {
          //   await skipTraceQueue.add('enrich', { propertyId: processed.id });
          // }

          // Handle high-score properties
          if (processed.score >= 80) {
            console.log(`🔥 HIGH-SCORE ALERT: ${processed.address} (Score: ${processed.score})`);

            // Trigger immediate notifications for ultra-hot leads
            if (processed.score >= 95) {
              console.log(`🚨 URGENT - ULTRA HOT LEAD: ${processed.address}`);
              // TODO: Send SMS via Twilio
              // TODO: Send immediate Slack alert
              // TODO: Create urgent task in CRM
            }

            // Auto-enrich high-value properties
            if (processed.score >= 85 && !property.phoneNumbers?.length) {
              console.log(`📞 Queuing skip trace for: ${processed.address}`);
              // TODO: Queue for immediate skip tracing
            }
          }

        } catch (error) {
          console.error('Failed to process property:', property.address, error);
          results.push({
            success: false,
            address: property.address,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Send notification if configured
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey && results.length > 0) {
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(resendApiKey);

          const successCount = results.filter(r => r.success).length;
          const highScoreProperties = results
            .filter(r => r.success && r.score && r.score > 70)
            .slice(0, 5);

          await resend.emails.send({
            from: 'FlipOps <notifications@flipops.io>',
            to: process.env.NOTIFICATION_EMAIL || 'hello@flipops.io',
            subject: `n8n Import: ${successCount} properties processed`,
            html: `
              <h2>n8n Webhook Import Summary</h2>
              <p><strong>Workflow:</strong> ${payload.workflowName || 'Unknown'}</p>
              <p><strong>Total Processed:</strong> ${results.length}</p>
              <p><strong>Successful:</strong> ${successCount}</p>
              <p><strong>Failed:</strong> ${results.length - successCount}</p>

              ${highScoreProperties.length > 0 ? `
                <h3>High Score Properties (70+)</h3>
                <ul>
                  ${highScoreProperties.map(p => `
                    <li>
                      <strong>${p.address}</strong><br/>
                      Score: ${p.score} | Potential Profit: $${p.potentialProfit?.toLocaleString()}
                    </li>
                  `).join('')}
                </ul>
              ` : ''}

              <hr/>
              <p><small>Execution ID: ${payload.executionId || 'N/A'}</small></p>
              <p><small>Timestamp: ${new Date().toISOString()}</small></p>
            `,
          });
        } catch (error) {
          console.error('Failed to send notification:', error);
        }
      }
    }

    // Log webhook activity
    console.log('[n8n Webhook]', {
      type: payload.type,
      action: payload.action,
      workflow: payload.workflowName,
      recordCount: Array.isArray(payload.data) ? payload.data.length : 1,
      results: results.length,
      success: results.filter(r => r.success).length,
    });

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} records`,
      results,
      executionId: payload.executionId,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error('[n8n Webhook Error]', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/webhooks/n8n',
    timestamp: new Date().toISOString(),
    acceptedTypes: ['property', 'lead', 'update', 'batch'],
    authMethods: ['api-key', 'signature'],
  });
}