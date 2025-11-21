import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";
import { jsonResponse, errorResponse, handleCorsPreflightRequest, safeErrorResponse } from "../_shared/response-utils.ts";
import { validateUUIDs, createUUIDErrorResponse } from "../_shared/uuid-validator.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest();
  }

  try {
    const bodyParseResult = await parseRequestBody(req, corsHeaders);
    if (!bodyParseResult.success) {
      return bodyParseResult.errorResponse!;
    }
    const requestData = bodyParseResult.data;

    const {
      order_id,
      seller_id,
    } = requestData;

    // Validate required fields
    const validationErrors = [];
    if (!order_id) validationErrors.push("order_id is required");
    if (!seller_id) validationErrors.push("seller_id is required");

    // Use UUID validator
    const validation = validateUUIDs({ order_id, seller_id });
    if (!validation.isValid) {
      return createUUIDErrorResponse(validation.errors, corsHeaders);
    }

    if (validationErrors.length > 0) {
      return errorResponse(
        "VALIDATION_FAILED",
        {
          validation_errors: validationErrors,
        },
        { status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get order and book details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        total_amount,
        book_id,
        status,
        delivery_status,
        books(id, price, title)
      `)
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return errorResponse(
        "ORDER_NOT_FOUND",
        {
          order_id,
          error_message: orderError?.message || "Order not found"
        },
        { status: 404 }
      );
    }

    // Only process if order is marked as delivered/collected
    if (order.delivery_status !== "collected" && order.delivery_status !== "delivered") {
      return errorResponse(
        "INVALID_DELIVERY_STATUS",
        {
          current_status: order.delivery_status,
          expected_status: "collected or delivered"
        },
        { status: 400 }
      );
    }

    // Check if payment has already been processed for this order
    const { data: existingTransaction } = await supabase
      .from("wallet_transactions")
      .select("id")
      .eq("reference_order_id", order_id)
      .eq("type", "credit")
      .single();

    if (existingTransaction) {
      return jsonResponse(
        {
          success: true,
          message: "Payment already processed for this order",
          order_id,
          seller_id,
        },
        { status: 200 }
      );
    }

    // Check if seller has active banking details
    const { data: bankingDetails } = await supabase
      .from("banking_subaccounts")
      .select("id, status")
      .eq("user_id", seller_id)
      .eq("status", "active")
      .single();

    // If seller has active banking details, payment will be sent directly to their bank account
    // Email notification is already sent in the OrderCompletionCard component
    if (bankingDetails) {
      return jsonResponse(
        {
          success: true,
          message: "Seller has banking details. Payment will be sent directly to their account.",
          order_id,
          seller_id,
          payment_method: "direct_bank_transfer",
        },
        { status: 200 }
      );
    }

    // No banking details - credit wallet as fallback payment method
    const bookPrice = order.books?.price || 0;

    const { data: creditResult, error: creditError } = await supabase
      .rpc('credit_wallet_on_collection', {
        p_seller_id: seller_id,
        p_order_id: order_id,
        p_book_price: bookPrice,
      });

    if (creditError || !creditResult) {
      console.error("Error crediting wallet:", creditError);
      return errorResponse(
        "WALLET_CREDIT_FAILED",
        {
          error_message: creditError?.message || "Failed to credit wallet",
          order_id,
          seller_id,
        },
        { status: 500 }
      );
    }

    return jsonResponse(
      {
        success: true,
        message: "Wallet credited successfully",
        order_id,
        seller_id,
        payment_method: "wallet_credit",
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error in credit-wallet-on-collection:", error);
    return safeErrorResponse(
      error,
      "INTERNAL_SERVER_ERROR",
      corsHeaders,
    );
  }
});
