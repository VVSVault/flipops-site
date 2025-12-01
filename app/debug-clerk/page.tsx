"use client";

export default function DebugClerkPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Clerk Debug Info</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify({
          publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
          hasKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
          keyLength: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.length,
          allEnvVars: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')),
        }, null, 2)}
      </pre>
    </div>
  );
}
