import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";
import { jsonResponse, errorResponse, handleCorsPreflightRequest, safeErrorResponse } from "../_shared/response-utils.ts";
import { validateUUIDs, createUUIDErrorResponse } from "../_shared/uuid-validator.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const EMAIL_STYLES = `<style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f3fef7;
    padding: 20px;
    color: #1f4e3d;
    margin: 0;
  }
  .container {
    max-width: 500px;
    margin: auto;
    background-color: #ffffff;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  .btn {
    display: inline-block;
    padding: 12px 20px;
    background-color: #3ab26f;
    color: white;
    text-decoration: none;
    border-radius: 5px;
    margin-top: 20px;
    font-weight: bold;
  }
  .link {
    color: #3ab26f;
  }
  .header {
    background: #3ab26f;
    color: white;
    padding: 20px;
    text-align: center;
    border-radius: 10px 10px 0 0;
    margin: -30px -30px 20px -30px;
  }
  .info-box {
    background: #f3fef7;
    border: 1px solid #3ab26f;
    padding: 15px;
    border-radius: 5px;
    margin: 15px 0;
  }
  .info-box-success {
    background: #f0fdf4;
    border: 1px solid #10b981;
    padding: 15px;
    border-radius: 5px;
    margin: 15px 0;
  }
  .footer {
    background: #f3fef7;
    color: #1f4e3d;
    padding: 20px;
    text-align: center;
    font-size: 12px;
    line-height: 1.5;
    margin: 30px -30px -30px -30px;
    border-radius: 0 0 10px 10px;
    border-top: 1px solid #e5e7eb;
  }
  h1, h2, h3 { margin: 0 0 10px 0; color: #1f4e3d; }
  ul { margin: 10px 0; padding-left: 20px; }
  li { margin: 5px 0; }
  p { margin: 10px 0; line-height: 1.6; }
</style>`;

const EMAIL_FOOTER = `<div class="footer">
  <p>This is an automated message from ReBooked Solutions. Please do not reply to this email.</p>
  <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a></p>
  <p>Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
  <p style="margin-top: 15px; font-style: italic;">"Pre-Loved Pages, New Adventures"</p>
</div>`;

function generateSellerCreditEmailHTML(data: {
  sellerName: string;
  bookTitle: string;
  bookPrice: number;
  creditAmount: number;
  orderId: string;
  newBalance: number;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>💰 Payment Received - Credit Added to Your Account</title>
  ${EMAIL_STYLES}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Payment Received!</h1>
      <p>Your book has been delivered and credit has been added</p>
    </div>

    <p>Hello ${data.sellerName},</p>

    <p><strong>Great news!</strong> Your book <strong>"${data.bookTitle}"</strong> has been successfully delivered and received by the buyer. Your payment is now available in your wallet!</p>

    <div class="info-box-success">
      <h3 style="margin-top: 0; color: #10b981;">✅ Payment Confirmed</h3>
      <p style="margin: 0;"><strong>Credit has been added to your account!</strong></p>
    </div>

    <div class="info-box">
      <h3 style="margin-top: 0;">📋 Transaction Details</h3>
      <p><strong>Book Title:</strong> ${data.bookTitle}</p>
      <p><strong>Book Price:</strong> R${data.bookPrice.toFixed(2)}</p>
      <p><strong>Commission Rate:</strong> 10% (You keep 90%)</p>
      <p style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px;"><strong>Credit Added:</strong> <span style="font-size: 1.2em; color: #10b981;">R${data.creditAmount.toFixed(2)}</span></p>
      <p><strong>Order ID:</strong> ${data.orderId}</p>
    </div>

    <div class="info-box-success">
      <h3 style="margin-top: 0; color: #10b981;">💳 Your New Wallet Balance</h3>
      <p style="margin: 0; font-size: 1.1em; color: #10b981;"><strong>R${data.newBalance.toFixed(2)}</strong></p>
    </div>

    <h3>💡 What You Can Do Next:</h3>
    <ul>
      <li><strong>List More Books:</strong> Add more books to your inventory and earn from sales</li>
      <li><strong>Request Payout:</strong> Once you have accumulated funds, you can request a withdrawal to your bank account</li>
      <li><strong>View Transactions:</strong> Check your wallet history anytime in your profile</li>
      <li><strong>Track Orders:</strong> Monitor all your sales and deliveries</li>
    </ul>

    <h3>📊 Payment Methods:</h3>
    <p>You have two options to receive your funds:</p>
    <ol>
      <li><strong>Direct Bank Transfer:</strong> If you've set up banking details, payments are sent directly to your account within 1-2 business days</li>
      <li><strong>Wallet Credit:</strong> Funds are held in your wallet and can be used for future purchases or withdrawn anytime</li>
    </ol>

    <h3>🚀 Ready to Make More Sales?</h3>
    <p style="text-align: center; margin: 30px 0;">
      <a href="https://rebookedsolutions.co.za/profile?tab=overview" class="btn">
        View Your Wallet & Profile
      </a>
    </p>

    <p style="color: #1f4e3d;"><strong>Questions?</strong> Contact us at <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a></p>

    <p>Thank you for selling on ReBooked Solutions!</p>
    <p>Best regards,<br><strong>The ReBooked Solutions Team</strong></p>

    ${EMAIL_FOOTER}
  </div>
</body>
</html>`;
}


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
    const creditAmount = (bookPrice * 90) / 100; // 90% of book price

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

    // Get seller details for email notification
    try {
      const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

      if (userError) {
        console.error("Error fetching seller details:", userError);
      } else {
        const seller = users?.find(u => u.id === seller_id);
        const sellerEmail = seller?.email;
        const sellerName = seller?.user_metadata?.first_name || seller?.user_metadata?.name || "Seller";

        if (sellerEmail) {
          // Get updated wallet balance
          const { data: walletData } = await supabase
            .from("user_wallets")
            .select("available_balance")
            .eq("user_id", seller_id)
            .single();

          const newBalance = walletData?.available_balance || creditAmount;

          // Send email notification
          try {
            await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
              },
              body: JSON.stringify({
                to: sellerEmail,
                subject: '💰 Payment Received - Credit Added to Your Account - ReBooked Solutions',
                html: generateSellerCreditEmailHTML({
                  sellerName,
                  bookTitle: order.books?.title || 'Unknown Book',
                  bookPrice: bookPrice / 100, // Convert from cents to rands
                  creditAmount: creditAmount / 100, // Convert from cents to rands
                  orderId: order_id,
                  newBalance: newBalance / 100, // Convert from cents to rands
                }),
              }),
            });
          } catch (emailError) {
            console.error("Error sending credit notification email:", emailError);
            // Don't fail the whole operation if email fails
          }
        }
      }
    } catch (error) {
      console.error("Error in email notification process:", error);
      // Don't fail the whole operation if email notification fails
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
