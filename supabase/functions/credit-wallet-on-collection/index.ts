import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
        View Your Wallet &amp; Profile
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

// UUID validation helper
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    let requestData;
    try {
      const bodyText = await req.text();
      requestData = bodyText ? JSON.parse(bodyText) : {};
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_JSON",
          message: "Request body must be valid JSON"
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { order_id, seller_id } = requestData;

    // Validate required fields
    if (!order_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "VALIDATION_FAILED",
          message: "order_id is required"
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!seller_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "VALIDATION_FAILED",
          message: "seller_id is required"
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate UUIDs
    if (!isValidUUID(order_id)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_UUID",
          message: "order_id must be a valid UUID"
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidUUID(seller_id)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_UUID",
          message: "seller_id must be a valid UUID"
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get order details with seller info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, total_amount, book_id, status, delivery_status, seller_email, seller_full_name")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ORDER_NOT_FOUND",
          message: orderError?.message || "Order not found",
          order_id
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    // Check if book_id exists
    if (!order.book_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "NO_BOOK_ID",
          message: "Order does not have a book_id",
          order_id
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the book details to get the correct price
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id, price, title")
      .eq("id", order.book_id)
      .single();

    if (bookError || !book) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "BOOK_NOT_FOUND",
          message: bookError?.message || "Book not found",
          book_id: order.book_id
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    // Use the book's price directly
    const bookPrice = Number(book.price);

    if (!bookPrice || bookPrice <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_BOOK_PRICE",
          message: "Book price is invalid or zero",
          book_id: book.id,
          book_price: bookPrice
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    // Check if seller has active banking details
    const { data: bankingDetails } = await supabase
      .from("banking_subaccounts")
      .select("id, status")
      .eq("user_id", seller_id)
      .eq("status", "active")
      .single();

    // If seller has active banking details, payment will be sent directly
    if (bankingDetails) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Seller has banking details. Payment will be sent directly to their account.",
          order_id,
          seller_id,
          payment_method: "direct_bank_transfer",
          book_price: bookPrice
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No banking details - credit wallet
    // Call RPC with explicit numeric type cast
    const { data: creditResult, error: creditError } = await supabase
      .rpc('credit_wallet_on_collection', {
        p_seller_id: seller_id,
        p_order_id: order_id,
        p_book_price: bookPrice.toString(), // Convert to string to match numeric type
      });

    if (creditError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "RPC_ERROR",
          message: creditError.message || "Failed to credit wallet via RPC",
          details: {
            order_id,
            seller_id,
            book_price: bookPrice,
            error: creditError.message
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check RPC response
    if (!creditResult || !Array.isArray(creditResult) || creditResult.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_RPC_RESPONSE",
          message: "Unexpected response from wallet credit function",
          order_id,
          seller_id
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rpcResult = creditResult[0];

    if (!rpcResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "WALLET_CREDIT_FAILED",
          message: rpcResult.error_message || "Failed to credit wallet",
          order_id,
          seller_id,
          book_price: bookPrice
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    // Get amounts from RPC result (already in rands, not cents)
    const creditAmount = Number(rpcResult.credit_amount);
    const newBalance = Number(rpcResult.new_balance);

    // Get seller details from order
    const sellerEmail = order.seller_email;
    const sellerName = order.seller_full_name || "Seller";

    if (sellerEmail) {

      // Create in-app notification
      try {
        const { error: notifError } = await supabase.from("notifications").insert({
          user_id: seller_id,
          type: "success",
          title: "💰 Payment Received!",
          message: `Credit of R${creditAmount.toFixed(2)} has been added to your wallet for "${book.title}". New balance: R${newBalance.toFixed(2)}`
        });

        if (notifError) {
          // Failed to create notification
        } else {
          // Notification created
        }
      } catch (notificationError) {
      }

      // Send email notification
      try {
        const emailHtml = generateSellerCreditEmailHTML({
          sellerName,
          bookTitle: book.title,
          bookPrice: bookPrice,
          creditAmount: creditAmount,
          orderId: order_id,
          newBalance: newBalance,
        });

        // Create a service role client for function invocation
        const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
          global: {
            headers: {
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
              apikey: SUPABASE_SERVICE_KEY,
            },
          },
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });

        const { data: emailResult, error: emailError } = await serviceClient.functions.invoke("send-email", {
          body: {
            to: sellerEmail,
            subject: '💰 Payment Received - Credit Added to Your Account - ReBooked Solutions',
            html: emailHtml,
            text: `Payment Received! Credit of R${creditAmount.toFixed(2)} has been added to your wallet for "${book.title}". New balance: R${newBalance.toFixed(2)}`,
          },
        });

        if (emailError) {
          // Failed to send email
        } else {
          // Email sent successfully
        }
      } catch (emailError) {
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Wallet credited successfully with 90% of book price",
        order_id,
        seller_id,
        payment_method: "wallet_credit",
        book_price: bookPrice,
        credit_amount: creditAmount,
        percentage: "90%"
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
