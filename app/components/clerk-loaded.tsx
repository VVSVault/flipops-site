'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

/**
 * Wrapper component that only renders children after Clerk has loaded
 * This prevents "useAuth outside ClerkProvider" errors
 */
export function ClerkLoaded({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted on client and Clerk is loaded
  if (!mounted || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
