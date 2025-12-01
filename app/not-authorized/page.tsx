import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function NotAuthorizedPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center">
          <div className="p-4 bg-red-500/10 rounded-full">
            <ShieldX className="h-16 w-16 text-red-500" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Access Restricted</h1>
          <p className="text-gray-400 max-w-md mx-auto">
            This dashboard is currently in private beta. Please contact us if you believe you should have access.
          </p>
        </div>
        
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/">
            <Button variant="outline">
              Back to Home
            </Button>
          </Link>
          <Link href="mailto:support@flipops.io">
            <Button>
              Request Access
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}