"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  CreditCard,
  Calendar,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { EmbeddedCheckoutModal } from "@/components/billing/EmbeddedCheckoutModal";
import { SubscriptionManagementModal } from "@/components/billing/SubscriptionManagementModal";

interface BillingStatus {
  plan: "free" | "pro";
  subscriptionStatus: string | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: number | null;
  paymentMethod: {
    brand: string;
    last4: string;
  } | null;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  invoice_pdf?: string;
}

const PLAN_FEATURES = {
  free: [
    "Basic portfolio tracking",
    "Up to 10 stocks",
    "Daily price updates",
    "Basic charts",
  ],
  pro: [
    "Advanced portfolio analytics",
    "Unlimited stocks",
    "Real-time price updates",
    "Advanced charts & indicators",
    "Custom alerts",
    "Export reports",
    "Priority support",
  ],
};

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);

  useEffect(() => {
    fetchBillingStatus();
  }, []);

  const fetchBillingStatus = async () => {
    try {
      setStatusLoading(true);
      const response = await fetch("/api/billing/status");
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch billing status:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      setInvoicesLoading(true);
      const response = await fetch("/api/billing/invoices");
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setShowCheckoutModal(true);
  };

  const handleCheckoutSuccess = () => {
    // Refresh billing status after successful upgrade
    fetchBillingStatus();
  };

  const handleManageSubscription = async () => {
    setShowManagementModal(true);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="py-6 sm:py-8 lg:py-12">
          {/* Header */}
          <div className="mb-8 sm:mb-12 text-center sm:text-left">
            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                Billing & Plans
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Manage your subscription, view billing history, and upgrade your
                plan to unlock advanced features.
              </p>
            </div>
          </div>

          {/* Billing Tabs */}
          <Tabs defaultValue="overview" className="space-y-6 sm:space-y-8">
            <div className="flex justify-center px-2">
              <TabsList className="grid w-full max-w-sm sm:max-w-md grid-cols-3 h-10 sm:h-auto">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="plans" className="text-xs sm:text-sm">
                  Plans
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs sm:text-sm">
                  History
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6">
              {/* Current Plan Status */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3">
                        Current Plan
                        {status && (
                          <Badge
                            variant={
                              status.plan === "pro" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {status.plan.toUpperCase()}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Your current subscription plan and status
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {statusLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2 text-sm text-muted-foreground">
                        Loading...
                      </span>
                    </div>
                  ) : status ? (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                        <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-muted/30">
                          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5" />
                          <div className="space-y-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium">
                              Plan
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground capitalize truncate">
                              {status.plan}{" "}
                              {status.plan === "pro" ? "($10/month)" : "(Free)"}
                            </p>
                          </div>
                        </div>

                        {status.plan === "pro" && status.subscriptionStatus && (
                          <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-muted/30">
                            {status.cancelAtPeriodEnd ? (
                              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 mt-0.5" />
                            ) : (
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5" />
                            )}
                            <div className="space-y-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium">
                                Status
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground capitalize truncate">
                                {status.cancelAtPeriodEnd ? (
                                  <span className="text-orange-600">
                                    Canceled
                                  </span>
                                ) : (
                                  status.subscriptionStatus.replace("_", " ")
                                )}
                              </p>
                            </div>
                          </div>
                        )}

                        {(status.currentPeriodEnd || status.canceledAt) && (
                          <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-muted/30">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5" />
                            <div className="space-y-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium">
                                {status.cancelAtPeriodEnd
                                  ? "Access until"
                                  : "Next renewal"}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {formatDate(
                                  (status.currentPeriodEnd ||
                                    status.canceledAt)!
                                )}
                              </p>
                            </div>
                          </div>
                        )}

                        {status.paymentMethod && (
                          <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-muted/30">
                            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5" />
                            <div className="space-y-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium">
                                Payment method
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {status.paymentMethod.brand.toUpperCase()} ••••{" "}
                                {status.paymentMethod.last4}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        {status.plan === "free" ? (
                          <Button
                            onClick={handleUpgrade}
                            size="default"
                            className="w-full sm:w-auto text-sm"
                          >
                            <span className="hidden sm:inline">
                              Upgrade to Pro - $10/month
                            </span>
                            <span className="sm:hidden">Upgrade to Pro</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={handleManageSubscription}
                            disabled={loading}
                            size="default"
                            className="w-full sm:w-auto text-sm"
                          >
                            {loading ? "Opening..." : "Manage Subscription"}
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          onClick={fetchBillingStatus}
                          disabled={statusLoading}
                          className="w-full sm:w-auto text-sm"
                          size="sm"
                        >
                          {statusLoading ? "Refreshing..." : "Refresh"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Unable to load billing information
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plans" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
                {/* Free Plan */}
                <Card
                  className={`relative shadow-sm transition-all duration-200 hover:shadow-md ${
                    status?.plan === "free"
                      ? "ring-2 ring-primary shadow-md"
                      : ""
                  }`}
                >
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg sm:text-xl">Free</CardTitle>
                      {status?.plan === "free" && (
                        <Badge variant="default" className="text-xs">
                          Current Plan
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm sm:text-base">
                      Perfect for getting started
                    </CardDescription>
                    <div className="pt-2">
                      <span className="text-3xl sm:text-4xl font-bold">$0</span>
                      <span className="text-muted-foreground text-base sm:text-lg">
                        /month
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    <ul className="space-y-2 sm:space-y-3">
                      {PLAN_FEATURES.free.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 sm:gap-3"
                        >
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs sm:text-sm leading-relaxed">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-2 sm:pt-4">
                      {status?.plan !== "free" ? (
                        <Button
                          variant="outline"
                          disabled
                          className="w-full text-sm"
                        >
                          Current plan is Pro
                        </Button>
                      ) : (
                        <div className="text-center text-xs sm:text-sm text-muted-foreground">
                          You're currently on this plan
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Pro Plan */}
                <Card
                  className={`relative shadow-sm transition-all duration-200 hover:shadow-md ${
                    status?.plan === "pro"
                      ? "ring-2 ring-primary shadow-md"
                      : "border-primary/20"
                  }`}
                >
                  {status?.plan !== "pro" && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-3 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg sm:text-xl">Pro</CardTitle>
                      {status?.plan === "pro" && (
                        <Badge variant="default" className="text-xs">
                          Current Plan
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm sm:text-base">
                      Advanced features for serious investors
                    </CardDescription>
                    <div className="pt-2">
                      <span className="text-3xl sm:text-4xl font-bold">
                        $10
                      </span>
                      <span className="text-muted-foreground text-base sm:text-lg">
                        /month
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    <ul className="space-y-2 sm:space-y-3">
                      {PLAN_FEATURES.pro.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 sm:gap-3"
                        >
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs sm:text-sm leading-relaxed">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-2 sm:pt-4">
                      {status?.plan === "free" ? (
                        <Button
                          onClick={handleUpgrade}
                          className="w-full text-sm"
                          size="default"
                        >
                          Upgrade to Pro
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={handleManageSubscription}
                          disabled={loading}
                          className="w-full text-sm"
                          size="default"
                        >
                          {loading ? "Opening..." : "Manage Subscription"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card className="shadow-sm max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-xl">Billing History</CardTitle>
                  <CardDescription>
                    View your past invoices and payment history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!invoices.length && !invoicesLoading && (
                    <div className="text-center py-12">
                      <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                        <CreditCard className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-6">
                        No billing history available yet
                      </p>
                      <Button variant="outline" onClick={fetchInvoices}>
                        Load Billing History
                      </Button>
                    </div>
                  )}

                  {invoicesLoading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2 text-sm text-muted-foreground">
                        Loading billing history...
                      </span>
                    </div>
                  )}

                  {invoices.length > 0 && (
                    <div className="space-y-4">
                      {invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                              {invoice.status === "paid" ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium">
                                {formatCurrency(
                                  invoice.amount,
                                  invoice.currency
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(invoice.created)} • {invoice.status}
                              </p>
                            </div>
                          </div>
                          {invoice.invoice_pdf && (
                            <Button size="sm" variant="outline" asChild>
                              <a
                                href={invoice.invoice_pdf}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Download PDF
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Embedded Checkout Modal */}
          <EmbeddedCheckoutModal
            open={showCheckoutModal}
            onOpenChange={setShowCheckoutModal}
            onSuccess={handleCheckoutSuccess}
          />

          {/* Subscription Management Modal */}
          <SubscriptionManagementModal
            open={showManagementModal}
            onOpenChange={setShowManagementModal}
            currentPlan={status?.plan || "free"}
            billingStatus={status}
            onRefresh={fetchBillingStatus}
          />
        </div>
      </div>
    </div>
  );
}
