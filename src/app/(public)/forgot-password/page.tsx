// app/(public)/forgot-password/page.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useClerk, useSignIn } from "@clerk/nextjs";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

function safeRedirect(path?: string | null) {
  if (!path || typeof path !== "string") return "/";
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirect(
    searchParams?.get("redirect_url") || searchParams?.get("redirectTo") || "/"
  );

  const { isLoaded, signIn } = useSignIn();
  const { setActive } = useClerk();

  const [step, setStep] = React.useState<"email" | "code" | "reset">("email");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    setError(null);
    setPending(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setStep("code");
    } catch (err: any) {
      setError(
        err?.errors?.[0]?.longMessage ||
          err?.message ||
          "Failed to send reset code."
      );
    } finally {
      setPending(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    setError(null);
    setPending(true);
    try {
      await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
      });
      setStep("reset");
    } catch (err: any) {
      setError(
        err?.errors?.[0]?.longMessage ||
          err?.message ||
          "Invalid or expired code."
      );
    } finally {
      setPending(false);
    }
  }

  async function setNewPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    setError(null);
    setPending(true);
    try {
      const res = await signIn.resetPassword({
        password,
        signOutOfOtherSessions: true,
      });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        router.push(redirectTo);
      } else {
        setError("Could not complete password reset.");
      }
    } catch (err: any) {
      setError(
        err?.errors?.[0]?.longMessage ||
          err?.message ||
          "Could not reset password."
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-16 sm:py-24">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <CardDescription>We’ll email you a code to reset it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "email" && (
            <form onSubmit={sendReset} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={pending || !email}
              >
                {pending ? "Sending…" : "Send reset code"}
              </Button>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </form>
          )}

          {step === "code" && (
            <form onSubmit={verifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label>Enter the 6-digit code</Label>
                <InputOTP maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={pending || code.length !== 6}
              >
                {pending ? "Verifying…" : "Verify code"}
              </Button>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={setNewPassword} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={pending || password.length < 10}
              >
                {pending ? "Saving…" : "Set new password"}
              </Button>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
