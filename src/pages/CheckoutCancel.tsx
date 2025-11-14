import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const CheckoutCancel: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const reference = searchParams.get("reference");

  useEffect(() => {
    if (!reference) {
      setLoading(false);
      return;
    }

    recordCancellation();
  }, [reference]);

  const recordCancellation = async () => {
    try {
      setLoading(true);

      // Recording payment cancellation

      // Clean the reference - remove any suffixes like ":1" that may be appended by payment providers
      const cleanReference = reference ? reference.split(':')[0] : reference;

      // Update payment transaction status if it exists
      const { error: updateError } = await supabase
        .from("payment_transactions")
        .update({ status: "cancelled" })
        .eq("reference", cleanReference);

      if (updateError) {
        console.warn("Could not update payment transaction:", updateError);
      }
    } catch (err) {
      console.error("Error recording cancellation:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = () => {
    navigate("/checkout", { replace: true });
  };

  const handleContinueShopping = () => {
    navigate("/books");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-semibold">Payment Cancelled</p>
            <p>Your payment has been cancelled. No charges have been made to your account.</p>
            <p className="text-sm text-gray-600 mt-2">
              Reference: {reference ? reference.split(':')[0] : 'N/A'}
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <div className="flex gap-4 justify-center">
        <Button onClick={handleRetryPayment}>
          Try Again
        </Button>
        <Button onClick={handleContinueShopping} variant="outline">
          Continue Shopping
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <p className="text-sm text-gray-700">
          <strong>Need help?</strong> If you experienced any issues with the payment process, please contact our support team.
        </p>
        <Button
          variant="link"
          onClick={() => navigate("/contact-us")}
          className="text-blue-600 p-0 h-auto"
        >
          Contact Support
        </Button>
      </div>
    </div>
  );
};

export default CheckoutCancel;
