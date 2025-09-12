// src/components/Navigation/AppTopbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  Menu,
  HelpCircle,
  User as UserIcon,
  CreditCard,
  Sparkles,
  LogOut,
} from "lucide-react";
import { navItems } from "./AppSidebar";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

/** Page-specific subnav registry */
const contextNavRegistry: Array<{
  match: (path: string) => boolean;
  items: { label: string; href: string }[];
}> = [
  {
    match: (p) => p.startsWith("/account"),
    items: [
      { label: "Account", href: "/account" },
      { label: "Security", href: "/account/security" },
    ],
  },
];

export default function AppTopbar() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [userPlan, setUserPlan] = useState<"free" | "pro" | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  const subnav = useMemo(
    () => contextNavRegistry.find((r) => r.match(pathname)),
    [pathname]
  );

  // pick the single best active tab (longest prefix)
  const activeHref = useMemo(() => {
    if (!subnav?.items?.length) return "";
    let best = "";
    for (const i of subnav.items) {
      if (pathname === i.href || pathname.startsWith(i.href + "/")) {
        if (i.href.length > best.length) best = i.href;
      }
    }
    if (!best) best = subnav.items.find((i) => i.href === pathname)?.href ?? "";
    return best;
  }, [pathname, subnav]);

  // expose topbar height for pages that need it
  useEffect(() => {
    const setVar = () => {
      const h = headerRef.current?.offsetHeight || 56; // ~h-14
      document.documentElement.style.setProperty("--topbar-total-h", `${h}px`);
    };
    setVar();
    window.addEventListener("resize", setVar);
    return () => window.removeEventListener("resize", setVar);
  }, [pathname, subnav, open]);

  // fetch user's billing plan for mobile
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const response = await fetch("/api/billing/status");
        if (response.ok) {
          const data = await response.json();
          setUserPlan(data.plan);
        }
      } catch (error) {
        console.error("Failed to fetch user plan:", error);
      }
    };

    if (user) {
      fetchUserPlan();
    }
  }, [user]);

  // initials for avatar fallback
  const initials = useMemo(() => {
    const f = user?.firstName?.[0]?.toUpperCase() ?? "";
    const l = user?.lastName?.[0]?.toUpperCase() ?? "";
    if (f || l) return `${f}${l}` || "U";
    const u =
      user?.username?.[0]?.toUpperCase() ??
      user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() ??
      "U";
    return u;
  }, [user]);

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      )}
    >
      {/* md+: first column is a spacer equal to the sidebar width */}
      <div
        className={cn(
          "h-14 grid items-center gap-2 md:gap-0 pl-3 pr-3 md:pl-0 md:pr-6",
          "grid-cols-[auto_1fr_auto] md:grid-cols-[var(--sidebar-w,16rem)_1fr_auto]"
        )}
      >
        {/* COL 1 — mobile left cluster; md+ acts as spacer */}
        <div className="flex items-center gap-2 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 flex h-full flex-col">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation menu</SheetTitle>
              </SheetHeader>

              <div className="h-14 px-4 flex items-center justify-between">
                <Link
                  href="/dashboard"
                  className="font-semibold tracking-tight"
                  onClick={() => setOpen(false)}
                >
                  InvestApp
                </Link>
              </div>
              <Separator />

              <ScrollArea className="flex-1 px-3">
                <nav className="py-3 space-y-1">
                  {/* User info section for mobile */}
                  {user && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium truncate">
                          {user?.fullName ?? "Signed in"}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {user?.primaryEmailAddress?.emailAddress ?? ""}
                        </span>
                        {userPlan && (
                          <Badge
                            variant={
                              userPlan === "pro" ? "default" : "secondary"
                            }
                            className="text-xs px-2 py-0.5 h-5 w-fit mt-1"
                          >
                            {userPlan.toUpperCase()} TIER
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* User menu items */}
                  <div className="space-y-1 mb-4">
                    <Button
                      asChild
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => setOpen(false)}
                    >
                      <Link href="/account">
                        <UserIcon className="h-4 w-4" />
                        <span>Account</span>
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => setOpen(false)}
                    >
                      <Link href="/billing">
                        <CreditCard className="h-4 w-4" />
                        <span>Billing & Plans</span>
                      </Link>
                    </Button>
                  </div>

                  <Separator className="my-3" />

                  {/* Main navigation items */}
                  {navItems.map((item) => {
                    const active =
                      pathname === item.href ||
                      (item.href !== "/dashboard" &&
                        pathname?.startsWith(item.href));
                    return (
                      <Button
                        key={item.href}
                        asChild
                        variant={active ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3",
                          active && "text-foreground"
                        )}
                        onClick={() => setOpen(false)}
                      >
                        <Link href={item.href}>
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      </Button>
                    );
                  })}
                </nav>
              </ScrollArea>

              <div className="border-t p-3 flex items-center justify-between">
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="text-xs text-muted-foreground"
                  onClick={() => setOpen(false)}
                >
                  <Link href="/help" className="inline-flex items-center gap-1">
                    <HelpCircle className="h-3.5 w-3.5" />
                    Help
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    setOpen(false);
                    signOut({ redirectUrl: "/" });
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/dashboard" className="md:hidden font-semibold">
            InvestApp
          </Link>
        </div>

        {/* md+ spacer cell keeps column 1 width */}
        <div className="hidden md:block" />

        {/* COL 2 — subnav (flush-left to content edge on md+) */}
        <div className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar justify-self-start">
          {subnav?.items?.length
            ? subnav.items.map((t) => {
                const active = t.href === activeHref;
                return (
                  <Button
                    key={t.href}
                    asChild
                    size="sm"
                    variant={active ? "secondary" : "ghost"}
                    className={cn(
                      "h-8 px-3 rounded-md",
                      active && "text-foreground shadow-sm"
                    )}
                  >
                    <Link
                      href={t.href}
                      aria-current={active ? "page" : undefined}
                    >
                      {t.label}
                    </Link>
                  </Button>
                );
              })
            : null}
        </div>

        {/* COL 3 — empty since user menu moved to sidebar */}
        <div className="flex items-center gap-2 justify-self-end pr-1 md:pr-3 md:pl-2">
          {/* User menu now in sidebar */}
        </div>
      </div>
    </header>
  );
}
