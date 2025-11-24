import { supabase } from '@/integrations/supabase/client';

export interface BobPayInitRequest {
  amount: number;
  email: string;
  mobile_number?: string;
  item_name: string;
  item_description?: string;
  custom_payment_id: string;
  success_url: string;
  pending_url: string;
  cancel_url: string;
  notify_url: string;
  order_id?: string;
  buyer_id?: string;
}

export interface BobPayRefundRequest {
  order_id: string;
  payment_id?: number;
  reason?: string;
}

export interface BobPayResponse {
  success: boolean;
  data?: {
    payment_url: string;
    short_url: string;
    reference: string;
  };
  error?: string;
}

export interface BobPayRefundResponse {
  success: boolean;
  data?: {
    refund_id: string;
    amount: number;
    status: string;
    message: string;
  };
  error?: string;
}

/**
 * Initialize a BobPay payment
 */
export const initializeBobPayPayment = async (
  paymentData: BobPayInitRequest
): Promise<BobPayResponse> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('bobpay-initialize-payment', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: paymentData,
    });

    if (error) {
      console.error('BobPay initialization error:', error);
      return {
        success: false,
        error: error.message || 'Failed to initialize payment',
      };
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.error || 'Payment initialization failed',
      };
    }

    return data;
  } catch (err) {
    console.error('BobPay initialization exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
};

/**
 * Process a BobPay refund (only for non-committed orders)
 */
export const processBobPayRefund = async (
  refundData: BobPayRefundRequest
): Promise<BobPayRefundResponse> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    // Check order status first - only refund if not committed
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', refundData.order_id)
      .single();

    if (orderError || !orderData) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    // Only invoke BobPay refund for non-committed orders
    if ((orderData.status || '').toLowerCase() === 'committed') {
      return {
        success: false,
        error: 'Cannot refund committed orders directly. Please use the standard cancel-order-with-refund flow.',
      };
    }

    const { data, error } = await supabase.functions.invoke('bobpay-refund', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: refundData,
    });

    if (error) {
      console.error('BobPay refund error:', error);
      return {
        success: false,
        error: error.message || 'Failed to process refund',
      };
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.error || 'Refund processing failed',
      };
    }

    return data;
  } catch (err) {
    console.error('BobPay refund exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
};

/**
 * Format amount for BobPay (no conversion needed, BobPay uses ZAR)
 */
export const formatBobPayAmount = (amountInRand: number): number => {
  return Math.round(amountInRand * 100) / 100;
};
