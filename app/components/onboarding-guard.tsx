'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Skip check if already on onboarding page
      if (pathname === '/app/onboarding') {
        setShouldRender(true);
        setIsChecking(false);
        return;
      }

      try {
        const response = await fetch('/api/user/profile');

        if (response.ok) {
          const data = await response.json();

          // If onboarding not complete, redirect to onboarding
          if (!data.user.onboardingComplete) {
            router.push('/app/onboarding');
            return;
          }
        }

        // User is onboarded or there was an error, show content
        setShouldRender(true);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // On error, allow access (fail open)
        setShouldRender(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboardingStatus();
  }, [pathname, router]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Only render children if we should
  return shouldRender ? <>{children}</> : null;
}
