"use client";

import dynamic from "next/dynamic";

// Force dynamic rendering to prevent SSR of Clerk hooks
export const dynamic = 'force-dynamic';

// Dynamically import the page content with no SSR
const ContractsPageContent = dynamic(() => import("./page-content"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
});

export default function ContractsPage() {
  return <ContractsPageContent />;
}
