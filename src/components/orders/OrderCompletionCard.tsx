import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertCircle, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrderCompletionCardProps {
  orderId: string;
  bookTitle: string;
  sellerName: string;
  deliveredDate?: string;
  onFeedbackSubmitted?: (feedback: any) => void;
}

const OrderCompletionCard: React.FC<OrderCompletionCardProps> = ({
  orderId,
  bookTitle,
  sellerName,
  deliveredDate,
  onFeedbackSubmitted,
}) => {
  const [receivedStatus, setReceivedStatus] = useState<"received" | "not_received" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState<{
    buyer_status: string;
    buyer_feedback: string;
  } | null>(null);

  const handleSubmitFeedback = async () => {
    if (!receivedStatus) {
      toast.error("Please select whether you received the order");
      return;
    }

    if (!feedback.trim() && receivedStatus === "not_received") {
      toast.error("Please provide details about the issue");
      return;
    }

    setIsSubmitting(true);
    try {
      // Get current user
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (!userId) {
        toast.error("User not authenticated");
        return;
      }

      // Fetch ALL order details from orders table
      const { data: order, error: orderFetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderFetchError || !order) {
        console.error("Error fetching order:", {
          error: orderFetchError,
          orderId
        });
        toast.error("Could not find order details");
        return;
      }

      if (!order.seller_id || !order.book_id) {
        console.error("Order missing required data:", {
          seller_id: order.seller_id,
          book_id: order.book_id,
          orderId
        });
        toast.error("Order data incomplete. Please contact support.");
        return;
      }

      // Prepare feedback data - copy all relevant fields from orders table
      const feedbackData: any = {
        order_id: orderId,
        buyer_id: userId,
        seller_id: order.seller_id,
        book_id: order.book_id,
        buyer_status: receivedStatus,
        buyer_feedback: feedback.trim(),
        updated_at: new Date().toISOString(),
        // Copy additional fields from orders table
        amount: order.amount || null,
        total_amount: order.total_amount || null,
        delivery_fee: order.delivery_fee || null,
        platform_fee: order.platform_fee || null,
        status: order.status || null,
        payment_status: order.payment_status || null,
        delivery_status: order.delivery_status || null,
        tracking_number: order.tracking_number || null,
        buyer_email: order.buyer_email || null,
        buyer_phone: order.buyer_phone || null,
        payment_reference: order.payment_reference || null,
        commit_deadline: order.commit_deadline || null,
        committed_at: order.committed_at || null,
        refund_status: order.refund_status || null,
        refunded_at: order.refunded_at || null,
      };

      // Update or insert buyer feedback
      const { error } = await supabase.from("buyer_feedback_orders").upsert(
        feedbackData,
        {
          onConflict: "order_id",
        }
      );

      if (error) {
        console.error("Error submitting feedback:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: JSON.stringify(error, null, 2)
        });

        // Provide specific error messages
        let errorMessage = "Failed to submit feedback";
        if (error.code === "23503") {
          errorMessage = "Order data incomplete. Please refresh and try again.";
        } else if (error.code === "42501") {
          errorMessage = "Permission denied. Please check your account.";
        } else if (error.message?.includes("permission")) {
          errorMessage = "You don't have permission to submit feedback for this order.";
        }

        toast.error(errorMessage);
        return;
      }

      setSubmittedFeedback({
        buyer_status: receivedStatus,
        buyer_feedback: feedback.trim(),
      });
      setIsSubmitted(true);
      toast.success("Feedback submitted successfully!");

      // Create notification
      try {
        await supabase.from("order_notifications").insert({
          order_id: orderId,
          user_id: userId,
          type: "feedback_submitted",
          title: "Order Feedback Received",
          message: `Thank you for confirming delivery of ${bookTitle}.`,
        });
      } catch (notifErr) {
        console.warn("Failed to create notification:", notifErr);
      }

      if (onFeedbackSubmitted) {
        onFeedbackSubmitted({
          buyer_status: receivedStatus,
          buyer_feedback: feedback.trim(),
        });
      }
    } catch (err: any) {
      console.error("Error submitting feedback:", {
        message: err?.message,
        stack: err?.stack,
        fullError: JSON.stringify(err, null, 2)
      });
      toast.error(err?.message || "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted && submittedFeedback) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-700">Delivery Confirmed</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-green-700">
            <p className="font-semibold mb-1">Thank you for confirming delivery!</p>
            <p>Your feedback helps us maintain quality service on ReBooked Solutions.</p>
          </div>
          {submittedFeedback.buyer_status === "received" && (
            <Alert className="border-green-200 bg-white">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Order marked as received. Thank you for your purchase!
              </AlertDescription>
            </Alert>
          )}
          {submittedFeedback.buyer_status === "not_received" && submittedFeedback.buyer_feedback && (
            <Alert className="border-amber-200 bg-white">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                We've received your report. Our team will investigate: "{submittedFeedback.buyer_feedback}"
              </AlertDescription>
            </Alert>
          )}
          <div className="bg-white p-3 rounded-lg border border-green-100 text-xs text-gray-600 space-y-1">
            <p>
              <strong>Book:</strong> {bookTitle}
            </p>
            <p>
              <strong>From:</strong> {sellerName}
            </p>
            <p>
              <strong>Order ID:</strong> {orderId.slice(-8)}
            </p>
            <p>
              <strong>Status:</strong> {submittedFeedback.buyer_status === "received" ? "✅ Received" : "⚠️ Not Received"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-blue-700">Order Delivered</CardTitle>
        </div>
        <p className="text-sm text-blue-600 mt-1">
          {deliveredDate
            ? `Delivered on ${new Date(deliveredDate).toLocaleDateString()}`
            : "Please confirm receipt of your order"}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900">Did you receive the order?</h4>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={receivedStatus === "received" ? "default" : "outline"}
              onClick={() => setReceivedStatus("received")}
              className={`${
                receivedStatus === "received"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : ""
              }`}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Yes, I received it
            </Button>
            <Button
              variant={receivedStatus === "not_received" ? "default" : "outline"}
              onClick={() => setReceivedStatus("not_received")}
              className={`${
                receivedStatus === "not_received"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : ""
              }`}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              No, there's an issue
            </Button>
          </div>
        </div>

        <Separator />

        {receivedStatus && (
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <h4 className="font-semibold text-sm mb-2 text-gray-900">
                {receivedStatus === "received"
                  ? "✅ Order Details"
                  : "⚠️ Report an Issue"}
              </h4>
              <div className="text-xs text-gray-600 space-y-1 mb-3">
                <p>
                  <strong>Book:</strong> {bookTitle}
                </p>
                <p>
                  <strong>From:</strong> {sellerName}
                </p>
                <p>
                  <strong>Order ID:</strong> {orderId.slice(-8)}
                </p>
              </div>
            </div>

            {receivedStatus === "not_received" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900 block">
                  Please describe the issue:
                </label>
                <Textarea
                  placeholder="e.g., Book arrived damaged, wrong book sent, book never arrived, etc."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <p className="text-xs text-gray-500">
                  Be as specific as possible to help us resolve this quickly
                </p>
              </div>
            )}

            {receivedStatus === "received" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900 block">
                  Add optional feedback (optional):
                </label>
                <Textarea
                  placeholder="e.g., Excellent condition, quick delivery, great value, etc."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                <p className="text-xs text-gray-500">
                  Your feedback helps us and our sellers provide better service
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleSubmitFeedback}
                disabled={isSubmitting || !receivedStatus}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Confirmation
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setReceivedStatus(null);
                  setFeedback("");
                }}
                variant="outline"
              >
                Reset
              </Button>
            </div>
          </div>
        )}

        <Alert className="border-blue-200 bg-white">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-xs text-blue-700">
            {receivedStatus === "not_received"
              ? "Our team will contact you shortly to resolve this issue."
              : "Confirming delivery helps us complete your order and improves seller ratings."}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default OrderCompletionCard;
