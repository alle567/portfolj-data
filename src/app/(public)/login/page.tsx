// app/(public)/login/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useClerk, useSignIn } from "@clerk/nextjs";
import { Mail, Lock, ArrowRight, Github } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function safeRedirect(path?: string | null) {
  if (!path || typeof path !== "string") return "/dashboard";
  if (!path.startsWith("/") || path.startsWith("//")) return "/dashboard";
  return path;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirect(
    searchParams?.get("redirect_url") ||
      searchParams?.get("redirectTo") ||
      "/dashboard"
  );

  const { isLoaded, signIn } = useSignIn();
  const { setActive } = useClerk();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    setError(null);
    setPending(true);
    try {
      const res = await signIn.create({ identifier: email, password });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        router.push(redirectTo);
      } else {
        setError("Additional steps required.");
      }
    } catch (err: any) {
      setError(
        err?.errors?.[0]?.longMessage || err?.message || "Invalid credentials."
      );
    } finally {
      setPending(false);
    }
  }

  function oauth(provider: "oauth_github" | "oauth_google") {
    if (!isLoaded) return;
    signIn.authenticateWithRedirect({
      strategy: provider,
      redirectUrl: "/sso-callback",
      redirectUrlComplete: redirectTo,
    });
  }

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-16 sm:py-24">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>
            Welcome back. Access your portfolio and screens.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground/80 hover:underline underline-offset-4 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={pending || !email || !password}
            >
              {pending ? (
                "Signing in…"
              ) : (
                <>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </form>

          <div className="my-4 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <div className="grid gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full justify-center gap-2"
              onClick={() => oauth("oauth_github")}
            >
              <Github className="h-4 w-4 shrink-0" />
              <span className="truncate">Continue with GitHub</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-10 w-full justify-center gap-2"
              onClick={() => oauth("oauth_google")}
            >
              <span className="font-medium">G</span>
              <span className="truncate">Continue with Google</span>
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link
              href={`/signup?redirect_url=${encodeURIComponent(redirectTo)}`}
              className="font-medium underline underline-offset-4"
            >
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
