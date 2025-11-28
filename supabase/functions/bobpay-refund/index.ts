import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  let refundData = null;

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization') || '';

    // Get user but don't fail if auth fails - allow admins to process any refund
    let user = null;
    try {
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      user = authUser;
    } catch (authError) {
      // Auth failed - will proceed as admin operation
    }

    const body = await req.json().catch(() => null);

    if (!body || !body.order_id) {
      throw new Error('Invalid payload: order_id is required');
    }

    refundData = {
      order_id: body.order_id,
      payment_id: body.payment_id,
      reason: body.reason,
    };

    const orderId = refundData.order_id;
    const reason = refundData.reason;

    // Get order details with payment transactions
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Get payment transactions for this order and retrieve custom_payment_id
    const { data: payments, error: paymentsError } = await supabaseClient
      .from('payment_transactions')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    // Get custom_payment_id from payment transaction - try multiple sources
    let customPaymentId = null;
    let paymentTransaction = null;

    if (payments && payments.length > 0) {
      // Find the latest payment transaction with custom_payment_id
      for (const tx of payments) {
        // First try the new custom_payment_id column
        if (tx.custom_payment_id) {
          customPaymentId = tx.custom_payment_id;
          paymentTransaction = tx;
          break;
        }

        // Fallback: try to extract from bobpay_response
        const bobpayResponse = tx.bobpay_response;
        if (bobpayResponse?.custom_payment_id) {
          customPaymentId = bobpayResponse.custom_payment_id;
          paymentTransaction = tx;
          break;
        }

        // Fallback: use reference field as custom_payment_id
        if (tx.reference && tx.reference.startsWith('ORDER-')) {
          customPaymentId = tx.reference;
          paymentTransaction = tx;
          break;
        }
      }
    }

    // If still not found, try order payment_reference
    if (!customPaymentId && order.payment_reference) {
      customPaymentId = order.payment_reference;
    }

    if (!customPaymentId) {
      throw new Error('No custom_payment_id found for this order. Cannot process refund.');
    }

    // Calculate refund amount - payment_transactions stores in cents (bigint)
    let refundAmountInCents = 0;
    let refundAmountInZAR = 0;

    if (paymentTransaction) {
      refundAmountInCents = paymentTransaction.amount;
      refundAmountInZAR = refundAmountInCents / 100;
    } else if (order.total_amount) {
      refundAmountInZAR = parseFloat(order.total_amount);
      refundAmountInCents = Math.round(refundAmountInZAR * 100);
    } else if (order.amount) {
      // order.amount is integer, might be in cents
      refundAmountInCents = order.amount;
      refundAmountInZAR = refundAmountInCents / 100;
    }

    // Get BobPay credentials
    const bobpayApiUrl = Deno.env.get('BOBPAY_API_URL');
    const bobpayApiToken = Deno.env.get('BOBPAY_API_TOKEN');
    const apiBase = (bobpayApiUrl || '').replace(/\/v2\/?$/, '');

    let refundResult = null;

    // Process refund with BobPay API using custom_payment_id
    if (bobpayApiUrl && bobpayApiToken) {
      try {
        const refundResponse = await fetch(`${apiBase}/v2/payments/reversal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bobpayApiToken}`,
          },
          body: JSON.stringify({
            custom_payment_id: customPaymentId,
          }),
        });

        if (refundResponse.ok) {
          refundResult = await refundResponse.json();
        } else {
          const errorText = await refundResponse.text();
          throw new Error(`BobPay API error: ${errorText}`);
        }
      } catch (apiError) {
        throw apiError;
      }
    } else {
      throw new Error('BobPay credentials not configured');
    }

    // Create refund transaction record using correct BobPay columns
    const { data: refundTransaction, error: refundTxError } = await supabaseClient
      .from('refund_transactions')
      .insert({
        order_id: orderId,
        initiated_by: user?.id || null,
        amount: refundAmountInZAR,
        reason: reason || 'Refund processed via BobPay',
        status: 'success',
        transaction_reference: paymentTransaction?.reference || `tx-${Date.now()}`,
        bobpay_refund_reference:
          refundResult?.payment_method?.merchant_reference || refundResult?.id || `refund-${Date.now()}`,
        bobpay_response: {
          ...refundResult,
          provider: 'bobpay',
          custom_payment_id: customPaymentId,
          original_amount_cents: refundAmountInCents,
          refund_amount_zar: refundAmountInZAR,
        },
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (refundTxError) {
      throw new Error(`Failed to create refund transaction: ${refundTxError.message}`);
    }

    // Update order status - use 'cancelled' since 'refunded' is not a valid status
    const { error: orderUpdateError } = await supabaseClient
      .from('orders')
      .update({
        status: 'cancelled',
        refund_status: 'completed',
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    // Create notifications
    try {
      await supabaseClient.from('order_notifications').insert([
        {
          order_id: orderId,
          user_id: order.buyer_id,
          type: 'refund_success',
          title: 'Refund Processed',
          message: `Your refund of R${refundAmountInZAR.toFixed(2)} has been processed successfully.`,
        },
        {
          order_id: orderId,
          user_id: order.seller_id,
          type: 'order_refunded',
          title: 'Order Refunded',
          message: `Order has been refunded to the buyer.`,
        },
      ]);
    } catch (notifError) {
      // Notification error - continue with refund
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          refund_id: refundTransaction?.id,
          amount: refundAmountInZAR,
          amount_cents: refundAmountInCents,
          status: 'success',
          message: 'Refund processed successfully',
          custom_payment_id: customPaymentId,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Log failed refund attempt if order_id is available
    if (refundData) {
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await supabaseClient.from('refund_transactions').insert({
          order_id: refundData.order_id,
          amount: 0,
          status: 'failed',
          reason: errorMessage,
          transaction_reference: `failed-${Date.now()}`,
          bobpay_response: {
            error: errorMessage,
            failed_at: new Date().toISOString(),
          },
        });
      } catch (logError) {
        // Error logging - continue
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
