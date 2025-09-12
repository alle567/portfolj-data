// src/app/sso-callback/[[...slug]]/page.tsx
"use client";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function Page() {
  return (
    <AuthenticateWithRedirectCallback
      // Always land here after OAuth completes:
      signInForceRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/dashboard"
      // If there's no redirect_url in the URL, use these:
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      // Optional: where your auth pages live
      signInUrl="/login"
      signUpUrl="/signup"
    />
  );
}
