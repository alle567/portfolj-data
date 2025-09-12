// src/app/api/billing/invoices/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { getOrCreateCustomer } from "@/lib/getOrCreateCustomer";

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const customer = await getOrCreateCustomer();
    const customerId = customer.id;

    // Fetch invoices for the customer
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 50,
      status: "paid", // Only show paid invoices
    });

    // Format invoices for the frontend
    const formattedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      created: invoice.created,
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      number: invoice.number,
    }));

    return NextResponse.json({
      invoices: formattedInvoices,
    });
  } catch (error) {
    console.error("Invoices error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve invoices" },
      { status: 500 }
    );
  }
}
