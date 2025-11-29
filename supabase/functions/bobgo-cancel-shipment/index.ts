import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bodyResult = await parseRequestBody<{
      order_id?: string;
      shipment_id?: string;
      tracking_number?: string;
      reason?: string;
    }>(req, corsHeaders);
    if (!bodyResult.success) return bodyResult.errorResponse!;

    const { order_id, shipment_id, tracking_number, reason } = bodyResult.data!;

    if (!order_id && !shipment_id && !tracking_number) {
      return new Response(
        JSON.stringify({ success: false, error: "order_id, shipment_id, or tracking_number required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get order from database with delivery type information
    let orderQuery = supabase
      .from("orders")
      .select("id, tracking_number, delivery_data, status, pickup_type, delivery_type, pickup_locker_data, delivery_locker_data");

    if (order_id) {
      orderQuery = orderQuery.eq("id", order_id);
    } else if (tracking_number) {
      orderQuery = orderQuery.eq("tracking_number", tracking_number);
    } else if (shipment_id) {
      orderQuery = orderQuery.eq("delivery_data->>shipment_id", shipment_id.toString());
    }

    const { data: order, error: orderError } = await orderQuery.maybeSingle();

    if (orderError) {
      return new Response(
        JSON.stringify({ success: false, error: `Database error: ${orderError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!order) {
      return new Response(
        JSON.stringify({ success: false, error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    // Validate cancellation is possible for this order status
    const cancellableStatuses = [
      'paid', 'pending_commit', 'committed', 'pickup_scheduled',
      'in_transit', 'out_for_delivery', 'pickup_attempted'
    ];

    if (!cancellableStatuses.includes(order.status)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Cannot cancel order with status: ${order.status}`,
          message: "Order can only be cancelled if not yet delivered or already cancelled"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use tracking_number as the identifier (BobGo uses this for all shipment types)
    const identifier = order.tracking_number;

    if (!identifier) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Order has no tracking number - cannot cancel shipment",
          message: "This order may not have been shipped yet"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const BOBGO_API_KEY = Deno.env.get("BOBGO_API_KEY");

    if (!BOBGO_API_KEY) {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
          cancellation_reason: reason || "Cancelled (simulated - no API key)",
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateError) {
        return new Response(
          JSON.stringify({ success: false, error: `Failed to update order: ${updateError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          message: "Order cancelled in database (API key not configured - shipment not cancelled with courier)",
          order_id: order.id,
          tracking_number: identifier,
          delivery_combination: `${order.pickup_type}-to-${order.delivery_type}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    function resolveBaseUrl() {
      const env = (Deno.env.get("BOBGO_BASE_URL") || "").trim().replace(/\/+$/, "");
      if (!env) return "https://api.bobgo.co.za/v2";
      if (env.includes("sandbox.bobgo.co.za") && !env.includes("api.sandbox.bobgo.co.za")) {
        return "https://api.sandbox.bobgo.co.za/v2";
      }
      if (env.includes("bobgo.co.za") && !/\/v2$/.test(env)) {
        return env + "/v2";
      }
      return env;
    }

    const BOBGO_BASE_URL = resolveBaseUrl();

    try {
      const resp = await fetch(`${BOBGO_BASE_URL}/shipments/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${BOBGO_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          tracking_reference: identifier,
          cancellation_reason: reason || "Cancelled by merchant",
        }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");

        // Still update the order in database even if API call fails
        await supabase
          .from("orders")
          .update({
            status: "cancelled",
            cancellation_reason: reason || `API error: ${text}`,
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        return new Response(
          JSON.stringify({
            success: false,
            error: `BobGo API error: ${text}`,
            message: "Order marked as cancelled in database, but BobGo API call failed",
            order_updated: true,
            delivery_combination: `${order.pickup_type}-to-${order.delivery_type}`
          }),
          { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await resp.json();

      // Update order in database with cancellation metadata
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
          cancellation_reason: reason || "Cancelled via API",
          cancelled_at: new Date().toISOString(),
          delivery_data: {
            ...order.delivery_data,
            cancellation_response: data,
            cancelled_delivery_type: `${order.pickup_type}-to-${order.delivery_type}`
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateError) {
        return new Response(
          JSON.stringify({
            success: true,
            warning: "Shipment cancelled with BobGo but database update failed",
            bobgo_response: data,
            db_error: updateError.message,
            delivery_combination: `${order.pickup_type}-to-${order.delivery_type}`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Shipment cancelled successfully",
          order_id: order.id,
          tracking_number: identifier,
          delivery_combination: `${order.pickup_type}-to-${order.delivery_type}`,
          bobgo_response: data
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err: any) {

      // Mark as cancelled in DB even if API fails
      await supabase
        .from("orders")
        .update({
          status: "cancelled",
          cancellation_reason: reason || `Error: ${err.message}`,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: err.message || "Cancel failed",
          message: "Order marked as cancelled in database, but API call failed",
          order_updated: true,
          delivery_combination: `${order.pickup_type}-to-${order.delivery_type}`
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
