"use client";

import dynamic from "next/dynamic";

// Dynamically import ActivityMonitor to prevent SSR issues
export const ClientActivityMonitor = dynamic(
  () => import("./activity-monitor").then((mod) => mod.ActivityMonitor),
  {
    ssr: false,
    loading: () => <>{/* Loading... */}</>
  }
);