// app/(public)/page.tsx
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  LineChart,
  Wallet,
  Bell,
  Database,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="py-16 sm:py-24">
        <Badge className="mb-4">Early access</Badge>
        <h1 className="font-sans text-3xl font-semibold tracking-tight sm:text-5xl">
          Fundamental stock analysis & portfolio tracking.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Screen companies by real fundamentals, track your portfolio over time,
          and get alerting you control. APIs coming soon for programmatic
          access.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/pricing">
              View pricing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Quick metrics / watchlist preview */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today’s Moves (demo)</CardTitle>
              <CardDescription>Watchlist snapshot</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {[
                  { t: "AAPL", n: "Apple", c: "+1.8%", up: true },
                  { t: "MSFT", n: "Microsoft", c: "+0.9%", up: true },
                  { t: "NVDA", n: "NVIDIA", c: "-1.2%", up: false },
                  { t: "AMZN", n: "Amazon", c: "+0.4%", up: true },
                ].map((row) => (
                  <li
                    key={row.t}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm">{row.t}</span>
                      <span className="text-sm text-muted-foreground">
                        {row.n}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-sm ${
                        row.up
                          ? "text-green-600 dark:text-green-500"
                          : "text-red-600 dark:text-red-500"
                      }`}
                    >
                      {row.up ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {row.c}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Fundamentals at a glance
              </CardTitle>
              <CardDescription>Example metrics (trailing)</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <Metric label="Revenue growth" value="+12.4%" good />
                <Metric label="Gross margin" value="58.1%" good />
                <Metric label="Operating margin" value="18.9%" />
                <Metric label="FCF yield" value="3.7%" />
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                Data for illustration. Connect your portfolio to see real
                numbers.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Features */}
      <section className="py-14">
        <h2 className="font-sans text-xl font-semibold tracking-tight">
          What you can do
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<BarChart3 className="h-5 w-5" />}
            title="Fundamental screens"
            desc="Filter by valuation, growth, profitability, quality—save and reuse screens."
          />
          <FeatureCard
            icon={<Wallet className="h-5 w-5" />}
            title="Portfolio tracking"
            desc="Track holdings, P/L, dividends, and allocation drift across accounts."
          />
          <FeatureCard
            icon={<LineChart className="h-5 w-5" />}
            title="Compare companies"
            desc="Side-by-side charts for revenue, margin, cash flow, and more."
          />
          <FeatureCard
            icon={<Bell className="h-5 w-5" />}
            title="Alerts you control"
            desc="Set alerts on price, valuation bands, or metric changes."
          />
          <FeatureCard
            icon={<Database className="h-5 w-5" />}
            title="Data you can trust"
            desc="Sane definitions and consistent units; audit fields when you hover."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Your data, private"
            desc="Secure by default with role-based access and export controls."
          />
        </div>
      </section>

      {/* API teaser */}
      <section className="pb-14">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>APIs coming soon</CardTitle>
            <CardDescription>
              Programmatic access to fundamentals, screens, and your portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
              <code>{`# REST (soon)
GET /api/v1/fundamentals?ticker=AAPL

# Example response (trimmed)
{
  "ticker": "AAPL",
  "revenue_ttm": 383_000_000_000,
  "gross_margin_ttm": 0.58,
  "fcf_ttm": 99_000_000_000
}`}</code>
            </pre>
            <form action="#" className="mt-4 flex max-w-md gap-2">
              <Input
                type="email"
                placeholder="you@example.com"
                className="h-9"
              />
              <Button type="submit" className="h-9">
                Notify me
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section className="pb-14">
        <h2 className="font-sans text-xl font-semibold tracking-tight">FAQ</h2>
        <Accordion type="single" collapsible className="mt-6">
          <AccordionItem value="free">
            <AccordionTrigger>Is there a free plan?</AccordionTrigger>
            <AccordionContent>
              Yes—start free with core screening and a single portfolio. Upgrade
              for alerts and historical exports.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="broker">
            <AccordionTrigger>Can I connect my broker?</AccordionTrigger>
            <AccordionContent>
              You can import CSVs today; broker connections are on our roadmap
              based on demand.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="advice">
            <AccordionTrigger>Is this financial advice?</AccordionTrigger>
            <AccordionContent>
              No. We provide tools and data. Investing involves risk—do your own
              research.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Final CTA */}
      <section className="pb-24">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-sans text-lg font-semibold">
                Ready to analyze smarter?
              </h3>
              <p className="text-sm text-muted-foreground">
                Create an account and build your first watchlist in minutes.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/signup">Get started</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">Talk to us</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

/* — Helpers — */
function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <span className="rounded-md bg-muted p-2">{icon}</span>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{desc}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}

function Metric({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good?: boolean;
}) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={`mt-1 font-medium ${
          good ? "text-foreground" : "text-foreground/90"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
