import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserId } from '@/lib/auth-helpers';

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for authenticated user
 */
export async function GET() {
  try {
    const authResult = await getAuthenticatedUserId();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const userId = authResult.userId!;

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // New leads in last 24 hours
    const newLeads24h = await prisma.property.count({
      where: {
        userId,
        createdAt: { gte: yesterday },
      },
    });

    // New leads in previous 24 hours (for comparison)
    const twoDaysAgo = new Date(yesterday);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);
    const newLeadsPrevious24h = await prisma.property.count({
      where: {
        userId,
        createdAt: { gte: twoDaysAgo, lt: yesterday },
      },
    });

    // New leads in last 7 days
    const newLeads7d = await prisma.property.count({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // New leads in previous 7 days (for comparison)
    const newLeadsPrevious7d = await prisma.property.count({
      where: {
        userId,
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    });

    // Properties contacted (last 7 days)
    const propertiesContacted = await prisma.property.count({
      where: {
        userId,
        lastContactDate: { gte: sevenDaysAgo },
      },
    });

    // Properties contacted (previous 7 days)
    const propertiesContactedPrevious = await prisma.property.count({
      where: {
        userId,
        lastContactDate: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    });

    // Properties skip traced (last 7 days)
    const propertiesSkipTraced = await prisma.property.count({
      where: {
        userId,
        enriched: true,
        updatedAt: { gte: sevenDaysAgo },
      },
    });

    // Properties skip traced (previous 7 days)
    const propertiesSkipTracedPrevious = await prisma.property.count({
      where: {
        userId,
        enriched: true,
        updatedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    });

    // Overdue tasks
    const tasksOverdue = await prisma.task.count({
      where: {
        userId,
        completed: false,
        dueDate: { lt: now },
      },
    });

    // Tasks completed today
    const tasksCompleted = await prisma.task.count({
      where: {
        userId,
        completed: true,
        completedAt: { gte: startOfToday },
      },
    });

    return NextResponse.json({
      stats: {
        newLeads24h,
        newLeads7d,
        newLeadsPrevious24h,
        newLeadsPrevious7d,
        propertiesContacted,
        propertiesContactedPrevious,
        propertiesSkipTraced,
        propertiesSkipTracedPrevious,
        tasksOverdue,
        tasksCompleted,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
