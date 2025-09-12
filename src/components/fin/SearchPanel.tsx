// src/components/fin/SearchPanel.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

type SearchResult =
  | { type: "ticker"; ticker: string; name?: string }
  | {
      type: "filing";
      accession: string;
      ticker?: string;
      title?: string;
      date?: string;
    };

export default function SearchPanel() {
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/fin/search?q=${encodeURIComponent(q)}`, {
        cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Search failed");
      setResults(j?.results || j || []);
    } catch (err: any) {
      setError(err?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSearch} className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Try: Apple, AAPL, 10-Q, 0000320193…"
          aria-label="Search"
        />
        <Button type="submit" disabled={loading || !q.trim()}>
          {loading ? "Searching…" : "Search"}
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!!results.length && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Results</CardTitle>
            <CardDescription>
              {results.length} match{results.length !== 1 ? "es" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {results.map((r, i) => {
                if (r.type === "ticker") {
                  return (
                    <li
                      key={`t-${r.ticker}-${i}`}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <div className="font-medium">{r.ticker}</div>
                        {r.name && (
                          <div className="text-sm text-muted-foreground">
                            {r.name}
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() =>
                          router.push(`/stocks/${encodeURIComponent(r.ticker)}`)
                        }
                      >
                        Open
                      </Button>
                    </li>
                  );
                }
                // filing
                return (
                  <li key={`f-${r.accession}-${i}`} className="py-2">
                    <div className="font-medium">{r.title || r.accession}</div>
                    <div className="text-sm text-muted-foreground">
                      {r.ticker ? `${r.ticker} • ` : ""}
                      {r.date || ""}
                    </div>
                    {r.ticker && (
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const base = `/stocks/${encodeURIComponent(
                              r.ticker!
                            )}`;
                            const href = r.accession
                              ? `${base}?a=${encodeURIComponent(r.accession)}`
                              : base;
                            router.push(href);
                          }}
                        >
                          Open in stock page
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
