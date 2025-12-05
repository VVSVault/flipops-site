"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function TasksPage() {
  const [PageContent, setPageContent] = useState<React.ComponentType | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    import("./page-content")
      .then((mod) => {
        setPageContent(() => mod.default);
      })
      .catch((error) => {
        console.error("Failed to load tasks page:", error);
        setLoadError(true);
      });
  }, []);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-destructive">Failed to load page content.</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!PageContent) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return <PageContent />;
}
