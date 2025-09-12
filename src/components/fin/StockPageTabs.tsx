// src/components/fin/StockPageTabs.tsx
"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription as Desc,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Info, TrendingUp, TrendingDown } from "lucide-react";
import StockPageClient from "./StockPageClient";

// Recharts
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

// — Types —
type FilingPreview = {
  accession: string;
  title?: string;
  date?: string;
  ticker?: string;
};

type Quote = {
  price: number;
  change: number; // delta in %
  currency: string;
  marketCap?: number;
  pe?: number;
  fcfYield?: number;
  dayHigh?: number;
  dayLow?: number;
  week52High?: number;
  week52Low?: number;
  volume?: number;
  avgVolume?: number;
};

type SeriesPoint = { d: string; v: number };

function formatBig(n?: number) {
  if (n == null || isNaN(n)) return "—";
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return n.toLocaleString();
}

export default function StockPageTabs({
  ticker,
  preselectAccession,
}: {
  ticker: string;
  preselectAccession?: string;
}) {
  const [loading, setLoading] = React.useState(false);
  const [quote, setQuote] = React.useState<Quote | null>(null);
  const [priceSeries, setPriceSeries] = React.useState<SeriesPoint[]>([]);
  const [revSeries, setRevSeries] = React.useState<SeriesPoint[]>([]);
  const [gmSeries, setGmSeries] = React.useState<SeriesPoint[]>([]);
  const [omSeries, setOmSeries] = React.useState<SeriesPoint[]>([]);
  const [filings, setFilings] = React.useState<FilingPreview[]>([]);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    try {
      // 1) Quote (will return 501 until backend has it)
      const q = await safeGet<Quote>(
        `/api/fin/quote?ticker=${encodeURIComponent(ticker)}`
      );
      if (q) setQuote(q);

      // 2) Prices (will return 501 until backend has it)
      const s = await safeGet<SeriesPoint[]>(
        `/api/fin/prices?ticker=${encodeURIComponent(ticker)}&range=180d`
      );
      if (Array.isArray(s)) setPriceSeries(s);

      // 3) Fundamentals (will return 501 until backend has it)
      const f = await safeGet<{
        revenue?: SeriesPoint[];
        grossMargin?: SeriesPoint[];
        operatingMargin?: SeriesPoint[];
      }>(
        `/api/fin/fundamentals?ticker=${encodeURIComponent(
          ticker
        )}&period=quarterly&limit=12`
      );
      if (f?.revenue) setRevSeries(f.revenue);
      if (f?.grossMargin) setGmSeries(f.grossMargin);
      if (f?.operatingMargin) setOmSeries(f.operatingMargin);

      // 4) Filings (this endpoint exists)
      const fl = await safeGet<{ results?: FilingPreview[] }>(
        `/api/fin/filings?ticker=${encodeURIComponent(ticker)}`
      );
      setFilings(Array.isArray(fl?.results) ? fl!.results! : []);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const isUp = (quote?.change ?? 0) >= 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{ticker}</h1>
            <Badge variant="secondary">Equity</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Real-time and fundamentals (shown when available from backend).
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi
          label="Price"
          value={
            quote
              ? `${quote.price.toFixed(2)} ${quote.currency}`
              : "Unavailable"
          }
          chip={
            quote && (
              <span
                className={`inline-flex items-center gap-1 text-xs ${
                  isUp
                    ? "text-green-600 dark:text-green-500"
                    : "text-red-600 dark:text-red-500"
                }`}
              >
                {isUp ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {(quote?.change ?? 0) > 0
                  ? `+${quote?.change?.toFixed(2)}%`
                  : `${quote?.change?.toFixed(2)}%`}
              </span>
            )
          }
        />
        <Kpi
          label="Market Cap"
          value={quote ? formatBig(quote.marketCap) : "—"}
        />
        <Kpi label="P/E" value={quote?.pe ? quote.pe.toFixed(1) : "—"} />
        <Kpi
          label="FCF Yield"
          value={quote?.fcfYield ? `${quote.fcfYield.toFixed(1)}%` : "—"}
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="filings">Filings</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Price</CardTitle>
                <Desc>Last 6 months</Desc>
              </CardHeader>
              <CardContent className="pt-0">
                {priceSeries.length ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={priceSeries}>
                        <defs>
                          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="0%"
                              stopColor="currentColor"
                              stopOpacity={0.25}
                            />
                            <stop
                              offset="100%"
                              stopColor="currentColor"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeOpacity={0.15} vertical={false} />
                        <XAxis dataKey="d" hide />
                        <YAxis hide domain={["auto", "auto"]} />
                        <Tooltip
                          formatter={(v: unknown) =>
                            typeof v === "number"
                              ? (v as number).toFixed(2)
                              : (v as string)
                          }
                          labelFormatter={(label: string | number) =>
                            `Date: ${label}`
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="v"
                          stroke="currentColor"
                          fill="url(#grad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No price data available from backend.
                  </p>
                )}

                {quote && (
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                    <div>
                      Day range:{" "}
                      <span className="text-foreground">
                        {quote?.dayLow?.toFixed(2) ?? "—"} –{" "}
                        {quote?.dayHigh?.toFixed(2) ?? "—"}
                      </span>
                    </div>
                    <div>
                      52w range:{" "}
                      <span className="text-foreground">
                        {quote?.week52Low?.toFixed(2) ?? "—"} –{" "}
                        {quote?.week52High?.toFixed(2) ?? "—"}
                      </span>
                    </div>
                    <div>
                      Volume:{" "}
                      <span className="text-foreground">
                        {formatBig(quote?.volume)}
                      </span>
                    </div>
                    <div>
                      Avg vol:{" "}
                      <span className="text-foreground">
                        {formatBig(quote?.avgVolume)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Key facts</CardTitle>
                <Desc>Snapshot</Desc>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <span className="font-medium">Currency: </span>
                      <span className="text-muted-foreground">
                        {quote?.currency || "—"}
                      </span>
                    </div>
                  </li>
                </ul>
                <Separator className="my-4" />
                <p className="text-xs text-muted-foreground">
                  Additional metrics appear as your backend exposes them.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent filings preview */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent filings</CardTitle>
              <Desc>From your backend</Desc>
            </CardHeader>
            <CardContent className="pt-0">
              {filings?.length ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Date</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="text-right">Accession</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filings.slice(0, 5).map((f) => (
                        <TableRow key={f.accession}>
                          <TableCell>{f.date ?? "—"}</TableCell>
                          <TableCell className="max-w-[42ch] truncate">
                            {f.title ?? f.accession}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {f.accession}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No filings found.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FINANCIALS */}
        <TabsContent value="financials">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Revenue</CardTitle>
                <Desc>Quarterly</Desc>
              </CardHeader>
              <CardContent className="pt-0">
                {revSeries.length ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revSeries}>
                        <CartesianGrid strokeOpacity={0.15} vertical={false} />
                        <XAxis dataKey="d" />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="v"
                          fill="currentColor"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Revenue series not available from backend.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Margins</CardTitle>
                <Desc>Gross vs Operating (%)</Desc>
              </CardHeader>
              <CardContent className="pt-0">
                {gmSeries.length || omSeries.length ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={gmSeries.map((p, i) => ({
                          d: p.d,
                          gm: p.v,
                          om: omSeries[i]?.v,
                        }))}
                      >
                        <CartesianGrid strokeOpacity={0.15} vertical={false} />
                        <XAxis dataKey="d" />
                        <YAxis domain={[0, 80]} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="gm"
                          stroke="currentColor"
                          name="Gross"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="om"
                          stroke="currentColor"
                          name="Operating"
                          strokeDasharray="4 4"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Margin series not available from backend.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* FILINGS */}
        <TabsContent value="filings">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Filings explorer</CardTitle>
              <Desc>Ask questions and open summaries</Desc>
            </CardHeader>
            <CardContent className="pt-0">
              <StockPageClient
                ticker={ticker}
                preselectAccession={preselectAccession}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// — helpers —

async function safeGet<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return null;
    const j = (await r.json()) as T;
    return j;
  } catch {
    return null;
  }
}

function Kpi({
  label,
  value,
  chip,
}: {
  label: string;
  value: string | number;
  chip?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Desc className="text-muted-foreground text-sm">{label}</Desc>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      {chip ? <CardContent className="pt-0">{chip}</CardContent> : null}
    </Card>
  );
}

// Re-export description-like helper to avoid name shadowing from ui/card
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={`text-sm text-muted-foreground ${className ?? ""}`}
      {...props}
    />
  );
}
