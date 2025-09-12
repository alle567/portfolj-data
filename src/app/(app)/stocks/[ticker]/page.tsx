// src/app/(app)/stocks/[ticker]/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import StockPageTabs from "@/components/fin/StockPageTabs";

type PageProps = {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<{ a?: string | string[] }>;
};

export default async function StockPage({ params, searchParams }: PageProps) {
  const { userId } = await auth();

  const { ticker } = await params;
  const { a } = await searchParams;

  const preselectAccession =
    typeof a === "string" && a && a !== "undefined" ? a : undefined;

  if (!userId) {
    const qs = preselectAccession
      ? `?a=${encodeURIComponent(preselectAccession)}`
      : "";
    redirect(`/login?redirect_url=/stocks/${encodeURIComponent(ticker)}${qs}`);
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <StockPageTabs
        ticker={decodeURIComponent(ticker).toUpperCase()}
        preselectAccession={preselectAccession}
      />
    </div>
  );
}
