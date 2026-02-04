import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserId } from '@/lib/auth-helpers';

/**
 * GET /api/dashboard/overdue-tasks
 * Get overdue tasks for authenticated user
 */
export async function GET() {
  try {
    const authResult = await getAuthenticatedUserId();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const userId = authResult.userId!;

    const now = new Date();

    // Get overdue tasks
    const overdueTasks = await prisma.task.findMany({
      where: {
        userId,
        completed: false,
        dueDate: { lt: now },
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
      take: 5,
    });

    // Calculate how many days overdue
    const formattedTasks = overdueTasks.map((task) => {
      const dueDate = new Date(task.dueDate);
      const diffTime = now.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: task.id,
        title: task.title,
        dueDate: task.dueDate.toISOString(),
        priority: task.priority,
        propertyAddress: task.property
          ? `${task.property.address}, ${task.property.city}, ${task.property.state}`
          : undefined,
        overdueDays: diffDays,
      };
    });

    return NextResponse.json({ overdueTasks: formattedTasks });
  } catch (error) {
    console.error('Error fetching overdue tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
