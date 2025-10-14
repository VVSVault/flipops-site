"use client";

import { useEffect, useCallback, useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
const WARNING_TIME = 60 * 1000; // Show warning 1 minute before logout

export function ActivityMonitor({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Only run on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const resetTimer = useCallback(() => {
    setShowWarning(false);
    setCountdown(60);
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
    router.push("/sign-in");
    toast.error("You have been logged out due to inactivity");
  }, [signOut, router]);

  useEffect(() => {
    if (!isMounted || !isSignedIn) return;

    let inactivityTimer: NodeJS.Timeout;
    let warningTimer: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    const startTimers = () => {
      // Clear existing timers
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      clearInterval(countdownInterval);
      setShowWarning(false);
      setCountdown(60);

      // Set warning timer (9 minutes)
      warningTimer = setTimeout(() => {
        setShowWarning(true);
        
        // Start countdown
        let seconds = 60;
        countdownInterval = setInterval(() => {
          seconds -= 1;
          setCountdown(seconds);
          
          if (seconds <= 0) {
            clearInterval(countdownInterval);
          }
        }, 1000);
      }, INACTIVITY_TIMEOUT - WARNING_TIME);

      // Set logout timer (10 minutes)
      inactivityTimer = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    };

    const resetTimers = () => {
      startTimers();
      if (showWarning) {
        setShowWarning(false);
        setCountdown(60);
      }
    };

    // Events to track user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
      "keydown",
      "touchmove"
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimers);
    });

    // Start initial timer
    startTimers();

    // Cleanup
    return () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      clearInterval(countdownInterval);
      events.forEach(event => {
        document.removeEventListener(event, resetTimers);
      });
    };
  }, [isMounted, isSignedIn, handleLogout, showWarning]);

  // Don't render anything until mounted (prevents SSR issues)
  if (!isMounted) {
    return <>{children}</>;
  }

  // Warning modal
  if (showWarning && isSignedIn) {
    return (
      <>
        {children}
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Session Expiring Soon
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You will be logged out in {countdown} seconds
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              You've been inactive for 9 minutes. For security purposes, you'll be automatically logged out after 10 minutes of inactivity.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={resetTimer}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Stay Logged In
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                Log Out Now
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
}