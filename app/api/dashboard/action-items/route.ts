import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

/**
 * GET /api/dashboard/action-items
 * Get today's action items for authenticated user
 * Includes:
 * - Properties needing first contact (skip traced but not contacted)
 * - Follow-ups due today (nextFollowUpDate = today)
 * - Tasks due today
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const actionItems: any[] = [];

    // 1. Properties needing first contact (skip traced but not contacted)
    const needsFirstContact = await prisma.property.findMany({
      where: {
        userId,
        enriched: true,
        lastContactDate: null,
      },
      select: {
        id: true,
        address: true,
        city: true,
        state: true,
        ownerName: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 3, // Limit to top 3
    });

    needsFirstContact.forEach((property) => {
      actionItems.push({
        id: `first-contact-${property.id}`,
        type: 'first_contact' as const,
        title: `Make first contact with ${property.ownerName || 'owner'}`,
        description: 'Property has contact info but has not been contacted yet',
        propertyAddress: `${property.address}, ${property.city}, ${property.state}`,
      });
    });

    // 2. Follow-ups due today
    const followUpsDue = await prisma.property.findMany({
      where: {
        userId,
        nextFollowUpDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      select: {
        id: true,
        address: true,
        city: true,
        state: true,
        ownerName: true,
        sentiment: true,
      },
      orderBy: { nextFollowUpDate: 'asc' },
      take: 3, // Limit to top 3
    });

    followUpsDue.forEach((property) => {
      actionItems.push({
        id: `follow-up-${property.id}`,
        type: 'follow_up' as const,
        title: `Follow up with ${property.ownerName || 'owner'}`,
        description: `Scheduled follow-up${property.sentiment ? ` (${property.sentiment} sentiment)` : ''}`,
        propertyAddress: `${property.address}, ${property.city}, ${property.state}`,
      });
    });

    // 3. Tasks due today (not overdue)
    const tasksDueToday = await prisma.task.findMany({
      where: {
        userId,
        completed: false,
        dueDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      include: {
        property: {
          select: {
            address: true,
            city: true,
            state: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
      take: 3, // Limit to top 3
    });

    tasksDueToday.forEach((task) => {
      actionItems.push({
        id: `task-${task.id}`,
        type: 'overdue_task' as const,
        title: task.title,
        description: task.description || `${task.type} task`,
        propertyAddress: task.property
          ? `${task.property.address}, ${task.property.city}, ${task.property.state}`
          : undefined,
        dueDate: task.dueDate.toISOString(),
        priority: task.priority,
      });
    });

    // Sort action items: high priority tasks first, then by type
    const sortedItems = actionItems.sort((a, b) => {
      // High priority tasks first
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;

      // Then by type: first_contact > follow_up > tasks
      const typeOrder = { first_contact: 1, follow_up: 2, overdue_task: 3 };
      return typeOrder[a.type] - typeOrder[b.type];
    });

    // Limit to top 5 total
    const limitedItems = sortedItems.slice(0, 5);

    return NextResponse.json({ actionItems: limitedItems });
  } catch (error) {
    console.error('Error fetching action items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
