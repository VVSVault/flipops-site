"use client";

import { useUser, useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useState } from "react";

/**
 * SSR-safe wrapper for Clerk's useUser hook
 * Returns null during SSR/build and the actual user after client-side hydration
 */
export function useUserSSRSafe() {
  const [isMounted, setIsMounted] = useState(false);
  const user = useUser();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return { user: null, isLoaded: false, isSignedIn: false };
  }

  return user;
}

/**
 * SSR-safe wrapper for Clerk's useAuth hook
 * Returns null during SSR/build and the actual auth after client-side hydration
 */
export function useAuthSSRSafe() {
  const [isMounted, setIsMounted] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return { isLoaded: false, isSignedIn: false, userId: null };
  }

  return auth;
}

/**
 * SSR-safe wrapper for Clerk's useClerk hook
 * Returns null during SSR/build and the actual clerk after client-side hydration
 */
export function useClerkSSRSafe() {
  const [isMounted, setIsMounted] = useState(false);
  const clerk = useClerk();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null as any;
  }

  return clerk;
}
