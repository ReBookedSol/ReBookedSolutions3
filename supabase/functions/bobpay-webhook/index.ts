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
          status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orders.id);

      if (orderUpdateError) {
        console.error('Error updating order:', orderUpdateError);
      }

      // Create notification for buyer
      await supabaseClient.from('order_notifications').insert({
        order_id: orders.id,
        user_id: orders.buyer_id,
        type: 'payment_success',
        title: 'Payment Successful',
        message: `Your payment of R${webhookData.paid_amount.toFixed(2)} has been confirmed.`,
      });

      // Create notification for seller
      await supabaseClient.from('order_notifications').insert({
        order_id: orders.id,
        user_id: orders.seller_id,
        type: 'order_paid',
        title: 'New Order Received',
        message: `You have received a new order. Please commit within 48 hours.`,
      });
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
