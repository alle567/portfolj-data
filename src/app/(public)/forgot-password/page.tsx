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
import { Check, Eye, EyeOff } from "lucide-react";
import clsx from "clsx";

function safeRedirect(path?: string | null) {
  if (!path || typeof path !== "string") return "/";
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}

type Policy = {
  lengthOK: boolean;
  upperOK: boolean;
  numberOK: boolean;
  specialOK: boolean;
  all: boolean;
};

function passwordMeetsPolicy(pw: string): Policy {
  const lengthOK = pw.length >= 10;
  const upperOK = /[A-Z]/.test(pw);
  const numberOK = /\d/.test(pw);
  const specialOK = /[^A-Za-z0-9]/.test(pw);
  return {
    lengthOK,
    upperOK,
    numberOK,
    specialOK,
    all: lengthOK && upperOK && numberOK && specialOK,
  };
}

// --- Styling aligned with Signup ---
function PolicyItem({
  ok,
  children,
}: {
  ok: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={clsx(
          "inline-flex h-4 w-4 items-center justify-center rounded-full border flex-none leading-none",
          ok
            ? "border-primary text-primary"
            : "border-border text-muted-foreground"
        )}
        aria-hidden
      >
        {ok && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span
        className={clsx(
          "text-sm transition-colors",
          ok ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {children}
      </span>
    </li>
  );
}

function PasswordCriteria({ password }: { password: string }) {
  const p = React.useMemo(() => passwordMeetsPolicy(password), [password]);
  return (
    <div className="rounded-lg border bg-muted/50 p-3">
      <p className="mb-2 text-xs text-muted-foreground">
        Password must include
      </p>
      <ul className="grid gap-1 sm:grid-cols-2">
        <PolicyItem ok={p.lengthOK}>At least 10 characters</PolicyItem>
        <PolicyItem ok={p.upperOK}>One uppercase letter (A–Z)</PolicyItem>
        <PolicyItem ok={p.numberOK}>One number (0–9)</PolicyItem>
        <PolicyItem ok={p.specialOK}>One special character (!@#$…)</PolicyItem>
      </ul>
    </div>
  );
}
// --- /Styling aligned with Signup ---

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
  const [showPw, setShowPw] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const policy = React.useMemo(() => passwordMeetsPolicy(password), [password]);

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
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <CardDescription>We’ll email you a code to reset it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "email" && (
            <form onSubmit={sendReset} className="space-y-4" noValidate>
              <div className="space-y-2 text-center">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mx-auto max-w-sm"
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
                <p
                  role="alert"
                  className="text-sm text-destructive text-center"
                >
                  {error}
                </p>
              )}
            </form>
          )}

          {step === "code" && (
            <form onSubmit={verifyCode} className="space-y-4">
              <div className="space-y-2 text-center">
                <Label>Enter the 6-digit code</Label>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={pending || code.length !== 6}
              >
                {pending ? "Verifying…" : "Verify code"}
              </Button>
              {error && (
                <p
                  role="alert"
                  className="text-sm text-destructive text-center"
                >
                  {error}
                </p>
              )}
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={setNewPassword} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="password" className="block text-center">
                  New password
                </Label>
                <div className="relative mx-auto max-w-sm">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-describedby="password-help"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div id="password-help" className="mx-auto max-w-sm">
                  <PasswordCriteria password={password} />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={pending || !policy.all}
              >
                {pending ? "Saving…" : "Set new password"}
              </Button>
              {error && (
                <p
                  role="alert"
                  className="text-sm text-destructive text-center"
                >
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
