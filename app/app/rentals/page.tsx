"use client";

import dynamic from "next/dynamic";

export const dynamic = 'force-dynamic';

const PageContent = dynamic(() => import("./page-content"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
});

export default function Page() {
  return <PageContent />;
}
