// src/components/Navigation/AppSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

import {
  LayoutDashboard,
  LineChart,
  ListFilter,
  Settings,
  HelpCircle,
  Search,
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
        <Badge variant="secondary" className="uppercase">
          App
        </Badge>
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
