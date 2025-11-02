import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for notification data
const NotificationSchema = z.object({
  type: z.enum(['success', 'error', 'warning', 'info', 'webhook_success', 'webhook_error', 'batch_complete']).optional().default('info'),
  source: z.string().optional().default('n8n'),
  workflow: z.string().optional(),
  message: z.string().optional(),
  data: z.any().optional(),
  metadata: z.record(z.any()).optional(),
  stats: z.object({
    total: z.number().optional(),
    success: z.number().optional(),
    failed: z.number().optional(),
    skipped: z.number().optional(),
    duration: z.number().optional(),
  }).optional(),
  timestamp: z.string().optional(),
});

// Store notifications in memory
const recentNotifications: any[] = [];
const MAX_NOTIFICATIONS = 100;

export async function POST(req: NextRequest) {
  try {
    // Basic API key authentication
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.FO_API_KEY || process.env.FLIPOPS_API_KEY;

    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const notification = NotificationSchema.parse({
      ...body,
      timestamp: body.timestamp || new Date().toISOString(),
    });

    // Store in memory
    recentNotifications.push(notification);
    if (recentNotifications.length > MAX_NOTIFICATIONS) {
      recentNotifications.shift();
    }

    // Log to console
    console.log('[Notification]', {
      type: notification.type,
      source: notification.source,
      workflow: notification.workflow,
      message: notification.message,
      stats: notification.stats,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Notification logged',
      id: crypto.randomUUID(),
      timestamp: notification.timestamp,
    }, { status: 200 });

  } catch (error) {
    console.error('[Notification Error]', error);

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

// GET endpoint to retrieve recent notifications
export async function GET(req: NextRequest) {
  try {
    // Basic API key authentication
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
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Filter notifications
    let filtered = [...recentNotifications];

    if (type) {
      filtered = filtered.filter((n: any) => n.type === type);
    }

    // Sort by timestamp (newest first) and limit
    filtered.sort((a: any, b: any) => {
      const aTime = new Date(a.timestamp || 0).getTime();
      const bTime = new Date(b.timestamp || 0).getTime();
      return bTime - aTime;
    });
    filtered = filtered.slice(0, limit);

    return NextResponse.json({
      success: true,
      count: filtered.length,
      total: recentNotifications.length,
      notifications: filtered,
    }, { status: 200 });

  } catch (error) {
    console.error('[Notification GET Error]', error);

    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}