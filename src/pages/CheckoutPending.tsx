import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const CheckoutPending: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const reference = searchParams.get("reference");

  useEffect(() => {
    if (!reference) {
      setMessage("No order reference provided");
      setLoading(false);
      return;
    }

    checkPaymentStatus();
  }, [reference]);

  const checkPaymentStatus = async () => {
    try {
      setLoading(true);

      // Checking payment status
      // Clean the reference - remove any suffixes like ":1" that may be appended by payment providers
      const cleanReference = reference ? reference.split(':')[0] : reference;

      // Query payment_transactions to find the payment by reference
      const { data: paymentTx, error: txError } = await supabase
        .from("payment_transactions")
        .select("*, orders(*)")
        .eq("reference", cleanReference)
        .maybeSingle();

      if (txError) {
        console.error("Payment transaction not found:", txError);
        setMessage("Payment record not found. Please contact support.");
        return;
      }

      if (paymentTx) {
        setMessage("Your payment is being processed. This may take a few moments.");
      }
    } catch (err) {
      console.error("Error checking payment status:", err);
      setMessage(err instanceof Error ? err.message : "Failed to check payment status");
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrders = () => {
    navigate("/profile", { state: { tab: "orders" } });
  };

  const handleRetryPayment = () => {
    navigate("/checkout", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4 text-yellow-600" />
          <p className="text-gray-600">Checking payment status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Alert className="border-yellow-200 bg-yellow-50">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-semibold text-yellow-900">Payment Pending</p>
            <p className="text-yellow-800">{message || "Your payment is being processed."}</p>
            <p className="text-sm text-yellow-700 mt-2">
              Reference: {reference ? reference.split(':')[0] : 'N/A'}
            </p>
            <p className="text-sm text-yellow-700 mt-4">
              This usually takes 1-5 minutes. Please don't close this page.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <div className="flex gap-4 justify-center">
        <Button onClick={handleViewOrders} variant="outline">
          View My Orders
        </Button>
        <Button onClick={handleRetryPayment}>
          Continue Shopping
        </Button>
      </div>
    </div>
  );
};

export default CheckoutPending;
