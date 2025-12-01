"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode, useEffect, useState } from "react";

export function ClerkProviderWrapper({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Always wrap in ClerkProvider, but it won't be active until mounted
  // This ensures children always have access to Clerk context
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        baseTheme: undefined,
      }}
    >
      {children}
    </ClerkProvider>
  );
}
