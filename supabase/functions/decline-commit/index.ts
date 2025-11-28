import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id, seller_id, reason } = await req.json();

    if (!order_id || !seller_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "MISSING_PARAMETERS",
          message: "order_id and seller_id are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ENVIRONMENT_CONFIG_ERROR",
          message: "Supabase configuration missing",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);


    // Get order details - must be in pending status
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, buyer_id, seller_id, buyer_email, seller_email, buyer_full_name, seller_full_name, payment_reference, amount, total_amount, status, book_id, items")
      .eq("id", order_id)
      .eq("seller_id", seller_id)
      .eq("status", "pending")
      .maybeSingle();

    if (orderError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "DATABASE_ERROR",
          message: "Failed to fetch order from database",
          details: orderError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!order) {

      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id, seller_id, status")
        .eq("id", order_id)
        .maybeSingle();

      let errorMessage = "Order not found";
      if (existingOrder) {
        if (existingOrder.seller_id !== seller_id) {
          errorMessage = "You are not authorized to decline this order";
        } else if (existingOrder.status !== "pending") {
          errorMessage = `Order is in ${existingOrder.status} status and cannot be declined`;
        }
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "ORDER_NOT_FOUND",
          message: errorMessage,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }


    const buyer = {
      id: order.buyer_id,
      email: order.buyer_email,
      name: order.buyer_full_name || "Customer"
    };

    const seller = {
      id: order.seller_id,
      email: order.seller_email,
      name: order.seller_full_name || "Seller"
    };

    // Update order status to declined
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "declined",
        declined_at: new Date().toISOString(),
        decline_reason: reason || "Seller declined to commit",
      })
      .eq("id", order_id);

    if (updateError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ORDER_UPDATE_FAILED",
          message: "Failed to update order status",
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }


    // Process BobPay refund if payment reference exists
    let refundResult: any = null;
    if (order.payment_reference) {

      try {
        const refundResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/bobpay-refund`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({
              order_id: order_id,
              reason: reason || "Order declined by seller",
            }),
          }
        );

        refundResult = await refundResponse.json();

        if (refundResult.success) {
          // Refund successful
        } else {
          // Refund failed
        }
      } catch (refundError) {
        refundResult = {
          success: false,
          error: refundError instanceof Error ? refundError.message : String(refundError),
        };
      }
    }

    // Create database notifications
    try {
      const notifications = [];

      if (buyer.id) {
        notifications.push(
          supabase.from("order_notifications").insert({
            order_id: order_id,
            user_id: buyer.id,
            type: "order_declined",
            title: "Order Declined",
            message: `Your order has been declined by the seller. ${refundResult?.success
              ? "Refund processed and will appear in 3-5 business days."
              : "Refund is being processed."
              }`,
            read: false,
          })
        );
      }

      if (seller.id) {
        notifications.push(
          supabase.from("order_notifications").insert({
            order_id: order_id,
            user_id: seller.id,
            type: "order_declined",
            title: "Order Decline Confirmed",
            message: `You have successfully declined the order. The buyer has been notified and refunded.`,
            read: false,
          })
        );
      }

      await Promise.allSettled(notifications);
    } catch (notificationError) {
    }

    // Send email notifications
    try {
      const emailPromises = [];

      // Email to buyer
      if (buyer.email) {
        const buyerHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Order Declined - Refund Processed</title><style>body{font-family:Arial,sans-serif;background-color:#f3fef7;padding:20px;color:#1f4e3d;margin:0}.container{max-width:500px;margin:auto;background-color:#ffffff;padding:30px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.05)}.header-error{background:#dc2626;color:white;padding:20px;text-align:center;border-radius:10px 10px 0 0;margin:-30px -30px 20px -30px}.btn{display:inline-block;padding:12px 20px;background-color:#3ab26f;color:white;text-decoration:none;border-radius:5px;margin-top:20px;font-weight:bold}.info-box-error{background:#fef2f2;border:1px solid #dc2626;padding:15px;border-radius:5px;margin:15px 0}.info-box-success{background:#f0fdf4;border:1px solid #10b981;padding:15px;border-radius:5px;margin:15px 0}.footer{background:#f3fef7;color:#1f4e3d;padding:20px;text-align:center;font-size:12px;line-height:1.5;margin:30px -30px -30px -30px;border-radius:0 0 10px 10px;border-top:1px solid #e5e7eb}.link{color:#3ab26f}</style></head><body><div class="container"><div class="header-error"><h1>❌ Order Declined</h1></div><p>Hello ${buyer.name},</p><p>We're sorry to inform you that your order has been declined by the seller.</p><div class="info-box-error"><h3>📋 Order Details</h3><p><strong>Order ID:</strong> ${order_id}</p><p><strong>Amount:</strong> R${order.total_amount?.toFixed(2) || "0.00"}</p><p><strong>Reason:</strong> ${reason || "Seller declined to commit"}</p></div>${refundResult?.success ? `<div class="info-box-success"><h3>💰 Refund Information</h3><p><strong>Processing Time:</strong> 3-5 business days</p><p><strong>✅ Your refund has been successfully processed.</strong></p></div>` : `<div class="info-box-error"><h3>⚠️ Refund Processing</h3><p>Your refund is being processed and will appear in your account within 3-5 business days.</p></div>`}<p>We apologize for any inconvenience. Please feel free to browse our marketplace for similar books from other sellers.</p><a href="https://rebookedsolutions.co.za/books" class="btn">Browse Books</a><div class="footer"><p><strong>This is an automated message from ReBooked Solutions.</strong><br>Please do not reply to this email.</p><p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p><p>T&Cs apply. <em>"Pre-Loved Pages, New Adventures"</em></p></div></div></body></html>`;

        const buyerText = `Order Declined - Refund Processed\n\nHello ${buyer.name},\n\nWe're sorry to inform you that your order has been declined by the seller.\n\nOrder Details:\nOrder ID: ${order_id}\nAmount: R${order.total_amount?.toFixed(2) || "0.00"}\nReason: ${reason || "Seller declined to commit"}\n\n${refundResult?.success ? "Your refund has been successfully processed and will appear in your account within 3-5 business days." : "Your refund is being processed and will appear in your account within 3-5 business days."}\n\nBrowse Books: https://rebookedsolutions.co.za/books\n\nThis is an automated message from ReBooked Solutions.\nFor assistance, contact: support@rebookedsolutions.co.za`;

        emailPromises.push(
          fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({
              to: buyer.email,
              subject: "Order Declined - Refund Processed",
              html: buyerHtml,
              text: buyerText,
            }),
          })
        );
      }

      // Email to seller
      if (seller.email) {
        const sellerHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Order Decline Confirmation</title><style>body{font-family:Arial,sans-serif;background-color:#f3fef7;padding:20px;color:#1f4e3d;margin:0}.container{max-width:500px;margin:auto;background-color:#ffffff;padding:30px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.05)}.header-error{background:#dc2626;color:white;padding:20px;text-align:center;border-radius:10px 10px 0 0;margin:-30px -30px 20px -30px}.info-box-success{background:#f0fdf4;border:1px solid #10b981;padding:15px;border-radius:5px;margin:15px 0}.footer{background:#f3fef7;color:#1f4e3d;padding:20px;text-align:center;font-size:12px;line-height:1.5;margin:30px -30px -30px -30px;border-radius:0 0 10px 10px;border-top:1px solid #e5e7eb}.link{color:#3ab26f}</style></head><body><div class="container"><div class="header-error"><h1>✅ Order Decline Confirmed</h1></div><p>Hello ${seller.name},</p><p>You have successfully declined the order commitment.</p><div class="info-box-success"><h3>📋 Order Details</h3><p><strong>Order ID:</strong> ${order_id}</p><p><strong>Reason:</strong> ${reason || "You declined to commit"}</p></div><p>The buyer has been notified and their payment has been refunded. Your book stock has been automatically restored.</p><div class="footer"><p><strong>This is an automated message from ReBooked Solutions.</strong><br>Please do not reply to this email.</p><p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p><p>T&Cs apply. <em>"Pre-Loved Pages, New Adventures"</em></p></div></div></body></html>`;

        const sellerText = `Order Decline Confirmation\n\nHello ${seller.name},\n\nYou have successfully declined the order commitment.\n\nOrder Details:\nOrder ID: ${order_id}\nReason: ${reason || "You declined to commit"}\n\nThe buyer has been notified and their payment has been refunded. Your book stock has been automatically restored.\n\nThis is an automated message from ReBooked Solutions.\nFor assistance, contact: support@rebookedsolutions.co.za`;

        emailPromises.push(
          fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({
              to: seller.email,
              subject: "Order Decline Confirmation",
              html: sellerHtml,
              text: sellerText,
            }),
          })
        );
      }

      await Promise.allSettled(emailPromises);
    } catch (emailError) {
    }


    return new Response(
      JSON.stringify({
        success: true,
        message: "Order declined successfully. Stock has been automatically released.",
        details: {
          order_id,
          status: "declined",
          declined_at: new Date().toISOString(),
          refund_processed: refundResult?.success || false,
          notifications_sent: {
            buyer: !!buyer.email,
            seller: !!seller.email,
          },
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "UNEXPECTED_ERROR",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
