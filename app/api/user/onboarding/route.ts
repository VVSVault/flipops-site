import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/user/onboarding
// Complete onboarding flow and set investor type
export async function POST(request: Request) {
  try {
    const userId = "mock-user-id"; // Temporary for CSS debugging

    const body = await request.json();
    const { investorType, investorProfile } = body;

    // Validate investor type
    const validTypes = ['wholesaler', 'flipper', 'buy_and_hold', 'hybrid'];
    if (!investorType || !validTypes.includes(investorType)) {
      return NextResponse.json(
        { error: 'Invalid investor type. Must be one of: wholesaler, flipper, buy_and_hold, hybrid' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user with investor type and mark onboarding complete
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        investorType,
        onboardingComplete: true,
        investorProfile: investorProfile ? JSON.stringify(investorProfile) : user.investorProfile,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        investorType: updatedUser.investorType,
        onboardingComplete: updatedUser.onboardingComplete,
        investorProfile: updatedUser.investorProfile ? JSON.parse(updatedUser.investorProfile) : null,
      },
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
