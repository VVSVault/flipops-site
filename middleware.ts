import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/sign-up(.*)",
  "/sign-in(.*)",
  "/privacy",
  "/terms",
  "/api/webhook(.*)",
  "/api/deals/approve",          // G1 endpoint
  "/api/bids/award",             // G2 endpoint
  "/api/invoices/ingest",        // G3 endpoint
  "/api/change-orders/submit",   // G4 endpoint
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