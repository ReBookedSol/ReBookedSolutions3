import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id, reason } = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ success: false, error: "order_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("payment_reference, total_amount, amount, tracking_number, delivery_status, status, committed_at, payment_transactions(*)")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ success: false, error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let shipmentCancelResult: any = null;
    let shouldRefund = true;

    if (order.tracking_number) {
      const cancelResponse = await supabase.functions.invoke("bobgo-cancel-shipment", {
        body: { order_id, reason },
      });

      shipmentCancelResult = cancelResponse.data;

      if (cancelResponse.error || !cancelResponse.data?.success) {
        const responseText = JSON.stringify(cancelResponse.data || {}).toLowerCase();
        if (
          responseText.includes("too late") ||
          responseText.includes("already shipped") ||
          responseText.includes("in transit") ||
          responseText.includes("out for delivery") ||
          responseText.includes("delivered") ||
          order.delivery_status === "delivered" ||
          order.delivery_status === "completed"
        ) {
          shouldRefund = false;
        }
      }
    }

    let refundResult: any = null;

    if (shouldRefund && order.payment_reference) {
      // Check if order is uncommitted - if so, use BobPayRefund
      const isUncommitted = !order.committed_at;

      if (isUncommitted) {
        // For uncommitted orders, use BobPayRefund
        const refundResponse = await supabase.functions.invoke("bobpay-refund", {
          body: {
            order_id,
            reason: reason || "Order cancelled",
          },
        });

        refundResult = refundResponse.data;

        if (refundResult?.success) {
          await supabase
            .from("orders")
            .update({
              refund_status: refundResult.data?.status || "success",
              refund_reference: refundResult.data?.refund_id,
              refunded_at: new Date().toISOString(),
            })
            .eq("id", order_id);
        }
      } else {
        // Use Refund Management for committed orders
        const refundResponse = await supabase.functions.invoke("refund-management", {
          body: {
            payment_reference: order.payment_reference,
            amount: null,
            reason: reason || "Order cancelled",
            order_id,
          },
        });

        refundResult = refundResponse.data;

        if (refundResult?.success) {
          await supabase
            .from("orders")
            .update({
              refund_status: refundResult.data?.status || "pending",
              refund_reference: refundResult.data?.id,
              refunded_at: new Date().toISOString(),
            })
            .eq("id", order_id);
        }
      }
    }

    await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancellation_reason: reason || "Cancelled by user",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: shouldRefund
          ? "Order cancelled and refund processed"
          : "Order cancelled but refund skipped (shipment already in progress)",
        shipment_cancelled: shipmentCancelResult?.success || false,
        refund_processed: shouldRefund && refundResult?.success,
        shipment_result: shipmentCancelResult,
        refund_result: refundResult,
        refund_skipped: !shouldRefund,
        refund_skip_reason: !shouldRefund ? "Shipment already in progress or delivered" : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("cancel-order-with-refund error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
