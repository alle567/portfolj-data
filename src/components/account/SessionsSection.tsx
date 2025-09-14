"use client";

import { useMemo, useState } from "react";
import { useUser, useSession, useSessionList } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  MapPin,
  Clock,
  Shield,
  Trash2,
  AlertTriangle,
} from "lucide-react";

interface SessionsSectionProps {
  user: any; // compatibility only
}

/* --------------------------- helpers --------------------------- */
type MaybeDateish = number | string | Date | null | undefined;
const isBrowser = typeof window !== "undefined";

function toDate(v: MaybeDateish): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") {
    const ms = v < 1e12 ? v * 1000 : v;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === "string") {
    const n = Number(v);
    if (!Number.isNaN(n)) return toDate(n);
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function relTime(dateish: MaybeDateish) {
  const d = toDate(dateish);
  if (!d) return null;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function parseUA(uaRaw: string) {
  const ua = uaRaw?.toLowerCase() ?? "";
  const device = /ipad|tablet/.test(ua)
    ? "iPad/Tablet"
    : /iphone|android/.test(ua)
    ? "Phone"
    : /mac|windows|linux|x11/.test(ua)
    ? "Desktop"
    : null;

  const browser = /edg\//.test(ua)
    ? "Edge"
    : /chrome\//.test(ua) && !/edg\//.test(ua)
    ? "Chrome"
    : /firefox\//.test(ua)
    ? "Firefox"
    : /safari\//.test(ua) && !/chrome\//.test(ua)
    ? "Safari"
    : null;

  const os = /iphone|ipad|ios/.test(ua)
    ? "iOS"
    : /android/.test(ua)
    ? "Android"
    : /mac/.test(ua)
    ? "macOS"
    : /windows/.test(ua)
    ? "Windows"
    : /linux|x11/.test(ua)
    ? "Linux"
    : null;

  return { device, browser, os };
}

function DeviceIcon({ device }: { device: string | null }) {
  if (!device) return <Monitor className="h-4 w-4" />;
  if (device.includes("Phone")) return <Smartphone className="h-4 w-4" />;
  if (device.includes("Tablet") || device.includes("iPad"))
    return <Tablet className="h-4 w-4" />;
  return <Monitor className="h-4 w-4" />;
}

/* ---------------------------------------------------------------- */

export function SessionsSection({ user: _ }: SessionsSectionProps) {
  const { user } = useUser();
  const { session: currentSession } = useSession();
  const { sessions, isLoaded } = useSessionList();
  const [isBusy, setIsBusy] = useState(false);

  const currentSessionId = currentSession?.id;

  const ordered = useMemo(() => {
    if (!isLoaded) return [];
    const score = (s: any) =>
      toDate(s?.lastActiveAt)?.getTime() ??
      toDate(s?.latestActivityAt)?.getTime() ??
      toDate(s?.updatedAt)?.getTime() ??
      toDate(s?.createdAt)?.getTime() ??
      0;
    return [...(sessions || [])].sort((a: any, b: any) => score(b) - score(a));
  }, [isLoaded, sessions]);

  const current = ordered.find((s: any) => s?.id === currentSessionId);
  const others = ordered.filter((s: any) => s?.id !== currentSessionId);

  // Build display fields for a session.
  function buildInfo(s: any, isCurrent: boolean) {
    // Clerk may or may not give these; try a bunch of places:
    const client = s?.client ?? {};
    const uaFromClerk = client.userAgent ?? s?.userAgent ?? null;
    const browserName = client.browserName ?? client.browser ?? null;
    const osName = client.os ?? client.osName ?? null;
    const deviceType = client.deviceType ?? null;

    // Current session: we can always derive from the real navigator
    const uaFromNavigator =
      isCurrent && isBrowser ? window.navigator.userAgent : null;

    const parsed = parseUA(
      (uaFromClerk as string) || (uaFromNavigator as string) || ""
    );

    const device = deviceType || parsed.device;
    const browser = browserName || parsed.browser;
    const os = osName || parsed.os;

    const ip = client.ipAddress ?? s?.ipAddress ?? null;

    const city = client.city ?? client?.geo?.city ?? s?.city ?? null;

    const country =
      client.country ?? client?.geo?.country ?? s?.country ?? null;

    const location =
      city && country ? `${city}, ${country}` : country || city || null;

    const started = relTime(s?.createdAt);
    const lastActive =
      relTime(
        s?.lastActiveAt ?? s?.latestActivityAt ?? s?.updatedAt ?? s?.createdAt
      ) ?? null;

    return { device, browser, os, ip, location, started, lastActive };
  }

  async function revokeOne(id: string) {
    if (!isLoaded || id === currentSessionId) return;
    const target: any = (sessions || []).find((s: any) => s.id === id);
    if (!target?.revoke) return;
    setIsBusy(true);
    try {
      await target.revoke();
    } catch (e) {
      console.error("Failed to revoke session:", e);
    } finally {
      setIsBusy(false);
    }
  }

  async function revokeAllOthers() {
    if (!isLoaded) return;
    setIsBusy(true);
    try {
      const tasks = (sessions || [])
        .filter(
          (s: any) =>
            s.id !== currentSessionId && typeof s.revoke === "function"
        )
        .map((s: any) => s.revoke());
      await Promise.allSettled(tasks);
    } catch (e) {
      console.error("Failed to revoke other sessions:", e);
    } finally {
      setIsBusy(false);
    }
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Loading session information...
          </p>
        </CardContent>
      </Card>
    );
  }

  const curInfo = current ? buildInfo(current, true) : null;

  return (
    <div className="space-y-6">
      {/* Current Session */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            Current Session
          </CardTitle>
          <CardDescription>This is your current active session</CardDescription>
        </CardHeader>
        <CardContent>
          {current && curInfo ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-green-50 dark:bg-green-900/20">
                <div className="flex-shrink-0 mt-1 p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                  <DeviceIcon device={curInfo.device} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">
                      {curInfo.device ?? "Device"}
                    </h4>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 border-green-200"
                    >
                      Current
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                    {curInfo.browser && curInfo.os && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>
                          {curInfo.browser} • {curInfo.os}
                        </span>
                      </div>
                    )}
                    {curInfo.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{curInfo.location}</span>
                      </div>
                    )}
                    {curInfo.started && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Started {curInfo.started}</span>
                      </div>
                    )}
                    {curInfo.ip && (
                      <div className="flex items-center gap-2">
                        <span className="w-4 text-center">IP</span>
                        <span>{curInfo.ip}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-4">
              No active session data.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Sessions */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
              <Monitor className="h-5 w-5" />
            </div>
            Other Sessions
          </CardTitle>
          <CardDescription>
            Manage your other active sessions across different devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {others.length > 0 ? (
            <>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={revokeAllOthers}
                  disabled={isBusy}
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Revoke All Others
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                {others.map((s: any) => {
                  const info = buildInfo(s, false);
                  return (
                    <div
                      key={s.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-slate-50 dark:bg-slate-800"
                    >
                      <div className="flex-shrink-0 mt-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                        <DeviceIcon device={info.device} />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            {info.device ?? "Device"}
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => revokeOne(s.id)}
                            disabled={isBusy}
                            className="border-red-200 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Revoke
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                          {info.browser && info.os && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              <span>
                                {info.browser} • {info.os}
                              </span>
                            </div>
                          )}
                          {info.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{info.location}</span>
                            </div>
                          )}
                          {info.lastActive && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>Last active {info.lastActive}</span>
                            </div>
                          )}
                          {info.ip && (
                            <div className="flex items-center gap-2">
                              <span className="w-4 text-center">IP</span>
                              <span>{info.ip}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-700 w-fit mx-auto mb-4">
                <Monitor className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">No other sessions</h3>
              <p className="text-sm text-muted-foreground">
                You're only signed in on this device
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-yellow-50/50 dark:bg-yellow-900/20">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            Security Notice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm">
              If you see any sessions that you don't recognize, revoke them
              immediately and change your password.
            </p>
            <p className="text-sm text-muted-foreground">
              Sessions automatically expire after a period of inactivity for
              your security.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
