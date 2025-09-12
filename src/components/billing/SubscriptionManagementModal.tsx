"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { UpdatePaymentMethodModal } from "./UpdatePaymentMethodModal";

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: "free" | "pro";
  billingStatus: {
    currentPeriodEnd: number | null;
    cancelAtPeriodEnd: boolean;
    canceledAt: number | null;
    subscriptionStatus: string | null;
  } | null;
  onRefresh: () => void;
}

export function SubscriptionManagementModal({
  open,
  onOpenChange,
  currentPlan,
  billingStatus,
  onRefresh,
}: SubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showUpdatePayment, setShowUpdatePayment] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCancelSubscription = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancelSubscription = async () => {
    try {
      setCanceling(true);
      setShowCancelConfirm(false);

      const response = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      onRefresh();
      onOpenChange(false);
    } catch (error) {
      console.error("Cancel error:", error);
      alert("Failed to cancel subscription. Please try again.");
    } finally {
      setCanceling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/billing/reactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reactivate subscription");
      }

      onRefresh();
      onOpenChange(false);
    } catch (error) {
      console.error("Reactivate error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to reactivate subscription: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = () => {
    setShowUpdatePayment(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle>Manage Subscription</DialogTitle>
            <DialogDescription>
              Manage your Pro subscription and billing settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Plan Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Current Plan
                  <Badge
                    variant={currentPlan === "pro" ? "default" : "secondary"}
                  >
                    {currentPlan.toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentPlan === "pro" ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Active Pro subscription</span>
                    </div>

                    {/* Billing Date Information */}
                    {billingStatus?.currentPeriodEnd && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <div className="text-sm">
                          {billingStatus.cancelAtPeriodEnd ? (
                            <span className="text-orange-600">
                              Access until:{" "}
                              {formatDate(billingStatus.currentPeriodEnd)}
                            </span>
                          ) : (
                            <span>
                              Next renewal:{" "}
                              {formatDate(billingStatus.currentPeriodEnd)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Cancellation Status */}
                    {billingStatus?.cancelAtPeriodEnd && (
                      <div className="flex items-center gap-2 text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">
                          Subscription will be canceled
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm">Free plan</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Management Options */}
            {currentPlan === "pro" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    Subscription Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Only show Update Payment Method if subscription is not canceled */}
                  {!billingStatus?.cancelAtPeriodEnd && (
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={handleUpdatePayment}
                    >
                      <CreditCard className="h-4 w-4" />
                      Update Payment Method
                    </Button>
                  )}

                  {/* Show cancel button if not canceled, reactivate if canceled */}
                  {!billingStatus?.cancelAtPeriodEnd ? (
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 text-orange-600 hover:text-orange-700"
                      onClick={handleCancelSubscription}
                      disabled={canceling}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      {canceling ? "Canceling..." : "Cancel Subscription"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 text-green-600 hover:text-green-700"
                      onClick={handleReactivateSubscription}
                      disabled={loading}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {loading ? "Reactivating..." : "Reactivate Subscription"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Info */}
            <div className="text-xs text-muted-foreground text-center">
              Need help? Contact support for assistance with your subscription.
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your Pro subscription?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="text-sm text-orange-800">
                <div className="font-medium mb-1">
                  What happens when you cancel:
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>
                    You'll keep Pro access until{" "}
                    {billingStatus?.currentPeriodEnd &&
                    billingStatus.currentPeriodEnd
                      ? formatDate(billingStatus.currentPeriodEnd)
                      : "the end of your billing period"}
                  </li>
                  <li>No further charges will be made</li>
                  <li>You can reactivate anytime before the period ends</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1"
              >
                Keep Subscription
              </Button>
              <Button
                variant="destructive"
                onClick={confirmCancelSubscription}
                disabled={canceling}
                className="flex-1"
              >
                {canceling ? "Canceling..." : "Cancel Subscription"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Payment Method Modal */}
      <UpdatePaymentMethodModal
        open={showUpdatePayment}
        onOpenChange={setShowUpdatePayment}
        onSuccess={() => {
          onRefresh();
          setShowUpdatePayment(false);
        }}
      />
    </>
  );
}
