import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    serverSide: {
      clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      clerkSecretKey: process.env.CLERK_SECRET_KEY ? '***SET***' : undefined,
      allNextPublicVars: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')),
    },
    // These will be inlined at build time
    buildTime: {
      clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
      signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
      afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
      afterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
    }
  });
}
