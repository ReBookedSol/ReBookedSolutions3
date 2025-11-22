import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertCircle, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WalletService } from "@/services/walletService";

interface OrderCompletionCardProps {
  orderId: string;
  bookTitle: string;
  sellerName: string;
  deliveredDate?: string;
  onFeedbackSubmitted?: (feedback: any) => void;
  totalAmount?: number;
  sellerId?: string;
}

const OrderCompletionCard: React.FC<OrderCompletionCardProps> = ({
  orderId,
  bookTitle,
  sellerName,
  deliveredDate,
  onFeedbackSubmitted,
  totalAmount = 0,
  sellerId = "",
}) => {
  const [receivedStatus, setReceivedStatus] = useState<"received" | "not_received" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submittedFeedback, setSubmittedFeedback] = useState<{
    buyer_status: string;
    buyer_feedback: string;
  } | null>(null);

  // Check on mount if feedback already exists for this order
  useEffect(() => {
    const checkExistingFeedback = async () => {
      try {
        const { data: existingFeedback, error } = await supabase
          .from("buyer_feedback_orders")
          .select("buyer_status, buyer_feedback")
          .eq("order_id", orderId)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 means no rows found, which is expected
          console.error("Error checking existing feedback:", error);
          setIsLoading(false);
          return;
        }

        if (existingFeedback) {
          // Feedback already exists - lock the form
          setSubmittedFeedback({
            buyer_status: existingFeedback.buyer_status,
            buyer_feedback: existingFeedback.buyer_feedback,
          });
          setIsSubmitted(true);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error checking existing feedback:", err);
        setIsLoading(false);
      }
    };

    checkExistingFeedback();
  }, [orderId]);

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

      // Credit seller wallet if order is marked as received
      if (receivedStatus === "received" && sellerId && totalAmount) {
        try {
          const walletResult = await WalletService.creditWalletOnCollection(
            orderId,
            sellerId,
            totalAmount
          );

          if (walletResult.success) {
            console.log("✅ Seller wallet credited successfully");
          } else {
            console.warn("Failed to credit seller wallet:", walletResult.error);
          }
        } catch (walletErr) {
          console.warn("Error crediting wallet:", walletErr);
        }
      }

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

      // Send transactional emails based on buyer response
      (async () => {
        try {
          const { emailService } = await import("@/services/emailService");
          const { createWalletCreditNotificationEmail } = await import(
            "@/utils/emailTemplates/walletCreditNotificationTemplate"
          );

          // Resolve buyer and seller emails if not present on order
          let buyerEmail: string | null = order.buyer_email || null;
          let sellerEmail: string | null = (order as any).seller_email || null;
          let sellerFullName = sellerName || "Seller";
          let buyerFullName = (order as any).buyer_name || "Buyer";

          if (!buyerEmail && order.buyer_id) {
            try {
              const { data: buyerData } = await supabase
                .from("users")
                .select("email, full_name")
                .eq("id", order.buyer_id)
                .single();
              buyerEmail = buyerData?.email || buyerEmail;
              buyerFullName = buyerData?.full_name || buyerFullName;
            } catch (e) {
              console.warn("Failed to fetch buyer email:", e);
            }
          }

          if (!sellerEmail && order.seller_id) {
            try {
              const { data: sellerData } = await supabase
                .from("users")
                .select("email, full_name")
                .eq("id", order.seller_id)
                .single();
              sellerEmail = sellerData?.email || sellerEmail;
              sellerFullName = sellerData?.full_name || sellerFullName;
            } catch (e) {
              console.warn("Failed to fetch seller email:", e);
            }
          }

          if (receivedStatus === "received") {
            // Buyer: Thank you and next steps
            if (buyerEmail) {
              const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Thank you — Order Received</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3fef7;
      padding: 20px;
      color: #1f4e3d;
    }
    .container {
      max-width: 500px;
      margin: auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #3ab26f;
      padding: 25px;
      text-align: center;
      border-radius: 10px 10px 0 0;
      color: white;
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
    .footer-text {
      font-size: 13px;
      color: #4e7a63;
      margin-top: 20px;
    }
    .social-links a {
      color: #3ab26f;
      text-decoration: none;
      display: inline-block;
      margin-right: 10px;
      font-size: 14px;
    }
    .slogan {
      font-size: 14px;
      font-style: italic;
      color: #1f4e3d;
      margin-top: 25px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;font-size:22px;">Thank you — Order Received</h1>
    </div>
    <div style="padding:20px;">
      <p>Hello \${buyerFullName},</p>
      <p>
        Thanks for shopping with us! We hope you enjoy <strong>\${bookTitle}</strong>.
      </p>
      <p>
        When you're done with it, you can list it on ReBooked Solutions and make your money back.
        Buy smart, sell smart — keep the cycle going. ♻️
      </p>
      <a href="https://rebookedsolutions.co.za/orders/\${orderId}" class="btn">
        View Your Order
      </a>
      <p class="footer-text">
        Follow us & stay updated:
      </p>
      <div class="social-links">
        <a href="https://www.instagram.com/rebooked.solutions?igsh=M2ZsNjd2aTNmZmRh">Instagram</a>
        <a href="https://www.facebook.com/people/Rebooked-Solutions/61577195802238/?mibextid=wwXIfr&rdid=zzSy70C45G7ABaBF&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F16ngKMps6U%2F%3Fmibextid%3DwwXIfr">Facebook</a>
        <a href="https://www.tiktok.com/@rebooked.solution">TikTok</a>
        <a href="https://x.com/RebookedSol">X (Twitter)</a>
      </div>
      <p class="footer-text">
        If you need any assistance, feel free to email us at
        <a href="mailto:support@rebookedsolutions.co.za" style="color:#3ab26f;">support@rebookedsolutions.co.za</a>.
      </p>
      <p class="footer-text">
        Share ReBooked with your friends & family so they can save too.
        Together we make textbooks affordable.
      </p>
      <p class="slogan">"Pre-Loved Pages, New Adventure"</p>
      <p class="footer-text">— ReBooked Solutions</p>
    </div>
  </div>
</body>
</html>`;
              const text = `Thank you — Order Received\n\nHello ${buyerFullName},\n\nThanks for confirming receipt of ${bookTitle}. We will release payment to the seller shortly.\n\nView order: https://rebookedsolutions.co.za/orders/${orderId}\n\n— ReBooked Solutions`;

              try {
                await emailService.sendEmail({ to: buyerEmail, subject: "Thank you — Order Received", html, text });
              } catch (emailErr) {
                console.warn("Failed to send buyer received email:", emailErr);
              }
            }

            // Seller: Check if they have banking details and send appropriate email
            if (sellerEmail && order.seller_id) {
              try {
                // Check if seller has banking details set up
                const { data: sellerProfile, error: profileError } = await supabase
                  .from("profiles")
                  .select("preferences")
                  .eq("id", order.seller_id)
                  .single();

                const hasBankingDetails = !profileError &&
                  sellerProfile?.preferences?.banking_setup_complete === true;

                if (hasBankingDetails) {
                  // Seller has banking details - send "Payment on the way" email
                  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment on the Way</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3fef7;
      padding: 20px;
      color: #1f4e3d;
    }
    .container {
      max-width: 500px;
      margin: auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #3ab26f;
      padding: 25px;
      text-align: center;
      border-radius: 10px 10px 0 0;
      color: white;
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
    .footer-text {
      font-size: 13px;
      color: #4e7a63;
      margin-top: 20px;
    }
    .social-links a {
      color: #3ab26f;
      text-decoration: none;
      display: inline-block;
      margin-right: 10px;
      font-size: 14px;
    }
    .slogan {
      font-size: 14px;
      font-style: italic;
      color: #1f4e3d;
      margin-top: 25px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;font-size:22px;">Payment on the Way</h1>
    </div>
    <div style="padding:20px;">
      <p>Hello \${sellerFullName},</p>
      <p>
        The buyer has confirmed delivery of <strong>\${bookTitle}</strong>
        (Order ID: \${orderId.slice(-8)}). Your payment is now being processed.
      </p>
      <a href="https://rebookedsolutions.co.za/seller/orders/\${orderId}" class="btn">
        View Order
      </a>
      <p class="footer-text">
        Keep sharing your <strong>ReBooked Mini</strong> — the more you share, the more chances to earn and receive updates like this!
      </p>
      <p class="footer-text">
        Follow us for updates and tips:
      </p>
      <div class="social-links">
        <a href="https://www.instagram.com/rebooked.solutions?igsh=M2ZsNjd2aTNmZmRh">Instagram</a>
        <a href="https://www.facebook.com/people/Rebooked-Solutions/61577195802238/?mibextid=wwXIfr&rdid=zzSy70C45G7ABaBF&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F16ngKMps6U%2F%3Fmibextid%3DwwXIfr">Facebook</a>
        <a href="https://www.tiktok.com/@rebooked.solution">TikTok</a>
        <a href="https://x.com/RebookedSol">X (Twitter)</a>
      </div>
      <p class="footer-text">
        If you need any help, email us at
        <a href="mailto:support@rebookedsolutions.co.za" style="color:#3ab26f;">support@rebookedsolutions.co.za</a>.
      </p>
      <p class="slogan">"Pre-Loved Pages, New Adventure"</p>
      <p class="footer-text">— ReBooked Solutions</p>
    </div>
  </div>
</body>
</html>`;
                  const text = `Payment on the way\n\nHello ${sellerFullName},\n\nThe buyer has confirmed delivery of ${bookTitle} (Order ID: ${orderId.slice(-8)}). We will process your payment and notify you once released.\n\nView order: https://rebookedsolutions.co.za/seller/orders/${orderId}`;

                  await emailService.sendEmail({
                    to: sellerEmail,
                    subject: "Payment on the way — ReBooked Solutions",
                    html,
                    text,
                  });
                } else {
                  // Seller does NOT have banking details - send wallet credit notification email
                  const creditAmount = totalAmount * 0.9; // 90% of total amount
                  const walletTemplate = createWalletCreditNotificationEmail({
                    sellerName: sellerFullName,
                    bookTitle,
                    bookPrice: totalAmount,
                    creditAmount,
                    orderId,
                    newBalance: creditAmount, // Note: This is simplified, in production you'd fetch actual balance
                  });

                  await emailService.sendEmail({
                    to: sellerEmail,
                    subject: walletTemplate.subject,
                    html: walletTemplate.html,
                    text: walletTemplate.text,
                  });
                }
              } catch (bankingCheckErr) {
                console.warn("Error checking banking details:", bankingCheckErr);
                // If there's an error checking banking details, default to wallet credit email
                try {
                  const creditAmount = totalAmount * 0.9;
                  const walletTemplate = createWalletCreditNotificationEmail({
                    sellerName: sellerFullName,
                    bookTitle,
                    bookPrice: totalAmount,
                    creditAmount,
                    orderId,
                    newBalance: creditAmount,
                  });

                  await emailService.sendEmail({
                    to: sellerEmail,
                    subject: walletTemplate.subject,
                    html: walletTemplate.html,
                    text: walletTemplate.text,
                  });
                } catch (emailErr) {
                  console.warn("Failed to send wallet credit email:", emailErr);
                }
              }
            }
          } else if (receivedStatus === "not_received") {
            // Buyer: Acknowledge report
            if (buyerEmail) {
              const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>We've Received Your Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3fef7;
      padding: 20px;
      color: #1f4e3d;
    }
    .container {
      max-width: 500px;
      margin: auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #3ab26f;
      padding: 25px;
      text-align: center;
      border-radius: 10px 10px 0 0;
      color: white;
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
    .footer-text {
      font-size: 13px;
      color: #4e7a63;
      margin-top: 20px;
    }
    .social-links a {
      color: #3ab26f;
      text-decoration: none;
      display: inline-block;
      margin-right: 10px;
      font-size: 14px;
    }
    .slogan {
      font-size: 14px;
      font-style: italic;
      color: #1f4e3d;
      margin-top: 25px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;font-size:22px;">We've Received Your Report</h1>
    </div>
    <div style="padding:20px;">
      <p>Hello \${buyerFullName},</p>
      <p>
        Thank you for reporting an issue with your order <strong>\${orderId.slice(-8)}</strong>.
        Our support team will contact you shortly to investigate: "<em>\${feedback.trim()}</em>"
      </p>
      <a href="https://rebookedsolutions.co.za/orders/\${orderId}" class="btn">
        View Order
      </a>
      <p class="footer-text">
        Follow us for updates:
      </p>
      <div class="social-links">
        <a href="https://www.instagram.com/rebooked.solutions?igsh=M2ZsNjd2aTNmZmRh">Instagram</a>
        <a href="https://www.facebook.com/people/Rebooked-Solutions/61577195802238/?mibextid=wwXIfr&rdid=zzSy70C45G7ABaBF&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F16ngKMps6U%2F%3Fmibextid%3DwwXIfr">Facebook</a>
        <a href="https://www.tiktok.com/@rebooked.solution">TikTok</a>
        <a href="https://x.com/RebookedSol">X (Twitter)</a>
      </div>
      <p class="footer-text">
        If you need any further assistance, email us at
        <a href="mailto:support@rebookedsolutions.co.za" style="color:#3ab26f;">support@rebookedsolutions.co.za</a>.
      </p>
      <p class="slogan">"Pre-Loved Pages, New Adventure"</p>
      <p class="footer-text">— ReBooked Solutions</p>
    </div>
  </div>
</body>
</html>`;
              const text = `We've received your report\n\nHello ${buyerFullName},\n\nThank you for reporting an issue with your order ${orderId.slice(-8)}. Our support team will contact you shortly to investigate: "${feedback.trim()}"\n\nView order: https://rebookedsolutions.co.za/orders/${orderId}`;

              try {
                await emailService.sendEmail({ to: buyerEmail, subject: "We've received your report — ReBooked Solutions", html, text });
              } catch (emailErr) {
                console.warn("Failed to send buyer issue email:", emailErr);
              }
            }

            // Seller: Notify issue finalising order
            if (sellerEmail) {
              const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Issue Finalising Order</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3fef7;
      padding: 20px;
      color: #1f4e3d;
    }
    .container {
      max-width: 500px;
      margin: auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #3ab26f;
      padding: 25px;
      text-align: center;
      border-radius: 10px 10px 0 0;
      color: white;
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
    .footer-text {
      font-size: 13px;
      color: #4e7a63;
      margin-top: 20px;
    }
    .social-links a {
      color: #3ab26f;
      text-decoration: none;
      display: inline-block;
      margin-right: 10px;
      font-size: 14px;
    }
    .slogan {
      font-size: 14px;
      font-style: italic;
      color: #1f4e3d;
      margin-top: 25px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;font-size:22px;">Issue Finalising Order</h1>
    </div>
    <div style="padding:20px;">
      <p>Hello \${sellerFullName},</p>
      <p>
        We encountered an issue while finalising Order ID: <strong>\${orderId.slice(-8)}</strong> for <strong>\${bookTitle}</strong>.
        Our team is investigating and may contact you for more information.
      </p>
      <a href="https://rebookedsolutions.co.za/seller/orders/\${orderId}" class="btn">
        View Order
      </a>
      <p class="footer-text">
        Follow us for updates:
      </p>
      <div class="social-links">
        <a href="https://www.instagram.com/rebooked.solutions?igsh=M2ZsNjd2aTNmZmRh">Instagram</a>
        <a href="https://www.facebook.com/people/Rebooked-Solutions/61577195802238/?mibextid=wwXIfr&rdid=zzSy70C45G7ABaBF&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F16ngKMps6U%2F%3Fmibextid%3DwwXIfr">Facebook</a>
        <a href="https://www.tiktok.com/@rebooked.solution">TikTok</a>
        <a href="https://x.com/RebookedSol">X (Twitter)</a>
      </div>
      <p class="footer-text">
        If you need any help, email us at
        <a href="mailto:support@rebookedsolutions.co.za" style="color:#3ab26f;">support@rebookedsolutions.co.za</a>.
      </p>
      <p class="slogan">"Pre-Loved Pages, New Adventure"</p>
      <p class="footer-text">— ReBooked Solutions</p>
    </div>
  </div>
</body>
</html>`;
              const text = `Issue finalising order\n\nHello ${sellerFullName},\n\nWe encountered an issue while finalising Order ID: ${orderId.slice(-8)} for ${bookTitle}. Our team is investigating and may contact you for more information.\n\nView order: https://rebookedsolutions.co.za/seller/orders/${orderId}`;

              try {
                await emailService.sendEmail({ to: sellerEmail, subject: "Issue finalising order — ReBooked Solutions", html, text });
              } catch (emailErr) {
                console.warn("Failed to send seller issue email:", emailErr);
              }
            }
          }
        } catch (e) {
          console.warn("Error sending transactional emails:", e);
        }
      })();

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

  if (isLoading) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-6 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
          <span className="text-gray-600">Loading order status...</span>
        </CardContent>
      </Card>
    );
  }

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
          <Alert className="border-blue-200 bg-white">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-700">
              Your feedback has been locked and cannot be changed. Thank you for your response!
            </AlertDescription>
          </Alert>
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
