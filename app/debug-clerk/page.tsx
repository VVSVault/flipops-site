"use client";

export default function DebugClerkPage() {
  // In client components, process.env values are replaced at build time
  const envVars = {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Clerk Debug Info</h1>
      <div className="space-y-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <h2 className="font-bold mb-2">Individual Environment Variables:</h2>
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(envVars, null, 2)}
          </pre>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <h2 className="font-bold mb-2">Status:</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Publishable Key: {envVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ SET' : '❌ MISSING'}</li>
            <li>Sign In URL: {envVars.NEXT_PUBLIC_CLERK_SIGN_IN_URL ? '✅ SET' : '❌ MISSING'}</li>
            <li>Sign Up URL: {envVars.NEXT_PUBLIC_CLERK_SIGN_UP_URL ? '✅ SET' : '❌ MISSING'}</li>
            <li>After Sign In URL: {envVars.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL ? '✅ SET' : '❌ MISSING'}</li>
            <li>After Sign Up URL: {envVars.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL ? '✅ SET' : '❌ MISSING'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
