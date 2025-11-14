import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/sign-up(.*)",
  "/sign-in(.*)",
  "/privacy",
  "/terms",
  "/api/webhook(.*)",
  "/api/webhooks/(.*)",          // All webhook endpoints including n8n
  "/api/properties/(.*)",        // Property scoring endpoints
  "/api/notifications(.*)",      // Notifications endpoint
  "/api/deals/approve",          // G1 endpoint
  "/api/deals/stalled",          // Pipeline monitoring endpoint
  "/api/deals/active",           // Active deals for data refresh
  "/api/deals/sync-all",         // Bulk deal sync endpoint
  "/api/deals/(.*)/refresh",     // Deal data refresh endpoint
  "/api/contractors/performance", // Contractor performance tracking
  "/api/contractors/(.*)/update-score", // Update contractor reliability scores
  "/api/projects/(.*)", // All project endpoints
  "/api/bids/award",             // G2 endpoint
  "/api/invoices/ingest",        // G3 endpoint
  "/api/invoices/status",        // Invoice monitoring endpoint
  "/api/change-orders/submit",   // G4 endpoint
  "/api/change-orders/status",   // Change order monitoring endpoint
  "/api/panels/truth",           // Panel endpoint
  "/api/panels/money",           // Panel endpoint
  "/api/panels/motion",          // Panel endpoint
  "/api/test",                   // Test endpoint
  "/api/debug/(.*)",             // Debug endpoints
  "/not-authorized",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};