// src/components/auth/SignupForm.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useClerk, useSignUp, useSignIn } from "@clerk/nextjs";

import {
  Github,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  UserPlus,
  LogIn,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { PopoverAnchor } from "@radix-ui/react-popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type ClerkErr = { code?: string; message: string };

function parseClerkError(err: any): ClerkErr {
  const first = err?.errors?.[0] ?? err;
  const code = first?.code || first?.error?.code;
  const long = first?.longMessage || first?.message || err?.message;
  return { code, message: long || "Something went wrong." };
}

function safeRedirect(path?: string | null) {
  if (!path || typeof path !== "string") return "/dashboard";
  if (!path.startsWith("/") || path.startsWith("//")) return "/dashboard";
  return path;
}

async function bootstrapBilling() {
  try {
    await fetch("/api/billing/bootstrap", { method: "POST" });
  } catch {}
}

const SS_EMAIL = "signup:email";
const SS_PASSWORD = "signup:password";

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirect(
    searchParams?.get("redirect_url") ||
      searchParams?.get("redirectTo") ||
      "/dashboard"
  );

  const { isLoaded: isSignUpLoaded, signUp } = useSignUp();
  const { isLoaded: isSignInLoaded, signIn } = useSignIn();
  const { setActive } = useClerk();

  // form fields
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [agree, setAgree] = React.useState(false);

  // ui state
  const [showPw, setShowPw] = React.useState(false);
  const [pwFocused, setPwFocused] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [step, setStep] = React.useState<"form" | "code">("form");
  const [code, setCode] = React.useState("");
  const [suggestLogin, setSuggestLogin] = React.useState(false);

  // avoid loops after HMR
  const attemptedFinishRef = React.useRef(false);

  // restore creds if HMR refresh happened on code step
  React.useEffect(() => {
    const savedEmail = sessionStorage.getItem(SS_EMAIL);
    const savedPw = sessionStorage.getItem(SS_PASSWORD);
    if (savedEmail && !email) setEmail(savedEmail);
    if (savedPw && !password) setPassword(savedPw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (step === "code") {
      sessionStorage.setItem(SS_EMAIL, email);
      sessionStorage.setItem(SS_PASSWORD, password);
    }
  }, [step, email, password]);

  // password policy
  const policy = React.useMemo(() => {
    const lengthOK = password.length >= 10;
    const upperOK = /[A-Z]/.test(password);
    const numberOK = /\d/.test(password);
    const specialOK = /[^A-Za-z0-9]/.test(password);
    return {
      lengthOK,
      upperOK,
      numberOK,
      specialOK,
      all: lengthOK && upperOK && numberOK && specialOK,
    };
  }, [password]);

  const mismatch = confirm.length > 0 && password !== confirm;
  const showPolicy = pwFocused || password.length > 0;

  // enable/disable submit
  const formRef = React.useRef<HTMLFormElement>(null);
  const [canSubmit, setCanSubmit] = React.useState(false);
  const recompute = React.useCallback(() => {
    const htmlValid = formRef.current?.checkValidity() ?? false;
    setCanSubmit(htmlValid && policy.all && !mismatch && agree && !pending);
  }, [policy.all, mismatch, agree, pending]);
  React.useEffect(() => {
    recompute();
  }, [recompute, name, email, password, confirm, agree]);

  // OAuth
  const startOAuth = React.useCallback(
    (provider: "oauth_github" | "oauth_google") => {
      if (!isSignUpLoaded || !signUp) return;
      signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: redirectTo,
      });
    },
    [isSignUpLoaded, signUp, redirectTo]
  );

  // Finalize helper: try to complete the sign-up, else sign the user in with saved creds
  const finalize = React.useCallback(
    async (origin: string) => {
      if (!isSignUpLoaded || !signUp) {
        setSuggestLogin(true);
        return false;
      }
      try {
        await signUp.reload?.();

        // @ts-expect-error tolerate SDK shape
        const status: string | undefined = signUp?.status;
        // @ts-expect-error tolerate SDK shape
        const createdSessionId: string | undefined = signUp?.createdSessionId;
        // @ts-expect-error tolerate SDK shape
        const verStatus: string | undefined =
          signUp?.verifications?.emailAddress?.status;

        if (status === "complete" && createdSessionId) {
          await setActive({ session: createdSessionId });
          sessionStorage.removeItem(SS_EMAIL);
          sessionStorage.removeItem(SS_PASSWORD);
          await bootstrapBilling();
          router.push(redirectTo);
          return true;
        }

        // If email is verified but no session, try a direct sign-in with the same credentials
        if (
          verStatus === "verified" &&
          isSignInLoaded &&
          signIn &&
          email &&
          password
        ) {
          const r = await signIn.create({
            identifier: email,
            password,
          });
          if (r.status === "complete") {
            await setActive({ session: r.createdSessionId });
            sessionStorage.removeItem(SS_EMAIL);
            sessionStorage.removeItem(SS_PASSWORD);
            await bootstrapBilling(); // ⬅️ add this line
            router.push(redirectTo);
            return true;
          }
        }

        // If we reach here, we couldn't complete; suggest manual login
        setSuggestLogin(true);
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[finalize:${origin}] incomplete`, {
            status,
            createdSessionId,
            verStatus,
          });
        }
        return false;
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error(`[finalize:${origin}]`, err);
        }
        setSuggestLogin(true);
        return false;
      }
    },
    [
      isSignUpLoaded,
      signUp,
      isSignInLoaded,
      signIn,
      email,
      password,
      router,
      redirectTo,
      setActive,
    ]
  );

  // “Already verified” path (no loops)
  const handleAlreadyVerified = React.useCallback(async () => {
    if (attemptedFinishRef.current) {
      setSuggestLogin(true);
      return;
    }
    attemptedFinishRef.current = true;
    await finalize("already-verified");
  }, [finalize]);

  const resendCode = React.useCallback(async () => {
    if (!isSignUpLoaded || !signUp) return;
    setError(null);
    setPending(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    } catch (err: any) {
      const e = parseClerkError(err);
      if (e.code === "verification_already_verified") {
        await handleAlreadyVerified();
        return;
      }
      setError(
        e.code === "verification_attempt_blocked"
          ? "Too many attempts. Please wait a bit before trying again."
          : e.message
      );
      if (process.env.NODE_ENV !== "production")
        console.error("Clerk resend:", e, err);
    } finally {
      setPending(false);
    }
  }, [isSignUpLoaded, signUp, handleAlreadyVerified]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isSignUpLoaded || !signUp) return;

    if (!agree) return setError("Please accept the Terms and Privacy Policy.");
    if (!policy.all) return setError("Please meet the password requirements.");
    if (mismatch) return setError("Passwords do not match.");

    setError(null);
    setPending(true);
    setSuggestLogin(false);

    // Split name for instances that require first/last
    const [firstName, ...rest] = (name || "").trim().split(/\s+/);
    const lastName = rest.join(" ") || undefined;

    try {
      await signUp.create({
        emailAddress: email.trim().toLowerCase(),
        password,
        firstName: firstName || undefined,
        lastName,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("code");
    } catch (err: any) {
      const e = parseClerkError(err);
      if (
        e.code === "identifier_already_exists" ||
        e.code === "form_identifier_exists"
      ) {
        setError(
          "An account with this email already exists. Try signing in or resetting your password."
        );
      } else if (
        e.code === "captcha_required" ||
        e.code === "captcha_invalid"
      ) {
        setError("Please complete the verification challenge and try again.");
      } else if (e.code === "password_disabled") {
        setError("Password sign-up is disabled for this application.");
      } else if (e.code === "not_allowed_to_sign_up") {
        setError("Sign-ups are disabled or this email/domain is not allowed.");
      } else if (e.code === "verification_already_verified") {
        await handleAlreadyVerified();
      } else {
        setError(e.message);
      }
      if (process.env.NODE_ENV !== "production")
        console.error("Clerk signup:", e, err);
    } finally {
      setPending(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!isSignUpLoaded || !signUp) return;

    setError(null);
    setPending(true);
    setSuggestLogin(false);

    try {
      const res = await signUp.attemptEmailAddressVerification({ code });

      // Most happy path: we’re done
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        sessionStorage.removeItem(SS_EMAIL);
        sessionStorage.removeItem(SS_PASSWORD);
        await bootstrapBilling();
        router.push(redirectTo);
        return;
      }

      // If not complete, try to “finalize” based on current SDK state
      const ok = await finalize("attempt-returned-non-complete");
      if (!ok) setError("Invalid or expired code.");
    } catch (err: any) {
      const e = parseClerkError(err);

      if (e.code === "verification_already_verified") {
        await handleAlreadyVerified();
      } else if (
        e.code === "expired" ||
        e.code === "verification_code_expired" ||
        /expired/.test(e.message || "")
      ) {
        setError("Code expired. Tap Resend to get a new one.");
      } else if (
        e.code === "client_mismatch" ||
        /client.*mismatch/i.test(e.message || "")
      ) {
        setError(
          "We lost the verification session (dev refresh). Tap Resend to get a fresh code."
        );
      } else if (
        e.code === "verification_failed" ||
        e.code === "form_code_incorrect" ||
        /invalid|incorrect/i.test(e.message || "")
      ) {
        setError("That code didn’t match. Please try again, or tap Resend.");
      } else {
        setError(e.message || "Invalid or expired code.");
      }

      if (process.env.NODE_ENV !== "production")
        console.error("Clerk verify:", e, err);
    } finally {
      setPending(false);
    }
  }

  // If we land on the code step and the email is already verified, try to finish once
  React.useEffect(() => {
    const run = async () => {
      if (
        !isSignUpLoaded ||
        !signUp ||
        step !== "code" ||
        attemptedFinishRef.current
      )
        return;
      try {
        await signUp.reload?.();

        const v = signUp?.verifications?.emailAddress?.status;
        if (v === "verified") {
          await handleAlreadyVerified();
        }
      } catch {
        /* ignore */
      }
    };
    run();
  }, [step, isSignUpLoaded, signUp, handleAlreadyVerified]);

  if (step === "code") {
    return (
      <form onSubmit={verifyCode} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label>Enter the 6-digit code</Label>
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <p className="text-xs text-muted-foreground">
            We sent it to {email}.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={pending || code.length !== 6}
        >
          {pending ? "Verifying…" : "Verify & create account"}
        </Button>

        <div className="grid gap-2">
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setStep("form")}
            disabled={pending}
          >
            Use a different email
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={resendCode}
            disabled={pending || !isSignUpLoaded || !signUp}
          >
            Resend code
          </Button>

          {suggestLogin && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() =>
                router.push(
                  `/login?redirect_url=${encodeURIComponent(
                    redirectTo
                  )}&from=verified`
                )
              }
            >
              <LogIn className="mr-2 h-4 w-4" />
              Continue to sign in
            </Button>
          )}
        </div>

        {error && (
          <p
            role="alert"
            aria-live="polite"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        )}
      </form>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onInput={recompute}
      className="space-y-4"
      noValidate
    >
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
          <Input
            id="name"
            name="name"
            placeholder="Anders Andersson"
            className="pl-9"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            className="pl-9"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Password + policy popover */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Popover open={showPolicy} modal={false}>
          <PopoverAnchor asChild>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
              <Input
                id="password"
                name="password"
                type={showPw ? "text" : "password"}
                className="pl-9 pr-10"
                minLength={10}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
                aria-describedby="password-policy"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </PopoverAnchor>

          <PopoverContent
            id="password-policy"
            side="right"
            align="start"
            className="w-72 text-sm"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <p className="mb-2 font-medium">Password requirements</p>
            <ul className="space-y-2">
              <Req ok={policy.lengthOK} label="At least 10 characters" />
              <Req
                ok={policy.upperOK}
                label="Contains an uppercase letter (A–Z)"
              />
              <Req ok={policy.numberOK} label="Contains a number (0–9)" />
              <Req
                ok={policy.specialOK}
                label="Contains a special character (!@#$…)"
              />
            </ul>
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Use a unique password you don’t use elsewhere.
        </p>
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
          <Input
            id="confirm"
            name="confirm"
            type="password"
            className={`pl-9 ${
              mismatch
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={mismatch}
            aria-describedby={mismatch ? "confirm-error" : undefined}
          />
        </div>
        {mismatch && (
          <p
            id="confirm-error"
            role="alert"
            className="text-xs text-destructive"
          >
            Passwords do not match.
          </p>
        )}
      </div>

      {/* Consent */}
      <label className="group -mx-2 flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-muted/50">
        <Checkbox
          id="accept"
          checked={agree}
          onCheckedChange={(v) => setAgree(Boolean(v))}
          className="h-4 w-4 translate-y-[1px]"
        />
        <span className="text-xs leading-4 text-muted-foreground">
          I agree to the{" "}
          <Link href="/terms" className="underline underline-offset-4">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      {/* CAPTCHA placeholder (optional) */}
      <div
        id="clerk-captcha"
        data-cl-theme="auto"
        data-cl-size="normal"
        className="mt-2"
      />

      <Button
        type="submit"
        className="w-full"
        disabled={!canSubmit || !isSignUpLoaded || !signUp}
      >
        {pending ? "Creating…" : "Create account"}
        <UserPlus className="ml-2 h-4 w-4" />
      </Button>

      {/* OR */}
      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* Social */}
      <div className="grid gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full justify-center gap-2"
          onClick={() => startOAuth("oauth_github")}
          disabled={pending || !isSignUpLoaded || !signUp}
        >
          <Github className="h-4 w-4 shrink-0" />
          <span className="truncate">Continue with GitHub</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full justify-center gap-2"
          onClick={() => startOAuth("oauth_google")}
          disabled={pending || !isSignUpLoaded || !signUp}
        >
          <span className="font-medium">G</span>
          <span className="truncate">Continue with Google</span>
        </Button>
      </div>

      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="text-center text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </form>
  );
}

function Req({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 leading-tight">
      <span className="flex h-4 w-4 flex-none items-center justify-center">
        {ok ? (
          <CheckCircle2
            className="h-4 w-4 text-green-600 dark:text-green-500"
            strokeWidth={2}
            aria-hidden
          />
        ) : (
          <Circle
            className="h-4 w-4 text-muted-foreground"
            strokeWidth={2}
            aria-hidden
          />
        )}
      </span>
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </li>
  );
}
