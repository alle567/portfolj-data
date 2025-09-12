// src/app/(app)/search/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SearchPanel from "@/components/fin/SearchPanel";

export default async function SearchPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login?redirect_url=/search");
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Search</h1>
      <p className="text-sm text-muted-foreground">
        Find tickers, companies, and filings.
      </p>
      <SearchPanel />
    </div>
  );
}
