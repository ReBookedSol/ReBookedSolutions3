import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const cancelData = await req.json();
    console.log('Processing cancel and refund for order:', cancelData.order_id);

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', cancelData.order_id)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Check if order status prevents cancellation
    const blockedStatuses = ['collected', 'in transit', 'out for delivery', 'delivered'];
    const orderStatus = (order.status || '').toLowerCase();
    const deliveryStatus = (order.delivery_status || '').toLowerCase();
    
    if (blockedStatuses.includes(orderStatus) || blockedStatuses.includes(deliveryStatus)) {
      const currentStatus = blockedStatuses.includes(orderStatus) ? order.status : order.delivery_status;
      throw new Error(`Your order is "${currentStatus}". Therefore you cannot cancel the order. Contact support for more assistance.`);
    }

    if (order.status === 'scheduled') {
      throw new Error('Cannot cancel order - pickup is already scheduled');
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
      throw new Error('Not authorized to cancel this order');
    }

    console.log('Authorization check passed');

    // Step 1: Cancel shipment if tracking number exists
    if (order.tracking_number) {
      console.log('Cancelling shipment with tracking number:', order.tracking_number);
      try {
        const { error: cancelShipmentError } = await supabaseClient.functions.invoke(
          'bobgo-cancel-shipment',
          {
            body: { tracking_number: order.tracking_number },
          }
        );

        if (cancelShipmentError) {
          console.error('Error cancelling shipment:', cancelShipmentError);
          // Continue with refund even if shipment cancellation fails
        } else {
          console.log('Shipment cancelled successfully');
        }
      } catch (shipmentError) {
        console.error('Failed to cancel shipment:', shipmentError);
        // Continue with refund
      }
    }

    // Step 2: Process refund
    console.log('Processing refund...');
    const { data: refundResult, error: refundError } = await supabaseClient.functions.invoke(
      'bobpay-refund',
      {
        body: {
          order_id: cancelData.order_id,
          reason: cancelData.reason || 'Order cancelled by user',
        },
      }
    );

    if (refundError) {
      console.error('Refund failed:', refundError);
      throw new Error(`Refund failed: ${refundError.message}`);
    }

    console.log('Refund processed successfully');

    // Step 3: Update order status
    await supabaseClient
      .from('orders')
      .update({
        status: 'cancelled',
        refund_status: 'completed',
        refunded_at: new Date().toISOString(),
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cancelData.reason || 'Order cancelled by user',
        updated_at: new Date().toISOString(),
      })
      .eq('id', cancelData.order_id);

    console.log('Order status updated to cancelled');

    // Create notifications
    await supabaseClient.from('order_notifications').insert([
      {
        order_id: cancelData.order_id,
        user_id: order.buyer_id,
        type: 'order_cancelled',
        title: 'Order Cancelled',
        message: 'Your order has been cancelled and refunded.',
      },
      {
        order_id: cancelData.order_id,
        user_id: order.seller_id,
        type: 'order_cancelled',
        title: 'Order Cancelled',
        message: 'An order has been cancelled and refunded.',
      },
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order cancelled and refund processed successfully',
        data: {
          order_id: cancelData.order_id,
          refund_status: 'completed',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in cancel-and-refund-order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
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
