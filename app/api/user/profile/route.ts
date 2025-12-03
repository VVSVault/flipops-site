import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/user/profile
// Get current user profile including investor type and onboarding status
export async function GET() {
  try {
    const userId = "mock-user-id"; // Temporary for CSS debugging

    // Find the user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        investorType: true,
        onboardingComplete: true,
        investorProfile: true,
        tier: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...user,
        investorProfile: user.investorProfile ? JSON.parse(user.investorProfile) : null,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
