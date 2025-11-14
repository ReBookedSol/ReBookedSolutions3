import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RefundRequest {
  payment_reference: string;
  amount?: number; // amount in kobo/cents - if null, full refund
  reason?: string;
  order_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const isHealthCheck = url.searchParams.get("health") === "true";

    if (isHealthCheck) {
      return new Response(
        JSON.stringify({
          success: true,
          service: "refund-management",
          status: "healthy",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "METHOD_NOT_ALLOWED",
          message: "Only POST requests are supported",
        }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!PAYSTACK_SECRET_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_NOT_CONFIGURED",
          message: "Paystack secret key not configured",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestData: RefundRequest = await req.json();
    const { payment_reference, amount, reason, order_id } = requestData;

    if (!payment_reference) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYMENT_REFERENCE_REQUIRED",
          message: "payment_reference is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Processing refund - sensitive data not logged

    if (payment_reference.includes("test_") || payment_reference.includes("mock_")) {
      const mockRefund = {
        id: `refund_${Date.now()}`,
        transaction: payment_reference,
        amount: amount ?? 10000,
        currency: "ZAR",
        status: "pending",
        refunded_at: new Date().toISOString(),
      } as const;

      if (order_id) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        await supabase.from("refund_transactions").insert({
          transaction_reference: payment_reference,
          order_id,
          amount: amount ?? 10000,
          reason: reason || "Mock refund",
          status: "success",
          paystack_refund_reference: mockRefund.id,
          paystack_response: mockRefund,
        });
      }

      return new Response(
        JSON.stringify({ success: true, data: mockRefund, mock: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const refundPayload: any = {
      transaction: payment_reference,
      merchant_note: reason || "Refund processed",
    };

    if (amount !== null && amount !== undefined) {
      refundPayload.amount = amount;
    }

    const response = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(refundPayload),
    });

    const result = await response.json();

    if (!response.ok || !result.status) {
      return new Response(
        JSON.stringify({ success: false, error: result.message || "Refund failed", details: result }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (order_id && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        await supabase.from("refund_transactions").insert({
          transaction_reference: payment_reference,
          order_id,
          amount: result.data?.amount ?? amount,
          reason: reason || "Refund processed",
          status: result.data?.status || "pending",
          paystack_refund_reference: result.data?.id?.toString(),
          paystack_response: result.data,
        });
      } catch (dbError) {
        console.error("Failed to store refund in database:", dbError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: result.data?.id?.toString(),
          status: result.data?.status,
          amount: result.data?.amount,
          currency: result.data?.currency,
          transaction: result.data?.transaction,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Refund management error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "UNEXPECTED_ERROR", message: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
