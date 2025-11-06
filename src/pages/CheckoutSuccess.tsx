import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { OrderConfirmation } from "@/types/checkout";
import Step4Confirmation from "@/components/checkout/Step4Confirmation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const CheckoutSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<OrderConfirmation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reference = searchParams.get("reference");

  useEffect(() => {
    if (!reference) {
      setError("No order reference provided");
      setLoading(false);
      return;
    }

    fetchOrderData();
  }, [reference]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching order data for reference:", reference);

      // Query payment_transactions to find the order by reference
      const { data: paymentTx, error: txError } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("reference", reference)
        .single();

      if (txError || !paymentTx) {
        console.error("Payment transaction not found:", txError);
        setError("Order not found. Please check your reference number.");
        return;
      }

      console.log("Payment transaction found:", paymentTx);

      // Now fetch the corresponding order from orders table
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", paymentTx.order_id)
        .single();

      if (orderError || !order) {
        console.error("Order not found:", orderError);
        setError("Order details could not be retrieved");
        return;
      }

      console.log("Order found:", order);

      // Construct OrderConfirmation object from order data
      const confirmation: OrderConfirmation = {
        order_id: order.id,
        payment_reference: paymentTx.custom_payment_id,
        book_id: order.book_id,
        seller_id: order.seller_id,
        buyer_id: order.buyer_id,
        book_title: order.book_title || "Book",
        book_price: order.book_price || 0,
        delivery_method: order.delivery_option || "Standard",
        delivery_price: order.selected_shipping_cost || 0,
        platform_fee: 20,
        total_paid: order.total_amount || 0,
        created_at: order.created_at || new Date().toISOString(),
        status: order.status || "pending",
      };

      setOrderData(confirmation);
    } catch (err) {
      console.error("Error fetching order data:", err);
      setError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrders = () => {
    navigate("/profile", { state: { tab: "orders" } });
  };

  const handleContinueShopping = () => {
    navigate("/books");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your order confirmation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Unable to Load Order</p>
              <p>{error}</p>
              <p className="text-sm text-gray-600 mt-2">
                Reference: {reference}
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Try Again
          </Button>
          <Button onClick={handleContinueShopping}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Order data could not be retrieved. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <Step4Confirmation
        orderData={orderData}
        onViewOrders={handleViewOrders}
        onContinueShopping={handleContinueShopping}
      />
    </div>
  );
};

export default CheckoutSuccess;
