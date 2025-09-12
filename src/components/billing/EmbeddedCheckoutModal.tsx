"use client";

import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Get Stripe publishable key from environment
const getStripePublishableKey = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.error(
      "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable"
    );
    return "";
  }
  return key;
};

// Initialize Stripe
const stripePromise = loadStripe(getStripePublishableKey());

interface EmbeddedCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EmbeddedCheckoutModal({
  open,
  onOpenChange,
  onSuccess,
}: EmbeddedCheckoutModalProps) {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (open && !clientSecret) {
      createCheckoutSession();
    }
  }, [open, clientSecret]);

  const createCheckoutSession = async () => {
    try {
      setLoading(true);
      setError("");

      const publishableKey = getStripePublishableKey();
      if (!publishableKey) {
        throw new Error(
          "Stripe is not properly configured. Please contact support."
        );
      }

      const response = await fetch("/api/billing/checkout-embedded", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", response.status, errorData);
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      if (!data.clientSecret) {
        throw new Error("No client secret received from server");
      }

      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error("Checkout session error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load checkout. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setClientSecret("");
    setError("");
    onOpenChange(false);
  };

  const options = {
    clientSecret,
    onComplete: () => {
      // Handle successful completion
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 2000); // Give time for success message to show
    },
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[95vw] max-h-[90vh] p-0 overflow-hidden flex flex-col sm:max-w-lg">
        <DialogHeader className="p-4 pb-2 flex-shrink-0 border-b">
          <DialogTitle className="text-lg font-semibold">
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Complete your subscription to unlock all Pro features.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-3 text-sm text-muted-foreground">
                  Loading checkout...
                </span>
              </div>
            )}

            {error && (
              <div className="text-center py-6 space-y-3">
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createCheckoutSession}
                  disabled={loading}
                >
                  Try Again
                </Button>
              </div>
            )}

            {clientSecret && !loading && !error && (
              <div className="w-full [&_iframe]:!min-h-0">
                <EmbeddedCheckoutProvider
                  stripe={stripePromise}
                  options={options}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
