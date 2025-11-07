import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BobPayWebhook {
  id: number;
  uuid: string;
  short_reference: string;
  custom_payment_id: string;
  amount: number;
  paid_amount: number;
  total_paid_amount: number;
  status: string;
  payment_method: string;
  original_requested_payment_method: string;
  payment_id: number;
  payment: {
    id: number;
    payment_method_id: number;
    payment_method: string;
    amount: number;
    status: string;
  };
  item_name: string;
  item_description: string;
  recipient_account_code: string;
  recipient_account_id: number;
  email: string;
  mobile_number: string;
  from_bank: string;
  time_created: string;
  is_test: boolean;
  signature: string;
  notify_url: string;
  success_url: string;
  pending_url: string;
  cancel_url: string;
}

async function verifySignature(
  webhookData: BobPayWebhook,
  passphrase: string
): Promise<boolean> {
  try {
    const keyValuePairs = [
      `recipient_account_code=${encodeURIComponent(webhookData.recipient_account_code)}`,
      `custom_payment_id=${encodeURIComponent(webhookData.custom_payment_id)}`,
      `email=${encodeURIComponent(webhookData.email || '')}`,
      `mobile_number=${encodeURIComponent(webhookData.mobile_number || '')}`,
      `amount=${webhookData.amount.toFixed(2)}`,
      `item_name=${encodeURIComponent(webhookData.item_name || '')}`,
      `item_description=${encodeURIComponent(webhookData.item_description || '')}`,
      `notify_url=${encodeURIComponent(webhookData.notify_url)}`,
      `success_url=${encodeURIComponent(webhookData.success_url)}`,
      `pending_url=${encodeURIComponent(webhookData.pending_url)}`,
      `cancel_url=${encodeURIComponent(webhookData.cancel_url)}`,
    ];

    const signatureString = keyValuePairs.join('&') + `&passphrase=${passphrase}`;

    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Signature verification:', {
      received: webhookData.signature,
      calculated: calculatedSignature,
      match: calculatedSignature === webhookData.signature,
    });

    return calculatedSignature === webhookData.signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get client IP for verification
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    console.log('Webhook received from IP:', clientIp);

    // Verify IP address (BobPay IPs: sandbox=13.246.115.225, production=13.246.100.25)
    const allowedIPs = ['13.246.115.225', '13.246.100.25'];
    // In development/testing, we might allow other IPs
    const isProduction = Deno.env.get('BOBPAY_ENV') === 'production';

    if (isProduction && !allowedIPs.includes(clientIp)) {
      console.warn('Webhook from unauthorized IP:', clientIp);
      // Still process but log the warning
    }

    const webhookData: BobPayWebhook = await req.json();
    console.log('BobPay webhook received:', {
      custom_payment_id: webhookData.custom_payment_id,
      status: webhookData.status,
      amount: webhookData.paid_amount,
    });

    // Verify signature
    const passphrase = Deno.env.get('BOBPAY_PASSPHRASE');
    if (!passphrase) {
      throw new Error('BobPay passphrase not configured');
    }

    const isValidSignature = await verifySignature(webhookData, passphrase);
    if (!isValidSignature) {
      console.error('Invalid signature for webhook');
      return new Response('Invalid signature', { status: 400 });
    }

    // Validate with BobPay API
    const bobpayApiUrl = Deno.env.get('BOBPAY_API_URL');
    const bobpayApiToken = Deno.env.get('BOBPAY_API_TOKEN');

    if (bobpayApiUrl && bobpayApiToken) {
      const validationResponse = await fetch(
        `${bobpayApiUrl}/payments/intents/validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bobpayApiToken}`,
          },
          body: JSON.stringify(webhookData),
        }
      );

      if (!validationResponse.ok) {
        console.error('BobPay validation failed');
        return new Response('Payment validation failed', { status: 400 });
      }
    }

    // Find the order by payment_reference (which should be our custom_payment_id)
    const { data: orders, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('payment_reference', webhookData.custom_payment_id)
      .maybeSingle();

    if (orderError) {
      console.error('Order not found:', orderError);
      return new Response('Order not found', { status: 404 });
    }

    if (!orders) {
      console.error('No order found for payment_reference:', webhookData.custom_payment_id);
      return new Response('Order not found', { status: 404 });
    }

    // Update payment transaction
    const { error: txUpdateError } = await supabaseClient
      .from('payment_transactions')
      .update({
        status: webhookData.status === 'paid' ? 'success' : webhookData.status,
        verified_at: new Date().toISOString(),
        paystack_response: {
          ...webhookData,
          provider: 'bobpay',
        },
      })
      .eq('reference', webhookData.custom_payment_id);

    if (txUpdateError) {
      console.error('Error updating transaction:', txUpdateError);
    }

    // Update order based on payment status
    if (webhookData.status === 'paid') {
      const { error: orderUpdateError } = await supabaseClient
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'pending_commit',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orders.id);

      if (orderUpdateError) {
        console.error('Error updating order:', orderUpdateError);
      }

      // Mark book as sold
      const bookId = orders.book_id || (orders.items?.[0]?.book_id);
      if (bookId) {
        // Get current book data
        const { data: bookData } = await supabaseClient
          .from('books')
          .select('id, title, available_quantity, sold_quantity')
          .eq('id', bookId)
          .single();

        const { error: bookUpdateError } = await supabaseClient
          .from('books')
          .update({
            sold: true,
            availability: 'sold',
            sold_at: new Date().toISOString(),
            sold_quantity: (bookData?.sold_quantity || 0) + 1,
            available_quantity: Math.max(0, (bookData?.available_quantity || 0) - 1),
          })
          .eq('id', bookId);

        if (bookUpdateError) {
          console.error('Error marking book as sold:', bookUpdateError);
        } else {
          console.log('✅ Book marked as sold:', bookId);
        }
      }

      // Log activity for buyer's purchase
      const bookTitle = orders.items?.[0]?.book_title || 'Book';
      await supabaseClient
        .from('activity_logs')
        .insert({
          user_id: orders.buyer_id,
          type: 'purchase',
          title: `Book Purchase - ${bookTitle}`,
          description: `Successfully purchased "${bookTitle}" for R${webhookData.paid_amount.toFixed(2)}`,
          metadata: {
            order_id: orders.id,
            book_id: bookId,
            amount: webhookData.paid_amount,
            seller_id: orders.seller_id,
            payment_reference: webhookData.custom_payment_id,
          },
        })
        .then(() => console.log('✅ Purchase activity logged for buyer'))
        .catch(err => console.error('Failed to log purchase activity:', err));

      // Log activity for seller's sale
      await supabaseClient
        .from('activity_logs')
        .insert({
          user_id: orders.seller_id,
          type: 'sale',
          title: `New Sale - ${bookTitle}`,
          description: `Your book "${bookTitle}" has been purchased. Awaiting your confirmation.`,
          metadata: {
            order_id: orders.id,
            book_id: bookId,
            amount: webhookData.paid_amount,
            buyer_id: orders.buyer_id,
            payment_reference: webhookData.custom_payment_id,
          },
        })
        .then(() => console.log('✅ Sale activity logged for seller'))
        .catch(err => console.error('Failed to log sale activity:', err));

      // Get buyer and seller info for email notifications
      const { data: buyerProfile } = await supabaseClient
        .from('profiles')
        .select('email, full_name, name')
        .eq('id', orders.buyer_id)
        .single();

      const { data: sellerProfile } = await supabaseClient
        .from('profiles')
        .select('email, full_name, name')
        .eq('id', orders.seller_id)
        .single();

      // Create notification for buyer
      await supabaseClient.from('order_notifications').insert({
        order_id: orders.id,
        user_id: orders.buyer_id,
        type: 'payment_success',
        title: 'Payment Successful',
        message: `Your payment of R${webhookData.paid_amount.toFixed(2)} has been confirmed. Waiting for seller confirmation.`,
      });

      // Create notification for seller
      await supabaseClient.from('order_notifications').insert({
        order_id: orders.id,
        user_id: orders.seller_id,
        type: 'order_paid',
        title: 'New Order Received',
        message: `You have received a new order. Please commit within 48 hours.`,
      });

      // Queue emails for buyer and seller
      const buyerEmail = buyerProfile?.email || orders.buyer_email;
      const buyerName = buyerProfile?.full_name || buyerProfile?.name || 'Buyer';
      const sellerEmail = sellerProfile?.email;
      const sellerName = sellerProfile?.full_name || sellerProfile?.name || 'Seller';

      if (buyerEmail) {
        await supabaseClient.from('mail_queue').insert({
          to_email: buyerEmail,
          subject: '📚 Payment Confirmed - Waiting for Seller Response',
          html_content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #00b894; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">📚 Payment Confirmed!</h1>
              </div>
              <div style="padding: 30px; background-color: #f8f9fa;">
                <p>Hello ${buyerName},</p>
                <p><strong>Thank you for your purchase!</strong> Your payment has been processed successfully.</p>

                <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #00b894; margin-top: 0;">Order Summary</h3>
                  <p><strong>Book:</strong> ${bookTitle}</p>
                  <p><strong>Seller:</strong> ${sellerName}</p>
                  <p><strong>Order ID:</strong> ${orders.id}</p>
                  <p><strong>Amount Paid:</strong> R${webhookData.paid_amount.toFixed(2)}</p>
                </div>

                <div style="background-color: #e8f4fd; border: 1px solid #74b9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #0984e3; margin-top: 0;">⏳ Waiting for Seller Confirmation</h3>
                  <p>The seller has 48 hours to confirm your order. Once confirmed, your book will be shipped immediately.</p>
                </div>

                <p><strong>What happens next:</strong></p>
                <ul>
                  <li>The seller will confirm your order within 48 hours</li>
                  <li>Once confirmed, your book will be shipped immediately</li>
                  <li>You'll receive tracking information via SMS/email</li>
                  <li>Delivery typically takes 1-3 business days</li>
                </ul>

                <p><strong>If the seller doesn't confirm:</strong> You'll receive a full automatic refund within 48 hours.</p>

                <p>Thank you for choosing ReBooked Solutions!</p>
              </div>
              <div style="background-color: #f3fef7; color: #1f4e3d; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #e5e7eb;">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>For assistance: <a href="mailto:support@rebookedsolutions.co.za">support@rebookedsolutions.co.za</a></p>
              </div>
            </div>
          `,
          priority: 'high',
          email_type: 'buyer_payment_confirmed',
        });
      }

      if (sellerEmail) {
        await supabaseClient.from('mail_queue').insert({
          to_email: sellerEmail,
          subject: '🚨 NEW SALE - Confirm Your Book Sale (48hr deadline)',
          html_content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #e74c3c; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">🚨 New Book Sale - Action Required!</h1>
              </div>
              <div style="padding: 30px; background-color: #f8f9fa;">
                <p>Hello ${sellerName},</p>
                <p><strong>Great news!</strong> Someone just purchased your book and is waiting for confirmation.</p>

                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #e17055; margin-top: 0;">⏰ ACTION REQUIRED WITHIN 48 HOURS</h3>
                  <p><strong>You must confirm this sale to proceed with the order.</strong></p>
                </div>

                <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #2d3436; margin-top: 0;">Sale Details</h3>
                  <p><strong>Book:</strong> ${bookTitle}</p>
                  <p><strong>Buyer:</strong> ${buyerName}</p>
                  <p><strong>Order ID:</strong> ${orders.id}</p>
                </div>

                <p><strong>What happens next:</strong></p>
                <ul>
                  <li>Log in to your ReBooked Solutions account</li>
                  <li>Click "Commit Sale" for this book</li>
                  <li>We'll arrange pickup from your location</li>
                  <li>You'll receive payment after delivery</li>
                </ul>

                <p style="color: #e17055;"><strong>Important:</strong> If you don't confirm within 48 hours, the order will be automatically cancelled and refunded.</p>

                <p>Thank you for using ReBooked Solutions!</p>
              </div>
              <div style="background-color: #f3fef7; color: #1f4e3d; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #e5e7eb;">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>For assistance: <a href="mailto:support@rebookedsolutions.co.za">support@rebookedsolutions.co.za</a></p>
              </div>
            </div>
          `,
          priority: 'urgent',
          email_type: 'seller_pending_commit',
        });
      }
    } else if (webhookData.status === 'failed' || webhookData.status === 'cancelled') {
      await supabaseClient
        .from('orders')
        .update({
          payment_status: 'failed',
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orders.id);

      // Notify buyer of failed payment
      await supabaseClient.from('order_notifications').insert({
        order_id: orders.id,
        user_id: orders.buyer_id,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: `Your payment could not be processed. Status: ${webhookData.status}`,
      });
    }

    console.log('Webhook processed successfully');
    return new Response('OK', { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Return 200 to prevent retries for processing errors
    return new Response('Received', { status: 200, headers: corsHeaders });
  }
});
