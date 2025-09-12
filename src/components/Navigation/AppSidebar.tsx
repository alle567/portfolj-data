// src/components/Navigation/AppSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import {
  LayoutDashboard,
  LineChart,
  ListFilter,
  Settings,
  HelpCircle,
  Search,
  CreditCard,
  Sparkles,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: React.ReactNode };

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  { label: "Search", href: "/search", icon: <Search className="h-4 w-4" /> },
  {
    label: "Portfolio",
    href: "/portfolio",
    icon: <LineChart className="h-4 w-4" />,
  },
  {
    label: "Screens",
    href: "/screens",
    icon: <ListFilter className="h-4 w-4" />,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings className="h-4 w-4" />,
  },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [userPlan, setUserPlan] = useState<"free" | "pro" | null>(null);

  // fetch user's billing plan
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
  const initials =
    user?.firstName?.[0]?.toUpperCase() ??
    user?.lastName?.[0]?.toUpperCase() ??
    user?.username?.[0]?.toUpperCase() ??
    user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() ??
    "U";

  return (
    <aside className="hidden md:flex sticky top-0 h-dvh w-64 flex-col border-r bg-background">
      {/* Brand */}
      <div className="h-14 shrink-0 px-4 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="font-semibold tracking-tight hover:opacity-90"
        >
          InvestApp
        </Link>

        {/* User dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="hidden md:flex flex-col items-center gap-1 cursor-pointer">
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
              {userPlan && (
                <Badge
                  variant={userPlan === "pro" ? "default" : "secondary"}
                  className="text-xs px-1.5 py-0.5 h-4 pointer-events-none"
                >
                  {userPlan.toUpperCase()}
                </Badge>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-1" sideOffset={8}>
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                {user?.fullName ?? "Signed in"}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {user?.primaryEmailAddress?.emailAddress ?? ""}
              </span>
              {userPlan && (
                <div className="flex justify-start mt-1">
                  <Badge
                    variant={userPlan === "pro" ? "default" : "secondary"}
                    className="text-xs px-2 py-0.5 h-5"
                  >
                    {userPlan.toUpperCase()} TIER
                  </Badge>
                </div>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="!cursor-pointer">
              <Link href="/account" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="!cursor-pointer">
              <Link href="/billing" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Billing & Plans
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
      <Separator />

      {/* Nav (fills available space) */}
      <ScrollArea className="flex-1">
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));

            return (
              <Button
                key={item.href}
                asChild
                variant={active ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 rounded-md text-sm",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="inline-flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom actions */}
      <div className="mt-auto border-t">
        <div className="p-3 flex items-center justify-between">
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground"
          >
            <Link href="/help" className="inline-flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5" />
              Help
            </Link>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-destructive focus:text-destructive !cursor-pointer"
            onClick={() => signOut({ redirectUrl: "/" })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </div>
    </aside>
  );
}
