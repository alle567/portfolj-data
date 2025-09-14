"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUser, useSession, useReverification } from "@clerk/nextjs";
import QRCode from "qrcode";

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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Shield,
  Key,
  Smartphone,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Copy,
  QrCode,
} from "lucide-react";

/* --------------------------- Small shared components --------------------------- */

function PasswordReq({ ok, label }: { ok: boolean; label: string }) {
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

/** 6/8-box OTP input with auto-advance and safe auto-submit (passes computed code) */
function OtpBoxes({
  value,
  onChange,
  onComplete,
  length = 6,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const v = (value || "").padEnd(length, " ").slice(0, length);

  return (
    <div
      className="flex gap-2 justify-center"
      aria-label="One-time code"
      role="group"
    >
      {Array.from({ length }).map((_, i) => (
        <Input
          key={i}
          ref={(el) => {
            refs.current[i] = el; // callback ref must return void
          }}
          value={v[i] === " " ? "" : v[i]}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={1}
          autoFocus={autoFocus && i === 0}
          className="w-10 text-center font-mono"
          onChange={(e) => {
            const digit = e.target.value.replace(/\D/g, "").slice(0, 1);
            // Build the next code string locally to avoid state lag
            const next = (
              value.slice(0, i) +
              digit +
              value.slice(i + 1)
            ).replace(/\s/g, "");
            onChange(next);
            if (digit && i < length - 1) refs.current[i + 1]?.focus();
            if (digit && i === length - 1 && next.length === length) {
              onComplete?.(next); // pass computed complete code
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !v[i] && i > 0)
              refs.current[i - 1]?.focus();
            if (e.key === "Enter" && value.length === length)
              onComplete?.(value);
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------- Reverification Dialog (UI) -------------------------- */

function ReverifyDialog({
  open,
  phase,
  destination,
  error,
  code,
  password,
  cooldown,
  onChangeCode,
  onChangePassword,
  onAttemptFirst,
  onAttemptSecond,
  onResend,
  onCancel,
}: {
  open: boolean;
  phase: "first" | "second" | "complete" | "idle";
  destination: string;
  error: string;
  code: string;
  password: string;
  cooldown: number;
  onChangeCode: (v: string) => void;
  onChangePassword: (v: string) => void;
  onAttemptFirst: (codeOverride?: string) => void;
  onAttemptSecond: (codeOverride?: string) => void;
  onResend: () => void;
  onCancel: () => void;
}) {
  const isCodePhase = phase === "first" && destination !== "password";
  const isSecond = phase === "second";
  const otpLen =
    isSecond && destination.toLowerCase().includes("backup") ? 8 : 6;

  const canResend =
    (phase === "first" &&
      (destination.includes("@") || /\d/.test(destination))) ||
    (phase === "second" && /\d/.test(destination));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center">
            <Shield className="h-5 w-5" />
            Additional verification required
          </DialogTitle>
          <DialogDescription className="text-center">
            {phase === "first"
              ? destination === "password"
                ? "Enter your password to continue."
                : `Enter the code we sent to ${destination}.`
              : phase === "second"
              ? `Enter the code from your ${destination}.`
              : "Verifying…"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!!error && (
            <div
              role="status"
              aria-live="polite"
              className="p-3 rounded-lg border text-sm bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
            >
              {error}
            </div>
          )}

          {phase === "first" && destination === "password" && (
            <div className="space-y-3">
              <Label
                htmlFor="reverifyPassword"
                className="text-sm font-medium block"
              >
                Password
              </Label>
              <Input
                id="reverifyPassword"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => onChangePassword(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={() => onAttemptFirst()} className="flex-1">
                  Continue
                </Button>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  aria-label="Cancel verification"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {isCodePhase && (
            <div className="space-y-3">
              <Label className="text-sm font-medium block">
                Verification code
              </Label>
              <OtpBoxes
                value={code}
                onChange={(v) => onChangeCode(v.replace(/\D/g, "").slice(0, 6))}
                onComplete={(full) => onAttemptFirst(full)}
                length={6}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => onAttemptFirst()}
                  disabled={code.length < 4}
                  className="flex-1"
                  aria-label="Verify code"
                >
                  Verify
                </Button>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  aria-label="Cancel verification"
                >
                  Cancel
                </Button>
              </div>
              {canResend && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 h-7"
                    disabled={cooldown > 0}
                    onClick={onResend}
                    aria-label="Resend code"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {isSecond && (
            <div className="space-y-3">
              <Label className="text-sm font-medium block">
                {destination.toLowerCase().includes("authenticator")
                  ? "6-digit code"
                  : destination.toLowerCase().includes("backup")
                  ? "Backup code"
                  : "Verification code"}
              </Label>
              <OtpBoxes
                value={code}
                onChange={(v) =>
                  onChangeCode(v.replace(/\D/g, "").slice(0, otpLen))
                }
                onComplete={(full) => onAttemptSecond(full)}
                length={otpLen}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => onAttemptSecond()}
                  disabled={code.length < 4}
                  className="flex-1"
                  aria-label="Verify and continue"
                >
                  Verify & Continue
                </Button>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  aria-label="Cancel verification"
                >
                  Cancel
                </Button>
              </div>
              {canResend && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 h-7"
                    disabled={cooldown > 0}
                    onClick={onResend}
                    aria-label="Resend code"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------ Main component ------------------------------- */

interface SecuritySectionProps {
  user: any; // compatibility with your current prop signature
}

export function SecuritySection({ user: _initialUser }: SecuritySectionProps) {
  const { user } = useUser();
  const { session } = useSession();

  // mounted guard
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // UI state
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [showCurrentPassword, setShowCurrentPassword] =
    useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Notifications
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [passwordNotification, setPasswordNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [twoFANotification, setTwoFANotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [modalNotification, setModalNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Disable 2FA confirmation
  const [showDisable2FADialog, setShowDisable2FADialog] =
    useState<boolean>(false);

  // TOTP setup modal + data (store secret in ref only)
  const secretRef = useRef<string>("");
  const [qrCodeModal, setQrCodeModal] = useState<{
    isOpen: boolean;
    qrCodeUri: string;
  }>({
    isOpen: false,
    qrCodeUri: "",
  });
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [totpVerificationCode, setTotpVerificationCode] = useState<string>("");
  const [totpResource, setTotpResource] = useState<any>(null);

  // in-flight guards to avoid duplicate POSTs
  const attemptingFirstRef = useRef(false);
  const attemptingSecondRef = useRef(false);
  const attemptingTotpRef = useRef(false);

  // Password form
  const [passwordData, setPasswordData] = useState<{
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>({ currentPassword: "", newPassword: "", confirmPassword: "" });

  // Password policy
  const passwordPolicy = useMemo(() => {
    const lengthOK = passwordData.newPassword.length >= 10;
    const upperOK = /[A-Z]/.test(passwordData.newPassword);
    const numberOK = /\d/.test(passwordData.newPassword);
    const specialOK = /[^A-Za-z0-9]/.test(passwordData.newPassword);
    return {
      lengthOK,
      upperOK,
      numberOK,
      specialOK,
      all: lengthOK && upperOK && numberOK && specialOK,
    };
  }, [passwordData.newPassword]);

  const passwordMismatch =
    passwordData.confirmPassword.length > 0 &&
    passwordData.newPassword !== passwordData.confirmPassword;

  // Reverification state + guards
  type ReverifyState =
    | undefined
    | {
        inProgress: boolean;
        level: any;
        complete: () => void;
        cancel: () => void;
      };
  const [reverifyState, setReverifyState] = useState<ReverifyState>(undefined);
  const reverifyRef = useRef<any>(undefined);
  const reverifyMetaRef = useRef<{
    firstEmailAddressId?: string;
    firstPhoneNumberId?: string;
    secondHasPhone?: boolean;
  }>({});
  const preparedFirstRef = useRef<boolean>(false);
  const preparedSecondRef = useRef<boolean>(false);

  const [reverifyPhase, setReverifyPhase] = useState<
    "first" | "second" | "complete" | "idle"
  >("idle");
  const [reverifyCode, setReverifyCode] = useState<string>("");
  const [reverifyPassword, setReverifyPassword] = useState<string>("");
  const [reverifyDestination, setReverifyDestination] = useState<string>("");
  const [reverifyError, setReverifyError] = useState<string>("");

  // Resend cooldown
  const [cooldown, setCooldown] = useState<number>(0);
  useEffect(() => {
    if (!cooldown) return;
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // QR image generation
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    const generateQRCode = () => {
      if (qrCodeModal.isOpen && qrCodeModal.qrCodeUri) {
        QRCode.toDataURL(qrCodeModal.qrCodeUri, {
          width: 256,
          margin: 2,
          color: { dark: "#000000", light: "#FFFFFF" },
        })
          .then((url) => {
            if (!mounted.current) return;
            setQrCodeDataUrl(url);
          })
          .catch(() => {});
      } else {
        setQrCodeDataUrl("");
      }
    };
    generateQRCode();
    if (qrCodeModal.isOpen && qrCodeModal.qrCodeUri) {
      intervalId = setInterval(generateQRCode, 30000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrCodeModal.isOpen, qrCodeModal.qrCodeUri]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  };

  if (!user || !session) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Loading security settings...
          </p>
        </CardContent>
      </Card>
    );
  }

  const has2FA = user.twoFactorEnabled;
  const passwordLastChanged =
    user.passwordEnabled && user.updatedAt ? new Date(user.updatedAt) : null;
  const statusIsVerified = (s: any) =>
    s === "verified" || s === "complete" || s === "satisfied";

  /* ---------------------------- useReverification ---------------------------- */

  const resetReverifyGuards = () => {
    preparedFirstRef.current = false;
    preparedSecondRef.current = false;
    attemptingFirstRef.current = false;
    attemptingSecondRef.current = false;
    setCooldown(0);
    reverifyMetaRef.current = {};
  };

  const changePasswordAction = useReverification(
    async () =>
      user.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }),
    {
      onNeedsReverification: ({
        level,
        complete,
        cancel,
      }: {
        level: any;
        complete: () => void;
        cancel: () => void;
      }) => {
        setReverifyError("");
        setReverifyCode("");
        setReverifyPassword("");
        setReverifyDestination("");
        resetReverifyGuards();
        setReverifyState({ inProgress: true, level, complete, cancel });
      },
    }
  );

  const createTOTPAction = useReverification(async () => user.createTOTP(), {
    onNeedsReverification: ({
      level,
      complete,
      cancel,
    }: {
      level: any;
      complete: () => void;
      cancel: () => void;
    }) => {
      setReverifyError("");
      setReverifyCode("");
      setReverifyPassword("");
      setReverifyDestination("");
      resetReverifyGuards();
      setReverifyState({ inProgress: true, level, complete, cancel });
    },
  });

  const disableTOTPAction = useReverification(async () => user.disableTOTP(), {
    onNeedsReverification: ({
      level,
      complete,
      cancel,
    }: {
      level: any;
      complete: () => void;
      cancel: () => void;
    }) => {
      setReverifyError("");
      setReverifyCode("");
      setReverifyPassword("");
      setReverifyDestination("");
      resetReverifyGuards();
      setReverifyState({ inProgress: true, level, complete, cancel });
    },
  });

  /* ------------------------------ Actions ------------------------------ */

  const handlePasswordChange = async () => {
    if (!passwordPolicy.all) {
      setPasswordNotification({
        type: "error",
        message: "Please meet the password requirements",
      });
      return;
    }
    if (passwordMismatch) {
      setPasswordNotification({
        type: "error",
        message: "Passwords don't match",
      });
      return;
    }
    if (!passwordData.currentPassword) {
      setPasswordNotification({
        type: "error",
        message: "Current password is required",
      });
      return;
    }

    setIsLoading(true);
    setPasswordNotification(null);
    try {
      await changePasswordAction();
      if (!mounted.current) return;
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordNotification({
        type: "success",
        message: "Password updated successfully",
      });
    } catch (e: any) {
      const code = e?.errors?.[0]?.code || "";
      if (code === "form_password_incorrect") {
        setPasswordNotification({
          type: "error",
          message: "Current password is incorrect",
        });
      } else if (code === "form_password_pwned") {
        setPasswordNotification({
          type: "error",
          message:
            "This password has been found in a data breach. Please choose a different one.",
        });
      } else {
        setPasswordNotification({
          type: "error",
          message: e?.message
            ? `Failed to update password: ${e.message}`
            : "Failed to update password",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASetup = async () => {
    if (!user.passwordEnabled) {
      setNotification({
        type: "error",
        message:
          "2FA setup requires a password. Set a password first in the section above.",
      });
      return;
    }

    setIsLoading(true);
    setTwoFANotification(null);
    try {
      const totp = await createTOTPAction();
      if (!mounted.current) return;
      setTotpResource(totp);
      secretRef.current = totp?.secret || "";
      setQrCodeModal({ isOpen: true, qrCodeUri: totp?.uri || "" });
    } catch (e: any) {
      setTwoFANotification({
        type: "error",
        message: e?.message || "Failed to start 2FA setup",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTotpVerification = async (codeOverride?: string) => {
    if (!user || !totpResource) return;
    const code = (codeOverride ?? totpVerificationCode).replace(/\D/g, "");
    if (code.length < 6) return;
    if (attemptingTotpRef.current) return;
    attemptingTotpRef.current = true;

    setModalNotification(null);
    try {
      if (typeof totpResource.attemptVerification === "function") {
        await totpResource.attemptVerification({ code });
      } else if (typeof totpResource.verify === "function") {
        await totpResource.verify({ code });
      } else {
        await user.verifyTOTP({ code });
      }

      if (!mounted.current) return;
      setQrCodeModal({ isOpen: false, qrCodeUri: "" });
      setTotpVerificationCode("");
      setTotpResource(null);
      setQrCodeDataUrl("");
      secretRef.current = "";
      await user.reload();
      setTwoFANotification({
        type: "success",
        message: "2FA has been successfully enabled!",
      });
    } catch (e: any) {
      const c = (e?.errors?.[0]?.code || "").toLowerCase();
      if (c === "form_code_incorrect") {
        setModalNotification({
          type: "error",
          message:
            "The verification code is incorrect. Please try again. Make sure your phone's date/time is set automatically.",
        });
      } else if ((e?.message || "").toLowerCase().includes("expired")) {
        setModalNotification({
          type: "error",
          message:
            "That code expired. Enter a fresh code from your app. Also ensure your phone time is correct.",
        });
      } else {
        setModalNotification({
          type: "error",
          message: e?.message
            ? `Verification failed: ${e.message}`
            : "Verification failed. Please try again.",
        });
      }
    } finally {
      attemptingTotpRef.current = false;
    }
  };

  const handleDisable2FA = async () => {
    setIsLoading(true);
    setNotification(null);
    try {
      await disableTOTPAction();
      if (!mounted.current) return;
      await user.reload();
      setShowDisable2FADialog(false);
      setNotification({ type: "success", message: "2FA has been disabled." });
    } catch (e: any) {
      if (!mounted.current) return;
      setShowDisable2FADialog(false);
      setNotification({
        type: "error",
        message: e?.message
          ? `Failed to disable 2FA: ${e.message}`
          : "Failed to disable 2FA",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPassword = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setIsChangingPassword(false);
    setPasswordNotification(null);
  };

  /* ------------------------ Reverification effect (guards) ------------------------ */
  useEffect(() => {
    const start = async () => {
      if (!reverifyState?.inProgress || !session) return;

      setReverifyError("");
      setReverifyCode("");
      setReverifyPassword("");
      setReverifyDestination("");

      try {
        const res: any = await session.startVerification({
          level: reverifyState.level || "multi_factor",
        });
        reverifyRef.current = res;

        if (statusIsVerified(res.status)) {
          reverifyState.complete();
          setReverifyState(undefined);
          setReverifyPhase("complete");
          return;
        }

        if (res.status === "needs_first_factor") {
          const firstEmail = (res.supportedFirstFactors || []).find(
            (f: any) => f.strategy === "email_code"
          );
          const firstPhone = (res.supportedFirstFactors || []).find(
            (f: any) => f.strategy === "phone_code"
          );

          setReverifyPhase("first");

          if (firstEmail) {
            setReverifyDestination(firstEmail.safeIdentifier || "");
            reverifyMetaRef.current.firstEmailAddressId =
              firstEmail.emailAddressId;
            if (!preparedFirstRef.current) {
              preparedFirstRef.current = true;
              await session.prepareFirstFactorVerification({
                strategy: "email_code",
                emailAddressId: firstEmail.emailAddressId,
              });
              setCooldown(30);
            }
            return;
          }

          if (firstPhone) {
            setReverifyDestination(firstPhone.safeIdentifier || "");
            reverifyMetaRef.current.firstPhoneNumberId =
              firstPhone.phoneNumberId;
            if (!preparedFirstRef.current) {
              preparedFirstRef.current = true;
              await session.prepareFirstFactorVerification({
                strategy: "phone_code",
                phoneNumberId: firstPhone.phoneNumberId,
              } as any);
              setCooldown(30);
            }
            return;
          }

          // fallback to password
          setReverifyDestination("password");
          return;
        }

        if (res.status === "needs_second_factor") {
          setReverifyPhase("second");
          const hasPhone = (res.supportedSecondFactors || []).some(
            (f: any) => f.strategy === "phone_code"
          );
          reverifyMetaRef.current.secondHasPhone = !!hasPhone;

          if (hasPhone) {
            const phone = (res.supportedSecondFactors || []).find(
              (f: any) => f.strategy === "phone_code"
            );
            setReverifyDestination(phone?.safeIdentifier || "");
            if (!preparedSecondRef.current) {
              preparedSecondRef.current = true;
              await session.prepareSecondFactorVerification({
                strategy: "phone_code",
              });
              setCooldown(30);
            }
          } else {
            const totp = (res.supportedSecondFactors || []).find(
              (f: any) => f.strategy === "totp"
            );
            const backup = (res.supportedSecondFactors || []).find(
              (f: any) => f.strategy === "backup_code"
            );
            if (totp) setReverifyDestination("authenticator app");
            else if (backup) setReverifyDestination("backup code");
          }
          return;
        }
      } catch (e: any) {
        setReverifyError(e?.message || "Failed to start verification.");
      }
    };

    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reverifyState?.inProgress, session?.id]);

  const attemptFirstFactor = async (codeOverride?: string) => {
    if (!session) return;
    if (attemptingFirstRef.current) return;
    setReverifyError("");
    try {
      attemptingFirstRef.current = true;

      let res: any;
      if (reverifyDestination === "password") {
        if (!reverifyPassword) {
          setReverifyError("Enter your password to continue.");
          return;
        }
        res = await session.attemptFirstFactorVerification({
          strategy: "password",
          password: reverifyPassword,
        });
      } else {
        const code = (codeOverride ?? reverifyCode).replace(/\D/g, "");
        if (!code) {
          setReverifyError("Enter the verification code.");
          return;
        }
        const strategy = reverifyDestination.includes("@")
          ? "email_code"
          : "phone_code";
        res = await session.attemptFirstFactorVerification({ strategy, code });
      }
      reverifyRef.current = res;

      if (res?.status === "needs_second_factor") {
        setReverifyPhase("second");
        const hasPhone = (res.supportedSecondFactors || []).some(
          (f: any) => f.strategy === "phone_code"
        );
        reverifyMetaRef.current.secondHasPhone = !!hasPhone;
        if (hasPhone) {
          setReverifyDestination(
            (res.supportedSecondFactors || []).find(
              (f: any) => f.strategy === "phone_code"
            )?.safeIdentifier || ""
          );
          if (!preparedSecondRef.current) {
            preparedSecondRef.current = true;
            await session.prepareSecondFactorVerification({
              strategy: "phone_code",
            });
            setCooldown(30);
          }
        } else {
          const totp = (res.supportedSecondFactors || []).find(
            (f: any) => f.strategy === "totp"
          );
          const backup = (res.supportedSecondFactors || []).find(
            (f: any) => f.strategy === "backup_code"
          );
          if (totp) setReverifyDestination("authenticator app");
          else if (backup) setReverifyDestination("backup code");
        }
        setReverifyCode("");
        setReverifyPassword("");
        return;
      }

      if (statusIsVerified(res?.status)) {
        reverifyState?.complete();
        setReverifyState(undefined);
        setReverifyPhase("complete");
        resetReverifyGuards();
      }
    } catch (e: any) {
      setReverifyError(e?.message || "Verification failed. Please try again.");
    } finally {
      attemptingFirstRef.current = false;
    }
  };

  const attemptSecondFactor = async (codeOverride?: string) => {
    if (!session) return;
    if (attemptingSecondRef.current) return;
    setReverifyError("");
    try {
      attemptingSecondRef.current = true;

      const code = (codeOverride ?? reverifyCode).replace(/\D/g, "");
      if (!code) {
        setReverifyError("Enter the verification code.");
        return;
      }

      let strategy: "totp" | "phone_code" | "backup_code" = "totp";
      if (
        reverifyDestination === "backup code" ||
        reverifyDestination.toLowerCase().includes("backup")
      ) {
        strategy = "backup_code";
      } else if (!reverifyDestination.toLowerCase().includes("authenticator")) {
        strategy = "phone_code";
      }

      const res: any = await session.attemptSecondFactorVerification({
        strategy,
        code,
      } as any);

      if (statusIsVerified(res?.status)) {
        reverifyState?.complete();
        setReverifyState(undefined);
        setReverifyPhase("complete");
        resetReverifyGuards();
        return;
      }

      setReverifyError("Verification did not complete. Please try again.");
    } catch (e: any) {
      setReverifyError(e?.message || "Verification failed. Please try again.");
    } finally {
      attemptingSecondRef.current = false;
    }
  };

  const resendVerificationCode = async () => {
    if (!session || cooldown > 0) return;
    try {
      if (reverifyPhase === "first") {
        if (
          reverifyDestination.includes("@") &&
          reverifyMetaRef.current.firstEmailAddressId
        ) {
          await session.prepareFirstFactorVerification({
            strategy: "email_code",
            emailAddressId: reverifyMetaRef.current.firstEmailAddressId!,
          });
        } else if (reverifyMetaRef.current.firstPhoneNumberId) {
          await session.prepareFirstFactorVerification({
            strategy: "phone_code",
            phoneNumberId: reverifyMetaRef.current.firstPhoneNumberId!,
          } as any);
        }
      } else if (
        reverifyPhase === "second" &&
        reverifyMetaRef.current.secondHasPhone
      ) {
        await session.prepareSecondFactorVerification({
          strategy: "phone_code",
        });
      }
      setCooldown(30);
    } catch {
      // ignore resend errors
    }
  };

  /* ----------------------------------- UI ----------------------------------- */

  return (
    <div className="space-y-6">
      {/* Toast-like notification */}
      {notification && !qrCodeModal.isOpen && !reverifyState?.inProgress && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-lg border ${
            notification.type === "success"
              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
              : notification.type === "error"
              ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
              : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="font-medium">{notification.message}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotification(null)}
              className="h-auto p-1 hover:bg-transparent"
              aria-label="Dismiss notification"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Password Security */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Password Security</CardTitle>
                <CardDescription>
                  Manage your account password and security settings
                </CardDescription>
              </div>
            </div>

            {/* Manual re-verify (step-up) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setReverifyState({
                  inProgress: true,
                  level: "multi_factor",
                  complete: () =>
                    setNotification({
                      type: "success",
                      message: "Session re-verified.",
                    }),
                  cancel: () =>
                    setNotification({
                      type: "info",
                      message: "Re-verification canceled.",
                    }),
                })
              }
              aria-label="Re-verify session"
            >
              Re-verify session
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {passwordNotification && (
            <div
              role="status"
              aria-live="polite"
              className={`p-4 rounded-lg border ${
                passwordNotification.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                  : passwordNotification.type === "error"
                  ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                  : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium whitespace-pre-line">
                  {passwordNotification.message}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPasswordNotification(null)}
                  className="h-auto p-1 hover:bg-transparent flex-shrink-0"
                  aria-label="Dismiss notification"
                >
                  ×
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border">
            <div className="space-y-1">
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted-foreground">
                {passwordLastChanged
                  ? `Last changed ${passwordLastChanged.toLocaleDateString()}`
                  : "Password not set"}
              </p>
            </div>
            {!isChangingPassword && (
              <Button
                variant="outline"
                onClick={() => setIsChangingPassword(true)}
                disabled={!has2FA}
                title={
                  !has2FA
                    ? "Two-factor authentication must be enabled before changing your password"
                    : ""
                }
              >
                Change Password
              </Button>
            )}
          </div>

          {!has2FA && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="font-medium text-amber-700 dark:text-amber-300">
                  Two-Factor Authentication Required
                </p>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                You must enable two-factor authentication before you can change
                your password.
              </p>
            </div>
          )}

          {isChangingPassword && (
            <div className="space-y-4 border-t pt-4 bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="font-medium">
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      placeholder="Enter current password"
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowCurrentPassword((v) => !v)}
                      aria-label={
                        showCurrentPassword
                          ? "Hide current password"
                          : "Show current password"
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      placeholder="Enter new password"
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowNewPassword((v) => !v)}
                      aria-label={
                        showNewPassword
                          ? "Hide new password"
                          : "Show new password"
                      }
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {passwordData.newPassword.length > 0 && (
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <p className="mb-2 font-medium text-sm">
                        Password requirements
                      </p>
                      <ul className="space-y-1">
                        <PasswordReq
                          ok={passwordPolicy.lengthOK}
                          label="At least 10 characters"
                        />
                        <PasswordReq
                          ok={passwordPolicy.upperOK}
                          label="Contains an uppercase letter (A–Z)"
                        />
                        <PasswordReq
                          ok={passwordPolicy.numberOK}
                          label="Contains a number (0–9)"
                        />
                        <PasswordReq
                          ok={passwordPolicy.specialOK}
                          label="Contains a special character (!@#$…)"
                        />
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-medium">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  {passwordMismatch && (
                    <p className="text-sm text-red-600 mt-1">
                      Passwords do not match
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={
                      isLoading ||
                      !passwordData.currentPassword ||
                      !passwordData.newPassword ||
                      !passwordData.confirmPassword ||
                      !passwordPolicy.all ||
                      passwordMismatch
                    }
                    aria-label="Update password"
                  >
                    {isLoading ? "Updating..." : "Update Password"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelPassword}
                    aria-label="Cancel password change"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
              <Smartphone className="h-5 w-5" />
            </div>
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {twoFANotification && (
            <div
              role="status"
              aria-live="polite"
              className={`p-4 rounded-lg border ${
                twoFANotification.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                  : twoFANotification.type === "error"
                  ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                  : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium whitespace-pre-line">
                  {twoFANotification.message}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTwoFANotification(null)}
                  className="h-auto p-1 hover:bg-transparent flex-shrink-0"
                  aria-label="Dismiss notification"
                >
                  ×
                </Button>
              </div>
            </div>
          )}

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <p className="font-medium">Authenticator App</p>
                {has2FA ? (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 border-green-200"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800 border-yellow-200"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Disabled
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                {!has2FA && (
                  <Button
                    variant="default"
                    onClick={handle2FASetup}
                    disabled={isLoading}
                    aria-label="Enable 2FA"
                  >
                    Enable 2FA
                  </Button>
                )}
                {has2FA && (
                  <Button
                    variant="outline"
                    onClick={() => setShowDisable2FADialog(true)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    aria-label="Disable 2FA"
                  >
                    Disable 2FA
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {has2FA
                  ? "Your account is protected with two-factor authentication"
                  : "Protect your account with an authenticator app"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login Activity */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
              <Shield className="h-5 w-5" />
            </div>
            Login Activity
          </CardTitle>
          <CardDescription>
            Recent login activity for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-slate-50 dark:bg-slate-800">
              <div className="space-y-1">
                <p className="font-medium">Current session</p>
                <p className="text-sm text-muted-foreground">
                  Started {new Date().toLocaleDateString()} at{" "}
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 border-green-200"
              >
                Active
              </Badge>
            </div>
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                View all login activity in the Sessions tab
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reverification Dialog */}
      <ReverifyDialog
        open={!!reverifyState?.inProgress}
        phase={reverifyPhase}
        destination={reverifyDestination}
        error={reverifyError}
        code={reverifyCode}
        password={reverifyPassword}
        cooldown={cooldown}
        onChangeCode={setReverifyCode}
        onChangePassword={setReverifyPassword}
        onAttemptFirst={attemptFirstFactor}
        onAttemptSecond={attemptSecondFactor}
        onResend={resendVerificationCode}
        onCancel={() => {
          reverifyState?.cancel?.();
          setReverifyState(undefined);
          setReverifyPhase("idle");
          setReverifyCode("");
          setReverifyPassword("");
          setReverifyDestination("");
          setReverifyError("");
          resetReverifyGuards();
        }}
      />

      {/* TOTP QR Modal */}
      <Dialog
        open={qrCodeModal.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setQrCodeModal({ isOpen: false, qrCodeUri: "" });
            setTotpVerificationCode("");
            setTotpResource(null);
            setQrCodeDataUrl("");
            setModalNotification(null);
            secretRef.current = "";
          } else {
            setNotification(null);
            setModalNotification(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center">
              <Smartphone className="h-5 w-5" />
              Enable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription className="text-center">
              Scan the QR code with your authenticator app
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {modalNotification && (
              <div
                role="status"
                aria-live="polite"
                className={`p-3 rounded-lg border text-sm ${
                  modalNotification.type === "success"
                    ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                    : modalNotification.type === "error"
                    ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                    : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm">
                    {modalNotification.message}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setModalNotification(null)}
                    className="h-auto p-1 hover:bg-transparent flex-shrink-0"
                    aria-label="Dismiss notification"
                  >
                    ×
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code for 2FA Setup"
                    className="w-40 h-40 rounded"
                  />
                ) : (
                  <div className="w-40 h-40 flex flex-col items-center justify-center">
                    <QrCode className="h-8 w-8 text-gray-400 animate-pulse" />
                    <p className="text-xs text-gray-500 mt-2">Loading...</p>
                  </div>
                )}
              </div>

              <details className="w-full max-w-sm">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  Can't scan? Enter code manually
                </summary>
                <div className="mt-2 flex items-center space-x-2">
                  <Input
                    value={secretRef.current}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(secretRef.current)}
                    aria-label="Copy secret"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </details>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium block text-center">
                Enter the 6-digit code from your app
              </Label>
              <OtpBoxes
                value={totpVerificationCode}
                onChange={(v) =>
                  setTotpVerificationCode(v.replace(/\D/g, "").slice(0, 6))
                }
                onComplete={(full) => handleTotpVerification(full)}
                length={6}
                autoFocus
              />
              <div className="flex justify-center">
                <Button
                  onClick={() => handleTotpVerification()}
                  disabled={totpVerificationCode.length !== 6}
                  className="min-w-[80px]"
                  aria-label="Verify code"
                >
                  Verify
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Confirmation */}
      <Dialog
        open={showDisable2FADialog}
        onOpenChange={setShowDisable2FADialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to disable two-factor authentication?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-red-800 dark:text-red-200">
                    Security Warning
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Disabling 2FA will remove an important layer of security
                    from your account.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDisable2FADialog(false)}
                disabled={isLoading}
                aria-label="Cancel disabling 2FA"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisable2FA}
                disabled={isLoading}
                aria-label="Disable 2FA"
              >
                {isLoading ? "Disabling..." : "Disable 2FA"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
