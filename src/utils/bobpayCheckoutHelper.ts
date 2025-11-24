import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OrderSummary, OrderConfirmation } from '@/types/checkout';

interface CheckoutData {
  userId: string;
  email: string;
  orderSummary: OrderSummary;
  mobileNumber?: string;
}

/**
 * Initialize BobPay payment for checkout
 */
export const initializeBobPayCheckout = async (
  checkoutData: CheckoutData
): Promise<OrderConfirmation | null> => {
  try {
    const { userId, email, orderSummary, mobileNumber } = checkoutData;

    // Step 1: Create order first
    const shippingObject = {
      streetAddress: orderSummary.buyer_address.street,
      city: orderSummary.buyer_address.city,
      province: orderSummary.buyer_address.province,
      postalCode: orderSummary.buyer_address.postal_code,
      country: orderSummary.buyer_address.country,
      phone: orderSummary.buyer_address.phone,
      additional_info: orderSummary.buyer_address.additional_info,
    };

    // Encrypt shipping address
    const { data: encResult, error: encError } = await supabase.functions.invoke(
      'encrypt-address',
      { body: { object: shippingObject } }
    );

    if (encError || !encResult?.success || !encResult?.data) {
      throw new Error(encError?.message || 'Failed to encrypt shipping address');
    }

    const shipping_address_encrypted = JSON.stringify(encResult.data);

    // Create order via edge function
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const createOrderPayload = {
      buyer_id: userId,
      seller_id: orderSummary.book.seller_id,
      book_id: orderSummary.book.id,
      delivery_option: orderSummary.delivery.service_name,
      shipping_address_encrypted,
      selected_courier_slug: orderSummary.delivery.provider_slug,
      selected_service_code: orderSummary.delivery.service_level_code,
      selected_courier_name: orderSummary.delivery.provider_name || orderSummary.delivery.courier,
      selected_service_name: orderSummary.delivery.service_name,
      selected_shipping_cost: orderSummary.delivery.price,
    };

    const { data: createData, error: createErr } = await supabase.functions.invoke(
      'create-order',
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: createOrderPayload,
      }
    );

    if (createErr || !createData?.success || !createData?.order?.id) {
      throw new Error(createErr?.message || 'Failed to create order');
    }

    const orderId = createData.order.id;
    console.log('Order created:', orderId);

    // Step 2: Initialize BobPay payment
    const notifyUrl = `${window.location.origin}/api/bobpay-webhook`;
    const successUrl = `${window.location.origin}/orders/${orderId}/success`;
    const pendingUrl = `${window.location.origin}/orders/${orderId}/pending`;
    const cancelUrl = `${window.location.origin}/orders/${orderId}/cancelled`;

    const paymentInitPayload = {
      amount: orderSummary.total_price,
      email,
      mobile_number: mobileNumber || '',
      item_name: `Order #${orderId}`,
      item_description: `Book: ${orderSummary.book.title}`,
      custom_payment_id: orderId,
      order_id: orderId,
      buyer_id: userId,
      notify_url: notifyUrl,
      success_url: successUrl,
      pending_url: pendingUrl,
      cancel_url: cancelUrl,
    };

    const { data: paymentData, error: paymentErr } = await supabase.functions.invoke(
      'bobpay-initialize-payment',
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: paymentInitPayload,
      }
    );

    if (paymentErr || !paymentData?.success) {
      throw new Error(paymentErr?.message || 'Failed to initialize payment');
    }

    // Open payment page in the same tab
    if (paymentData.data?.payment_url) {
      window.location.href = paymentData.data.payment_url;

      // Return a temporary confirmation (actual will come from webhook)
      return {
        order_id: orderId,
        payment_reference: paymentData.data.reference,
        book_id: orderSummary.book.id,
        seller_id: orderSummary.book.seller_id,
        buyer_id: userId,
        book_title: orderSummary.book.title,
        book_price: orderSummary.book_price,
        delivery_method: orderSummary.delivery.service_name,
        delivery_price: orderSummary.delivery_price,
        total_paid: orderSummary.total_price,
        created_at: new Date().toISOString(),
        status: 'pending',
      };
    }

    throw new Error('No payment URL received');
  } catch (error) {
    console.error('BobPay checkout initialization error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    toast.error(errorMessage);
    return null;
  }
};

/**
 * Handle BobPay refund for an order (only for non-committed orders)
 */
export const initiateBobPayRefund = async (
  orderId: string,
  reason?: string
): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    // Check order status first - only refund if not committed
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      throw new Error('Order not found');
    }

    // Only invoke BobPay refund for non-committed orders
    if ((orderData.status || '').toLowerCase() === 'committed') {
      throw new Error('Cannot refund committed orders directly. Please use the standard cancel-order-with-refund flow.');
    }

    const { data, error } = await supabase.functions.invoke(
      'bobpay-refund',
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          order_id: orderId,
          reason: reason || 'Customer requested refund',
        },
      }
    );

    if (error || !data?.success) {
      throw new Error(error?.message || 'Refund failed');
    }

    toast.success('Refund processed successfully');
    return true;
  } catch (err) {
    console.error('BobPay refund error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Refund failed';
    toast.error(errorMessage);
    return false;
  }
};
