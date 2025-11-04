/**
 * Example: How to integrate BobPay into checkout component
 * This shows the practical usage patterns for BobPay payment processing
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import BobPayPopup from '@/components/BobPayPopup';
import { initializeBobPayCheckout } from '@/utils/bobpayCheckoutHelper';
import { supabase } from '@/integrations/supabase/client';
import { OrderSummary, OrderConfirmation } from '@/types/checkout';

interface ExampleBobPayCheckoutProps {
  orderSummary: OrderSummary;
  userId: string;
  onPaymentSuccess: (orderData: OrderConfirmation) => void;
}

/**
 * Example 1: Using the popup component (simple redirect-based payment)
 */
export const Example1_BobPayPopup = ({
  orderSummary,
  userId,
  onPaymentSuccess,
}: ExampleBobPayCheckoutProps) => {
  const [userEmail, setUserEmail] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  // Fetch user email
  const getUserEmail = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user?.email) {
      setUserEmail(userData.user.email);
      return userData.user.email;
    }
    throw new Error('User email not found');
  };

  // Handle payment success callback from webhook
  const handleBobPaySuccess = (response: any) => {
    console.log('BobPay payment successful:', response);
    // This would normally be handled by the webhook
    toast.success('Payment successful! Processing order...');
  };

  return (
    <div className="space-y-4">
      <h2>Pay with BobPay</h2>
      <p>Amount: R{orderSummary.total_price.toFixed(2)}</p>

      <BobPayPopup
        email={userEmail}
        amount={orderSummary.total_price}
        orderId={userId}
        buyerId={userId}
        itemName={`Book: ${orderSummary.book.title}`}
        itemDescription={`Seller: ${orderSummary.book.author}`}
        onSuccess={handleBobPaySuccess}
        disabled={processing}
      />
    </div>
  );
};

/**
 * Example 2: Using the checkout helper (complete flow)
 */
export const Example2_CompleteCheckout = ({
  orderSummary,
  userId,
  onPaymentSuccess,
}: ExampleBobPayCheckoutProps) => {
  const [processing, setProcessing] = useState(false);

  const handleInitiateBobPayCheckout = async () => {
    setProcessing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.email) {
        throw new Error('User authentication failed');
      }

      // This function handles:
      // 1. Order creation
      // 2. Address encryption
      // 3. Payment initialization
      // 4. Redirect to BobPay payment page
      const result = await initializeBobPayCheckout({
        userId,
        email: userData.user.email,
        orderSummary,
        mobileNumber: userData.user.phone || undefined,
      });

      if (result) {
        // User will be redirected to BobPay
        // Order creation happens before redirect
        console.log('Order created and payment initiated:', result);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Checkout failed'
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Button
      onClick={handleInitiateBobPayCheckout}
      disabled={processing}
      className="w-full"
    >
      {processing ? 'Processing...' : 'Proceed to BobPay'}
    </Button>
  );
};

/**
 * Example 3: Order cancellation with intelligent refund
 */
export const Example3_OrderCancellation = ({
  orderId,
  amount,
}: {
  orderId: string;
  amount: number;
}) => {
  const [processing, setProcessing] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancelOrder = async () => {
    setProcessing(true);
    try {
      const { refundOrderForBuyer } = await import(
        '@/utils/refundHandler'
      );

      const result = await refundOrderForBuyer(
        orderId,
        cancelReason || 'User requested cancellation'
      );

      if (result.success) {
        toast.success(result.message);
        // Refresh order data, redirect, etc.
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      toast.error('Failed to cancel order');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3>Cancel Order</h3>
      <p>Order ID: {orderId}</p>
      <p>Refund Amount: R{amount.toFixed(2)}</p>

      <textarea
        placeholder="Reason for cancellation..."
        value={cancelReason}
        onChange={(e) => setCancelReason(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <Button
        onClick={handleCancelOrder}
        disabled={processing}
        variant="destructive"
      >
        {processing ? 'Processing...' : 'Cancel and Refund'}
      </Button>
    </div>
  );
};

/**
 * Example 4: Seller declining order with refund
 */
export const Example4_OrderDecline = ({
  orderId,
  buyerId,
  bookTitle,
}: {
  orderId: string;
  buyerId: string;
  bookTitle: string;
}) => {
  const [processing, setProcessing] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const handleDeclineOrder = async () => {
    setProcessing(true);
    try {
      const { refundOrderForDecline } = await import(
        '@/utils/refundHandler'
      );

      const result = await refundOrderForDecline(
        orderId,
        declineReason || 'Seller declined to commit'
      );

      if (result.success) {
        toast.success('Order declined and refund processed');
        // Notify buyer, update UI, etc.
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Decline error:', error);
      toast.error('Failed to decline order');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3>Decline Order</h3>
      <p>Book: {bookTitle}</p>
      <p>Buyer will be refunded automatically</p>

      <textarea
        placeholder="Reason for declining..."
        value={declineReason}
        onChange={(e) => setDeclineReason(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <Button
        onClick={handleDeclineOrder}
        disabled={processing}
        variant="destructive"
      >
        {processing ? 'Processing...' : 'Decline Order'}
      </Button>
    </div>
  );
};

/**
 * Example 5: Detecting payment provider
 */
export const Example5_PaymentProviderDetection = ({
  orderId,
}: {
  orderId: string;
}) => {
  const [provider, setProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkPaymentProvider = async () => {
    setLoading(true);
    try {
      const { detectPaymentProvider } = await import(
        '@/utils/refundHandler'
      );

      const detectedProvider = await detectPaymentProvider(orderId);
      setProvider(detectedProvider);

      if (detectedProvider === 'bobpay') {
        toast.info('Order paid with BobPay');
      } else if (detectedProvider === 'paystack') {
        toast.info('Order paid with Paystack');
      } else {
        toast.warning('Payment provider could not be determined');
      }
    } catch (error) {
      console.error('Detection error:', error);
      toast.error('Failed to detect payment provider');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={checkPaymentProvider} disabled={loading}>
        {loading ? 'Detecting...' : 'Detect Payment Provider'}
      </Button>
      {provider && <p>Payment Provider: {provider}</p>}
    </div>
  );
};
