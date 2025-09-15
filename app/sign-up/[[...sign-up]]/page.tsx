import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <SignUp 
        afterSignUpUrl="/app"
        redirectUrl="/app"
      />
    </div>
  );
}