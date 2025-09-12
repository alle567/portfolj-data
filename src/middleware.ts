// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes (no auth needed)
const isPublicRoute = createRouteMatcher([
  "/", // public home
  "/login(.*)",
  "/signup(.*)",
  "/forgot-password(.*)",
  "/sso-callback(.*)",
  "/favicon.ico",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();
  const url = req.nextUrl;

  // Signed-out trying to access protected — send to sign-in
  if (!userId && !isPublicRoute(req)) {
    return redirectToSignIn();
  }

  // Signed-in on a public page — bounce to dashboard
  if (userId && isPublicRoute(req)) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

// Make sure middleware runs for all app pages & API, but skip static assets
export const config = {
  matcher: [
    // Run on all paths except static files, Next internals, and image optimization
    "/((?!_next/static|_next/image|assets|images|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt|woff2?|ttf)).*)",
    // And always run for API routes
    "/(api|trpc)(.*)",
  ],
};
