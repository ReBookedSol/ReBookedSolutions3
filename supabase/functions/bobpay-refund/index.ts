import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RefundRequest {
  order_id: string;
  payment_id?: number;
  reason?: string;
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const refundData: RefundRequest = await req.json();
    console.log('Processing BobPay refund:', refundData);

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, payment_transactions(*)')
      .eq('id', refundData.order_id)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Check if user is authorized (admin, buyer, or seller)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAuthorized =
      profile?.role === 'admin' ||
      profile?.role === 'super_admin' ||
      order.buyer_id === user.id ||
      order.seller_id === user.id;

    if (!isAuthorized) {
      throw new Error('Not authorized to refund this order');
    }

    // Check refund eligibility
    const { data: eligibility } = await supabaseClient.rpc('check_refund_eligibility', {
      p_order_id: refundData.order_id,
    });

    if (!eligibility || !eligibility[0]?.eligible) {
      throw new Error(eligibility?.[0]?.reason || 'Order not eligible for refund');
    }

    // Get BobPay payment ID from transaction
    let bobpayPaymentId = refundData.payment_id;

    if (!bobpayPaymentId && order.payment_transactions?.length > 0) {
      const txResponse = order.payment_transactions[0].paystack_response;
      if (txResponse?.id) {
        bobpayPaymentId = txResponse.id;
      } else if (txResponse?.payment_id) {
        bobpayPaymentId = txResponse.payment_id;
      }
    }

    if (!bobpayPaymentId) {
      throw new Error('Payment ID not found for refund');
    }

    console.log('Initiating BobPay refund for payment ID:', bobpayPaymentId);

    // Get BobPay credentials
    const bobpayApiUrl = Deno.env.get('BOBPAY_API_URL');
    const bobpayApiToken = Deno.env.get('BOBPAY_API_TOKEN');

    if (!bobpayApiUrl || !bobpayApiToken) {
      throw new Error('BobPay configuration missing');
    }

    // Call BobPay refund API
    const refundResponse = await fetch(`${bobpayApiUrl}/v2/payments/reversal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bobpayApiToken}`,
      },
      body: JSON.stringify({
        id: bobpayPaymentId,
      }),
    });

    if (!refundResponse.ok) {
      const errorText = await refundResponse.text();
      console.error('BobPay refund API error:', errorText);
      throw new Error(`BobPay refund failed: ${errorText}`);
    }

    const refundResult = await refundResponse.json();
    console.log('BobPay refund successful:', refundResult);

    // Create refund transaction record
    const { data: refundTransaction, error: refundTxError } = await supabaseClient
      .from('refund_transactions')
      .insert({
        order_id: refundData.order_id,
        user_id: user.id,
        amount: eligibility[0].max_refund_amount,
        reason: refundData.reason || 'Refund initiated by user',
        status: 'success',
        paystack_refund_reference: refundResult.payment_method?.merchant_reference || '',
        paystack_response: {
          ...refundResult,
          provider: 'bobpay',
        },
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (refundTxError) {
      console.error('Error creating refund transaction:', refundTxError);
      throw new Error('Failed to record refund transaction');
    }

    // Update order status
    await supabaseClient
      .from('orders')
      .update({
        status: 'refunded',
        refund_status: 'completed',
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', refundData.order_id);

    // Create notifications
    await supabaseClient.from('order_notifications').insert([
      {
        order_id: refundData.order_id,
        user_id: order.buyer_id,
        type: 'refund_success',
        title: 'Refund Processed',
        message: `Your refund of R${eligibility[0].max_refund_amount.toFixed(2)} has been processed successfully.`,
      },
      {
        order_id: refundData.order_id,
        user_id: order.seller_id,
        type: 'order_refunded',
        title: 'Order Refunded',
        message: `Order has been refunded to the buyer.`,
      },
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          refund_id: refundTransaction.id,
          amount: eligibility[0].max_refund_amount,
          status: 'success',
          message: 'Refund processed successfully',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in bobpay-refund:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Log failed refund attempt if order_id is available
    try {
      const refundData: RefundRequest = await req.json();
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabaseClient.from('refund_transactions').insert({
        order_id: refundData.order_id,
        amount: 0,
        status: 'failed',
        reason: errorMessage,
      });
    } catch (logError) {
      console.error('Failed to log refund error:', logError);
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
