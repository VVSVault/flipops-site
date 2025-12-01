export const dynamic = 'force-dynamic';

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <SignIn 
        afterSignInUrl="/app"
        redirectUrl="/app"
      />
    </div>
  );
}