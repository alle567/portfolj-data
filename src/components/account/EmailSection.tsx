"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser, useSession, useReverification } from "@clerk/nextjs";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Plus,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Send,
  Shield,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ---------------------------------- Types --------------------------------- */

interface EmailSectionProps {
  user: any; // Clerk user object (compat)
}

type MaybeDateish = Date | number | string | null | undefined;

type ReverifyState =
  | undefined
  | {
      inProgress: boolean;
      level: any; // avoid @clerk/types dep
      complete: () => void;
      cancel: () => Promise<void> | void;
    };

type FirstFactorEmailChoice = {
  strategy: "email_code";
  emailAddressId: string;
  safeIdentifier?: string;
};

type SecondFactorChoice =
  | { strategy: "totp" }
  | { strategy: "phone_code"; safeIdentifier?: string }
  | { strategy: "backup_code" };

/* ------------------------------ Date utilities ---------------------------- */

function toDate(value: MaybeDateish): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const ms = value < 1e12 ? value * 1000 : value; // seconds -> ms
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    const asIso = new Date(value);
    if (!isNaN(asIso.getTime())) return asIso;
    const num = Number(value);
    if (!Number.isNaN(num)) return toDate(num);
  }
  return null;
}

function getEmailAddedDate(email: any): Date | null {
  const candidates: MaybeDateish[] = [
    email?.createdAt,
    email?.created_at,
    email?.verification?.createdAt,
    email?.updatedAt,
    email?.verification?.updatedAt,
  ];
  for (const c of candidates) {
    const d = toDate(c);
    if (d) return d;
  }
  return null;
}

function AddedOn({ date }: { date: Date | null }) {
  if (!date)
    return <span className="text-sm text-muted-foreground">Added —</span>;
  const short = date.toLocaleDateString();
  const full = date.toLocaleString();
  return (
    <span className="text-sm text-muted-foreground">
      Added{" "}
      <time dateTime={date.toISOString()} title={full}>
        {short}
      </time>
    </span>
  );
}

/* --------------------------------- Component ------------------------------ */

export function EmailSection({ user: _initialUser }: EmailSectionProps) {
  const { user } = useUser();
  const { session } = useSession();

  // UI
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState<
    string | null
  >(null);

  // Modal to enter verification code for a specific email
  const [verifyModal, setVerifyModal] = useState<{
    open: boolean;
    emailId: string | null;
    code: string;
    error: string;
    info: string;
  }>({ open: false, emailId: null, code: "", error: "", info: "" });

  // Reverification (step-up) state – **email only**
  const [reverifyState, setReverifyState] = useState<ReverifyState>(undefined);
  const [reverifyPhase, setReverifyPhase] = useState<
    | "idle"
    | "chooseEmail"
    | "firstPrep"
    | "firstCode"
    | "chooseSecond"
    | "secondPrep"
    | "secondCode"
    | "complete"
  >("idle");
  const [emailChoices, setEmailChoices] = useState<FirstFactorEmailChoice[]>(
    []
  );
  const [chosenEmail, setChosenEmail] = useState<FirstFactorEmailChoice | null>(
    null
  );
  const [firstCode, setFirstCode] = useState("");
  const [secondCode, setSecondCode] = useState("");
  const [secondChoices, setSecondChoices] = useState<SecondFactorChoice[]>([]);
  const [chosenSecond, setChosenSecond] = useState<SecondFactorChoice | null>(
    null
  );
  const [reverifyInfo, setReverifyInfo] = useState<string>("");
  const [reverifyError, setReverifyError] = useState<string>("");

  const emailAddresses = user?.emailAddresses || [];
  const primaryEmailId = user?.primaryEmailAddress?.id;

  /* -------------------------- Helpers for reverif ------------------------- */

  const isSatisfied = (s: any) =>
    s === "verified" || s === "complete" || s === "satisfied";

  const resetReverify = () => {
    setReverifyState(undefined);
    setReverifyPhase("idle");
    setEmailChoices([]);
    setChosenEmail(null);
    setFirstCode("");
    setSecondChoices([]);
    setChosenSecond(null);
    setSecondCode("");
    setReverifyError("");
    setReverifyInfo("");
  };

  // swallow Clerk "cancelled" error so it doesn't spam the console
  const safeCancel = async () => {
    try {
      await reverifyState?.cancel?.();
    } catch (e: any) {
      // Silently ignore the user-cancel signal
      if (!isReverificationCancelled(e)) {
        // Optional: keep as debug, not error
        console.debug(e);
      }
    } finally {
      resetReverify();
    }
  };

  const isReverificationCancelled = (e: any) =>
    e?.code === "reverification_cancelled" ||
    e?.errors?.[0]?.code === "reverification_cancelled" ||
    /reverification_cancelled/i.test(e?.message || "");

  /* -------------------------- Reverification wrappers --------------------- */

  const addEmailAction = useReverification(
    async () => {
      if (!user || !newEmail) return;
      await user.createEmailAddress({ email: newEmail });
      await user.reload();
    },
    {
      onNeedsReverification: ({ level, complete, cancel }) => {
        setReverifyError("");
        setReverifyInfo("");
        setReverifyState({ inProgress: true, level, complete, cancel });
      },
    }
  );

  const setPrimaryAction = useReverification(
    async (emailId: string) => {
      if (!user) return;
      await user.update({ primaryEmailAddressId: emailId });
      await user.reload();
    },
    {
      onNeedsReverification: ({ level, complete, cancel }) => {
        setReverifyError("");
        setReverifyInfo("");
        setReverifyState({ inProgress: true, level, complete, cancel });
      },
    }
  );

  const removeEmailAction = useReverification(
    async (emailId: string) => {
      if (!user) return;
      const emailAddress = user.emailAddresses.find(
        (e: any) => e.id === emailId
      );
      if (emailAddress) {
        await emailAddress.destroy();
        await user.reload();
      }
    },
    {
      onNeedsReverification: ({ level, complete, cancel }) => {
        setReverifyError("");
        setReverifyInfo("");
        setReverifyState({ inProgress: true, level, complete, cancel });
      },
    }
  );

  const sendEmailVerifyAction = useReverification(
    async (emailId: string) => {
      if (!user) return;
      const emailAddress = user.emailAddresses.find(
        (e: any) => e.id === emailId
      );
      if (emailAddress) {
        await emailAddress.prepareVerification({ strategy: "email_code" });
        setVerificationEmailSent(emailId);
      }
    },
    {
      onNeedsReverification: ({ level, complete, cancel }) => {
        setReverifyError("");
        setReverifyInfo("");
        setReverifyState({ inProgress: true, level, complete, cancel });
      },
    }
  );

  /* ----------------------- Reverification start (email only) -------------- */

  useEffect(() => {
    const start = async () => {
      if (!reverifyState?.inProgress || !session) return;
      setReverifyError("");
      setReverifyInfo("");

      try {
        const res: any = await session.startVerification({
          level: reverifyState.level || "multi_factor",
        });

        if (isSatisfied(res?.status)) {
          reverifyState.complete();
          resetReverify();
          return;
        }

        // FIRST FACTOR – only allow EMAIL CODE (no password option)
        if (res?.status === "needs_first_factor") {
          const choices: FirstFactorEmailChoice[] = [];
          for (const f of res.supportedFirstFactors || []) {
            if (f.strategy === "email_code") {
              choices.push({
                strategy: "email_code",
                emailAddressId: f.emailAddressId,
                safeIdentifier: f.safeIdentifier,
              });
            }
          }

          if (choices.length === 0) {
            setReverifyError(
              "Email verification is required but unavailable for this account."
            );
            return;
          }

          setEmailChoices(choices);

          if (choices.length === 1) {
            // auto-select the only email method, but DO NOT auto-send the code
            setChosenEmail(choices[0]);
            setReverifyPhase("firstPrep");
          } else {
            setReverifyPhase("chooseEmail");
          }
          return;
        }

        // SECOND FACTOR – keep phone/totp/backup if requested by Clerk
        if (res?.status === "needs_second_factor") {
          const choices: SecondFactorChoice[] = [];
          for (const f of res.supportedSecondFactors || []) {
            if (f.strategy === "totp") choices.push({ strategy: "totp" });
            if (f.strategy === "backup_code")
              choices.push({ strategy: "backup_code" });
            if (f.strategy === "phone_code")
              choices.push({
                strategy: "phone_code",
                safeIdentifier: f.safeIdentifier,
              });
          }
          setSecondChoices(choices);
          setReverifyPhase("chooseSecond");
          return;
        }

        setReverifyError("Unable to begin verification. Please try again.");
      } catch (e: any) {
        setReverifyError(e?.message || "Failed to start verification.");
      }
    };

    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reverifyState?.inProgress]);

  /* --------------------------- Reverify handlers -------------------------- */

  const chooseEmailFactor = (c: FirstFactorEmailChoice) => {
    setChosenEmail(c);
    setFirstCode("");
    setReverifyInfo("");
    setReverifyPhase("firstPrep");
  };

  const sendFirstFactorCode = async () => {
    if (!session || !chosenEmail) return;
    setReverifyError("");
    try {
      await session.prepareFirstFactorVerification({
        strategy: "email_code",
        emailAddressId: chosenEmail.emailAddressId,
      });
      setReverifyInfo(
        `We sent a code to ${chosenEmail.safeIdentifier ?? "your email"}.`
      );
      setReverifyPhase("firstCode");
    } catch (e: any) {
      setReverifyError(e?.message || "Failed to send code. Please try again.");
    }
  };

  const attemptFirstFactor = async () => {
    if (!session || !chosenEmail) return;
    setReverifyError("");
    try {
      if (!firstCode) {
        setReverifyError("Enter the verification code.");
        return;
      }
      const res: any = await session.attemptFirstFactorVerification({
        strategy: "email_code",
        code: firstCode,
      });

      if (res?.status === "needs_second_factor") {
        const choices: SecondFactorChoice[] = [];
        for (const f of res.supportedSecondFactors || []) {
          if (f.strategy === "totp") choices.push({ strategy: "totp" });
          if (f.strategy === "backup_code")
            choices.push({ strategy: "backup_code" });
          if (f.strategy === "phone_code")
            choices.push({
              strategy: "phone_code",
              safeIdentifier: f.safeIdentifier,
            });
        }
        setSecondChoices(choices);
        setSecondCode("");
        setChosenSecond(null);
        setReverifyPhase("chooseSecond");
        return;
      }

      if (isSatisfied(res?.status)) {
        reverifyState?.complete();
        resetReverify();
        return;
      }

      setReverifyError("Verification did not complete. Please try again.");
    } catch (e: any) {
      setReverifyError(e?.message || "Verification failed. Please try again.");
    }
  };

  const chooseSecondFactor = (c: SecondFactorChoice) => {
    setChosenSecond(c);
    setSecondCode("");
    setReverifyInfo("");
    setReverifyPhase(c.strategy === "phone_code" ? "secondPrep" : "secondCode");
  };

  const sendSecondFactorCode = async () => {
    if (!session || !chosenSecond || chosenSecond.strategy !== "phone_code")
      return;
    setReverifyError("");
    try {
      await session.prepareSecondFactorVerification({ strategy: "phone_code" });
      setReverifyInfo(
        `We sent a code to ${chosenSecond.safeIdentifier ?? "your phone"}.`
      );
      setReverifyPhase("secondCode");
    } catch (e: any) {
      setReverifyError(e?.message || "Failed to send code. Please try again.");
    }
  };

  const attemptSecondFactor = async () => {
    if (!session || !chosenSecond) return;
    setReverifyError("");
    try {
      if (!secondCode) {
        setReverifyError("Enter the verification code.");
        return;
      }
      const res: any = await session.attemptSecondFactorVerification({
        strategy: chosenSecond.strategy,
        code: secondCode,
      } as any);

      if (isSatisfied(res?.status)) {
        reverifyState?.complete();
        resetReverify();
        return;
      }

      setReverifyError("Verification did not complete. Please try again.");
    } catch (e: any) {
      setReverifyError(e?.message || "Verification failed. Please try again.");
    }
  };

  /* --------------------------- Email actions UI --------------------------- */

  const handleAddEmail = async () => {
    if (!newEmail) return;
    setIsLoading(true);
    try {
      await addEmailAction();
      setNewEmail("");
      setIsAddingEmail(false);
    } catch (e: any) {
      if (!isReverificationCancelled(e)) {
        console.debug("addEmailAction failed:", e);
      }
      // If cancelled: do nothing; we intentionally swallow it
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveEmail = async (emailId: string) => {
    setIsLoading(true);
    try {
      await removeEmailAction(emailId);
    } catch (e: any) {
      if (!isReverificationCancelled(e)) {
        console.debug("removeEmailAction failed:", e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPrimary = async (emailId: string) => {
    setIsLoading(true);
    try {
      await setPrimaryAction(emailId);
    } catch (e: any) {
      if (!isReverificationCancelled(e)) {
        console.debug("setPrimaryAction failed:", e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerification = async (emailId: string) => {
    setIsLoading(true);
    try {
      await sendEmailVerifyAction(emailId);
      const e = (user?.emailAddresses || []).find((x: any) => x.id === emailId);
      setVerifyModal({
        open: true,
        emailId,
        code: "",
        error: "",
        info: `We sent a code to ${e?.emailAddress ?? "your email"}.`,
      });
    } catch (e: any) {
      if (!isReverificationCancelled(e)) {
        console.debug("sendEmailVerifyAction failed:", e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const attemptEmailVerification = async () => {
    if (!user || !verifyModal.emailId || !verifyModal.code) return;
    try {
      const emailAddress = user.emailAddresses.find(
        (e: any) => e.id === verifyModal.emailId
      );
      if (!emailAddress) {
        setVerifyModal((p) => ({ ...p, error: "Email not found. Try again." }));
        return;
      }

      // Clerk v5 method
      if (typeof emailAddress.attemptVerification === "function") {
        await emailAddress.attemptVerification({ code: verifyModal.code });
      } else {
        // Legacy fallback (rare)
        const maybeVerify = (emailAddress as any)?.verify;
        if (typeof maybeVerify === "function") {
          await maybeVerify({ code: verifyModal.code });
        } else {
          throw new Error(
            "No supported verification method on this SDK version."
          );
        }
      }

      await user.reload();
      setVerifyModal({
        open: false,
        emailId: null,
        code: "",
        error: "",
        info: "",
      });
    } catch (e: any) {
      setVerifyModal((p) => ({
        ...p,
        error:
          e?.errors?.[0]?.message ||
          e?.message ||
          "Verification failed. Please try again.",
      }));
    }
  };

  const handleCancelAdd = () => {
    setNewEmail("");
    setIsAddingEmail(false);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Loading email settings...
          </p>
        </CardContent>
      </Card>
    );
  }

  /* ----------------------------------- UI --------------------------------- */

  return (
    <div className="space-y-6">
      {/* Email Addresses */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
              <Mail className="h-5 w-5" />
            </div>
            Email Addresses
          </CardTitle>
          <CardDescription>
            Manage your email addresses and email preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* List */}
          <div className="space-y-3">
            {emailAddresses.map((email: any) => {
              const addedDate = getEmailAddedDate(email);
              const primaryEmailId = user.primaryEmailAddress?.id;
              return (
                <div
                  key={email.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-slate-50 dark:bg-slate-800"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{email.emailAddress}</p>
                      {email.id === primaryEmailId && (
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800 border-blue-200"
                        >
                          Primary
                        </Badge>
                      )}
                      {email.verification?.status === "verified" ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 border-green-200"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-yellow-100 text-yellow-800 border-yellow-200"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                    <AddedOn date={addedDate} />
                  </div>

                  <div className="flex items-center gap-2">
                    {email.verification?.status !== "verified" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendVerification(email.id)}
                        disabled={isLoading}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {verificationEmailSent === email.id ? "Sent" : "Verify"}
                      </Button>
                    )}

                    {email.id !== primaryEmailId &&
                      email.verification?.status === "verified" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPrimary(email.id)}
                          disabled={isLoading}
                        >
                          Set Primary
                        </Button>
                      )}

                    {email.id !== primaryEmailId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveEmail(email.id)}
                        disabled={isLoading}
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        aria-label="Remove email"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Add new */}
          <div className="space-y-4">
            {!isAddingEmail ? (
              <Button
                variant="outline"
                onClick={() => setIsAddingEmail(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Email Address
              </Button>
            ) : (
              <div className="space-y-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                <div className="space-y-2">
                  <Label htmlFor="newEmail" className="font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter email address"
                    autoComplete="email"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddEmail}
                    disabled={isLoading || !newEmail}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isLoading ? "Adding..." : "Add Email"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelAdd}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Information about the notifications you'll receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Security & Account Notifications
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  We'll send important notifications about your account
                  security, login attempts, password changes, and other critical
                  account activities to your primary email address.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------------------- Reverification (email-only) ------------------- */}
      <Dialog
        open={!!reverifyState?.inProgress}
        onOpenChange={(open) => {
          if (!open) void safeCancel();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center">
              <Shield className="h-5 w-5" />
              Additional verification required
            </DialogTitle>
            <DialogDescription className="text-center">
              Follow the steps below to continue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reverifyError && (
              <div className="p-3 rounded-lg border text-sm bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                {reverifyError}
              </div>
            )}
            {reverifyInfo && (
              <div className="p-3 rounded-lg border text-sm bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
                {reverifyInfo}
              </div>
            )}

            {/* Choose email (if multiple) */}
            {reverifyPhase === "chooseEmail" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Choose a verification method:
                </p>
                <div className="space-y-2">
                  {emailChoices.map((c, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="w-full justify-start py-3 text-left"
                      onClick={() => chooseEmailFactor(c)}
                      aria-label={`Email code ${
                        c.safeIdentifier ? `(${c.safeIdentifier})` : ""
                      }`}
                    >
                      Email code{" "}
                      {c.safeIdentifier ? `(${c.safeIdentifier})` : ""}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Send email code prompt */}
            {reverifyPhase === "firstPrep" && chosenEmail && (
              <div className="space-y-3">
                <p className="text-sm">
                  We’ll email a code to{" "}
                  {chosenEmail.safeIdentifier ?? "your address"}.
                </p>
                <div className="flex gap-2">
                  <Button onClick={sendFirstFactorCode} className="flex-1">
                    Send code
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setReverifyPhase("chooseEmail")}
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}

            {/* Enter email code */}
            {reverifyPhase === "firstCode" && (
              <div className="space-y-3">
                <Label
                  htmlFor="firstCode"
                  className="text-sm font-medium block"
                >
                  Verification code
                </Label>
                <Input
                  id="firstCode"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={firstCode}
                  onChange={(e) =>
                    setFirstCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  maxLength={6}
                  className="text-center text-lg tracking-wider font-mono"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    onClick={attemptFirstFactor}
                    disabled={firstCode.length < 4}
                    className="flex-1"
                  >
                    Verify
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setReverifyPhase("firstPrep")}
                  >
                    Resend
                  </Button>
                </div>
              </div>
            )}

            {/* Second factor (if Clerk demands it) */}
            {reverifyPhase === "chooseSecond" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Choose a second factor:
                </p>
                <div className="space-y-2">
                  {secondChoices.map((c, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="w-full justify-start py-3 text-left"
                      onClick={() => chooseSecondFactor(c)}
                    >
                      {c.strategy === "totp" && "Authenticator app (TOTP)"}
                      {c.strategy === "backup_code" && "Backup code"}
                      {c.strategy === "phone_code" &&
                        `SMS code ${
                          c.safeIdentifier ? `(${c.safeIdentifier})` : ""
                        }`}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {reverifyPhase === "secondPrep" &&
              chosenSecond?.strategy === "phone_code" && (
                <div className="space-y-3">
                  <p className="text-sm">
                    We’ll text a code to{" "}
                    {chosenSecond.safeIdentifier ?? "your phone"}.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={sendSecondFactorCode} className="flex-1">
                      Send code
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setReverifyPhase("chooseSecond")}
                    >
                      Back
                    </Button>
                  </div>
                </div>
              )}

            {(reverifyPhase === "secondCode" ||
              reverifyPhase === "secondPrep") &&
              chosenSecond && (
                <div className="space-y-3">
                  <Label
                    htmlFor="secondCode"
                    className="text-sm font-medium block"
                  >
                    {chosenSecond.strategy === "totp"
                      ? "6-digit code"
                      : "Verification code"}
                  </Label>
                  <Input
                    id="secondCode"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={secondCode}
                    onChange={(e) =>
                      setSecondCode(
                        e.target.value.replace(/\D/g, "").slice(0, 8)
                      )
                    }
                    maxLength={8}
                    className="text-center text-lg tracking-wider font-mono"
                    autoFocus={reverifyPhase === "secondCode"}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={attemptSecondFactor}
                      disabled={secondCode.length < 4}
                      className="flex-1"
                    >
                      Verify & Continue
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setReverifyPhase("chooseSecond")}
                    >
                      Back
                    </Button>
                  </div>
                </div>
              )}

            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => void safeCancel()}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------------------- Verify specific email (code) ------------------ */}
      <Dialog
        open={verifyModal.open}
        onOpenChange={(open) => {
          if (!open)
            setVerifyModal({
              open: false,
              emailId: null,
              code: "",
              error: "",
              info: "",
            });
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify email</DialogTitle>
            <DialogDescription>
              {verifyModal.info || "Enter the code we sent to your email."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {verifyModal.error && (
              <div className="p-3 rounded-lg border text-sm bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                {verifyModal.error}
              </div>
            )}
            <Label
              htmlFor="emailVerifyCode"
              className="text-sm font-medium block"
            >
              Verification code
            </Label>
            <Input
              id="emailVerifyCode"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={verifyModal.code}
              onChange={(e) =>
                setVerifyModal((p) => ({
                  ...p,
                  code: e.target.value.replace(/\D/g, "").slice(0, 6),
                }))
              }
              maxLength={6}
              className="text-center text-lg tracking-wider font-mono"
              autoFocus
            />

            <div className="flex gap-2">
              <Button
                onClick={attemptEmailVerification}
                disabled={verifyModal.code.length !== 6}
                className="flex-1"
              >
                Verify
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setVerifyModal({
                    open: false,
                    emailId: null,
                    code: "",
                    error: "",
                    info: "",
                  })
                }
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
