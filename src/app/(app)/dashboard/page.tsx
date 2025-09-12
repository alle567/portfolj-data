// src/app/(app)/dashboard/page.tsx
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Plus, Upload, Filter, ArrowRight } from "lucide-react";

export default async function PrivateHome() {
  const { userId } = await auth();
  if (!userId) redirect("/login?redirect_url=/dashboard");

  const user = await currentUser();
  const name =
    user?.firstName ||
    (user?.publicMetadata as any)?.name ||
    (user?.unsafeMetadata as any)?.name ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "there";

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Welcome, {name} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Here’s a quick snapshot of your account.
          </p>
        </div>
        <div className="hidden sm:flex gap-2">
          <Link href="/screens/new" className={cn(buttonVariants())}>
            <Plus className="h-4 w-4 mr-2" />
            New screen
          </Link>
          <Link
            href="/import"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import data
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total balance</CardDescription>
            <CardTitle className="text-2xl">SEK 245,120</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Badge variant="secondary">+1.8% today</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Daily P/L</CardDescription>
            <CardTitle className="text-2xl">SEK 4,320</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <Progress value={62} />
              <p className="text-xs text-muted-foreground">62% of daily goal</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Holdings</CardDescription>
            <CardTitle className="text-2xl">18</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">3 watchlist alerts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Risk</CardDescription>
            <CardTitle className="text-2xl">Moderate</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Badge variant="outline">VaR 95%: 2.4%</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions (mobile) */}
      <div className="sm:hidden grid grid-cols-2 gap-2">
        <Link href="/screens/new" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4 mr-2" />
          New screen
        </Link>
        <Link
          href="/import"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Link>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Recent activity</CardTitle>
              <CardDescription>Last 5 events</CardDescription>
            </div>
            <Link
              href="/activity"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Showing trades, deposits, alerts
            </span>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Date</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>2025-08-18</TableCell>
                  <TableCell>Bought AAPL (10 @ 190.10)</TableCell>
                  <TableCell className="text-right">- SEK 19,010</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2025-08-17</TableCell>
                  <TableCell>Sold SAND.ST (120 @ 197.40)</TableCell>
                  <TableCell className="text-right">+ SEK 23,688</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2025-08-16</TableCell>
                  <TableCell>Deposit</TableCell>
                  <TableCell className="text-right">+ SEK 10,000</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2025-08-16</TableCell>
                  <TableCell>Alert: “RSI &lt; 30” for VOLV-B.ST</TableCell>
                  <TableCell className="text-right">—</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2025-08-15</TableCell>
                  <TableCell>Dividend: SCA B</TableCell>
                  <TableCell className="text-right">+ SEK 420</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Account section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Your account</CardTitle>
          <CardDescription>Manage plan and settings</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-md bg-muted" />
            <div>
              <div className="font-medium">{name}</div>
              <div className="text-xs text-muted-foreground">
                {user?.emailAddresses?.[0]?.emailAddress}
              </div>
            </div>
          </div>
          <Separator className="hidden sm:block" orientation="vertical" />
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Pro trial</Badge>
            <Badge variant="outline">2 seats</Badge>
          </div>
          <div className="sm:ml-auto flex gap-2">
            <Link
              href="/settings"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Settings
            </Link>
            <Link href="/billing" className={cn(buttonVariants())}>
              Manage plan
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
