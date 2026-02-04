/**
 * Authentication helpers for API routes
 */

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export interface AuthResult {
  success: boolean;
  userId?: string;
  error?: string;
  status?: number;
}

/**
 * Get the authenticated database user ID from Clerk session
 * Returns the internal database user ID (not the Clerk ID)
 */
export async function getAuthenticatedUserId(): Promise<AuthResult> {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return { success: false, error: 'Unauthorized', status: 401 };
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!dbUser) {
      return { success: false, error: 'User not found', status: 404 };
    }

    return { success: true, userId: dbUser.id };
  } catch (error) {
    console.error('Auth error:', error);
    return { success: false, error: 'Authentication failed', status: 500 };
  }
}
