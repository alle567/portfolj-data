"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-2">
      <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
      <p className="text-sm text-muted-foreground">
        Manage your subscription, payment method, and invoices.
      </p>
      <Button
        disabled={loading}
        onClick={async () => {
          try {
            setLoading(true);
            const r = await fetch("/api/billing/portal", { method: "POST" });
            const j = await r.json();
            if (j?.url) window.location.href = j.url;
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "Opening…" : "Open billing portal"}
      </Button>
    </div>
  );
}
