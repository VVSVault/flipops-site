"use client";

import { useEffect, useState } from "react";

export const dynamic = 'force-dynamic';

export default function RentalsPage() {
  const [PageContent, setPageContent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import("./page-content").then((mod) => {
      setPageContent(() => mod.default);
    });
  }, []);

  if (!PageContent) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return <PageContent />;
}
