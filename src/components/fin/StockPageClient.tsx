// src/components/fin/StockPageClient.tsx
"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type Filing = {
  accession: string;
  form?: string;
  filed_at?: string;
  title?: string;
};

// --- helpers ---
function isFilingArray(x: unknown): x is Filing[] {
  return (
    Array.isArray(x) &&
    x.every((i) => i && typeof i === "object" && "accession" in i)
  );
}

function normalizeFilings(payload: unknown): Filing[] {
  if (!payload) return [];
  // support plain array
  if (isFilingArray(payload)) return payload;

  // support { results: [...] }
  if (
    typeof payload === "object" &&
    payload !== null &&
    "results" in (payload as any) &&
    isFilingArray((payload as any).results)
  ) {
    return (payload as any).results as Filing[];
  }

  // support { filings: [...] }
  if (
    typeof payload === "object" &&
    payload !== null &&
    "filings" in (payload as any) &&
    isFilingArray((payload as any).filings)
  ) {
    return (payload as any).filings as Filing[];
  }

  return [];
}

export default function StockPageClient({
  ticker,
  preselectAccession,
}: {
  ticker: string;
  preselectAccession?: string;
}) {
  const [filings, setFilings] = React.useState<Filing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [question, setQuestion] = React.useState(
    "What changed in revenue, margins, and guidance?"
  );
  const [selectedAccession, setSelectedAccession] = React.useState<
    string | undefined
  >(preselectAccession);
  const [answer, setAnswer] = React.useState<string | null>(null);
  const [answering, setAnswering] = React.useState(false);

  React.useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(
          `/api/fin/filings?ticker=${encodeURIComponent(ticker)}`,
          { cache: "no-store" }
        );
        const j: unknown = await r.json();
        if (!r.ok)
          throw new Error((j as any)?.error || "Failed to load filings");

        const list = normalizeFilings(j);

        if (!ignore) {
          setFilings(list);
          // If no preselected accession, default to the newest (first) filing if available
          if (!preselectAccession && list.length) {
            setSelectedAccession(list[0]?.accession);
          }
          // If there is a preselectAccession, keep it (even if not in the list)
        }
      } catch (err: any) {
        if (!ignore) setError(err?.message || "Failed to load filings");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [ticker, preselectAccession]);

  async function ask() {
    if (!selectedAccession || !question.trim()) return;
    setAnswer(null);
    setAnswering(true);
    try {
      const r = await fetch("/api/fin/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accession: selectedAccession,
          question,
          max_chunks: 12,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Summary failed");
      setAnswer(j?.summary || JSON.stringify(j, null, 2));
    } catch (err: any) {
      setAnswer(err?.message || "Summary failed");
    } finally {
      setAnswering(false);
    }
  }

  return (
    <>
      {/* Hero */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{ticker}</h1>
          <p className="text-sm text-muted-foreground">
            Company overview and filings
          </p>
        </div>
        <Badge variant="secondary">Logged in</Badge>
      </div>

      {/* Filings + Q&A */}
      <div className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filings</CardTitle>
            <CardDescription>Most recent first</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {!loading && !error && filings.length === 0 && (
              <p className="text-sm text-muted-foreground">No filings found.</p>
            )}
            <ul className="divide-y">
              {filings.map((f) => {
                const active = f.accession === selectedAccession;
                return (
                  <li
                    key={f.accession}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {f.title || f.accession}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {f.form || "Filing"} • {f.filed_at || ""}
                      </div>
                    </div>
                    <Button
                      variant={active ? "secondary" : "outline"}
                      onClick={() => setSelectedAccession(f.accession)}
                    >
                      {active ? "Selected" : "Select"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ask this filing</CardTitle>
            <CardDescription>
              {selectedAccession
                ? `Accession: ${selectedAccession}`
                : "Pick a filing on the left"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask();
              }}
              className="flex gap-2"
            >
              <Input
                value={question}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setQuestion(e.target.value)
                }
                placeholder="Ask a question about the selected filing…"
                disabled={!selectedAccession || answering}
              />
              <Button type="submit" disabled={answering || !selectedAccession}>
                {answering ? "Summarizing…" : "Ask"}
              </Button>
            </form>

            <Separator />

            {answer ? (
              <div className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                {answer}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Type a question and hit Ask to generate a summary using your
                backend LLM.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
