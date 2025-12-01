"use client";

import { useEffect, useState } from "react";

/**
 * Wrapper that only renders children on the client side after mount.
 * Prevents SSR/build-time rendering of components that use Clerk hooks.
 */
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}
