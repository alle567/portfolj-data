"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreditCard, Check } from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface UpdatePaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function PaymentMethodForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError("Card element not found");
      setLoading(false);
      return;
    }

    try {
      // Create setup intent
      const response = await fetch("/api/billing/setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to create setup intent");
      }

      const { client_secret } = await response.json();

      // Confirm the setup intent with the card
      const { error: confirmError, setupIntent } =
        await stripe.confirmCardSetup(client_secret, {
          payment_method: {
            card: cardElement,
          },
        });

      if (confirmError) {
        setError(confirmError.message || "Failed to update payment method");
      } else {
        // Set the new payment method as default
        if (setupIntent?.payment_method) {
          const updateResponse = await fetch(
            "/api/billing/update-default-payment-method",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                payment_method_id: setupIntent.payment_method,
              }),
              credentials: "include",
            }
          );

          if (!updateResponse.ok) {
            throw new Error("Failed to set payment method as default");
          }
        }

        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-green-600 mb-2">
          Payment Method Updated!
        </h3>
        <p className="text-sm text-muted-foreground">
          Your payment method has been successfully updated.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Input Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Card Information</label>
          <div className="p-4 border-2 rounded-lg bg-white focus-within:border-blue-500 transition-colors">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#1f2937",
                    fontFamily: "system-ui, sans-serif",
                    "::placeholder": {
                      color: "#9ca3af",
                    },
                  },
                  invalid: {
                    color: "#ef4444",
                  },
                },
                hidePostalCode: true,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Your payment information is secure and encrypted
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            type="submit"
            disabled={!stripe || loading}
            className="w-full h-12 text-base"
          >
            {loading ? "Updating Payment Method..." : "Update Payment Method"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="w-full h-10"
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export function UpdatePaymentMethodModal({
  open,
  onOpenChange,
  onSuccess,
}: UpdatePaymentMethodModalProps) {
  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw]">
        <DialogHeader>
          <DialogTitle>Update Payment Method</DialogTitle>
          <DialogDescription>
            Update the payment method for your Pro subscription.
          </DialogDescription>
        </DialogHeader>

        <Elements stripe={stripePromise}>
          <PaymentMethodForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}
