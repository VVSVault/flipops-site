import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const createNotificationSchema = z.object({
  eventId: z.string().min(1),
  type: z.string().min(1),
  dealId: z.string().optional(),
  message: z.string().min(1),
  metadata: z.any().optional(),
  n8nExecId: z.string().optional(),
  n8nWorkflow: z.string().optional()
});

const querySchema = z.object({
  type: z.string().optional(),
  limit: z.string().transform(Number).optional().default('50'),
  offset: z.string().transform(Number).optional().default('0')
});

// GET /api/notifications - List notifications
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = querySchema.parse(searchParams);

    const where = query.type ? { type: query.type } : {};

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        take: query.limit,
        skip: query.offset
      }),
      prisma.notification.count({ where })
    ]);

    return NextResponse.json({
      data: notifications,
      total,
      limit: query.limit,
      offset: query.offset
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createNotificationSchema.parse(body);

    // Check for duplicate eventId
    const existing = await prisma.notification.findUnique({
      where: { eventId: validated.eventId },
      select: { id: true }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Event already processed', eventId: validated.eventId },
        { status: 409 }
      );
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        ...validated,
        occurredAt: new Date()
      }
    });

    console.log(`Created notification: ${notification.eventId} (${notification.type})`);

    return NextResponse.json(notification, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}