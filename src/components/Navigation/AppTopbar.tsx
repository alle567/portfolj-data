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
  CreditCard,
  Sparkles,
  User as UserIcon,
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

  // initials for avatar fallback (no background)
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
                  onClick={() => {
                    setOpen(false);
                    signOut({ redirectUrl: "/" });
                  }}
                >
                  Log out
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

        {/* COL 3 — custom user menu using shadcn (no background behind avatar) */}
        <div className="flex items-center gap-2 justify-self-end pr-1 md:pr-3 md:pl-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* 👇 Add cursor-pointer so hand shows on hover */}
              <button
                className={cn(
                  "rounded-full cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "ring-offset-2 ring-offset-background"
                )}
                aria-label="Open user menu"
              >
                <Avatar className="h-8 w-8 select-none">
                  <AvatarImage
                    src={user?.imageUrl ?? undefined}
                    alt={user?.fullName ?? "User"}
                  />
                  <AvatarFallback className="bg-transparent text-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 p-1"
              sideOffset={8}
            >
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {user?.fullName ?? "Signed in"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.primaryEmailAddress?.emailAddress ?? ""}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* 👇 Force pointer cursor on items (shadcn sets cursor-default) */}
              <DropdownMenuItem asChild className="!cursor-pointer">
                <Link href="/account" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="!cursor-pointer">
                <Link href="/billing" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Billing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="!cursor-pointer">
                <Link href="/pricing" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Pricing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive !cursor-pointer"
                onClick={() => signOut({ redirectUrl: "/" })}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
