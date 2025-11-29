import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BobPayPopupProps {
  email: string;
  amount: number;
  orderId: string;
  buyerId: string;
  itemName: string;
  itemDescription?: string;
  mobileNumber?: string;
  onSuccess: (response: BobPayResponse) => void;
  onClose?: () => void;
  disabled?: boolean;
}

interface BobPayResponse {
  payment_url: string;
  short_url: string;
  reference: string;
  success: boolean;
}

export const BobPayPopup: React.FC<BobPayPopupProps> = ({
  email,
  amount,
  orderId,
  buyerId,
  itemName,
  itemDescription,
  mobileNumber,
  onSuccess,
  onClose,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const notifyUrl = `${window.location.origin}/api/bobpay-webhook`;
      const successUrl = `${window.location.origin}/orders/${orderId}/success`;
      const pendingUrl = `${window.location.origin}/orders/${orderId}/pending`;
      const cancelUrl = `${window.location.origin}/orders/${orderId}/cancelled`;

      const { data, error } = await supabase.functions.invoke('bobpay-initialize-payment', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          amount,
          email,
          mobile_number: mobileNumber,
          item_name: itemName,
          item_description: itemDescription || '',
          custom_payment_id: orderId,
          order_id: orderId,
          buyer_id: buyerId,
          notify_url: notifyUrl,
          success_url: successUrl,
          pending_url: pendingUrl,
          cancel_url: cancelUrl,
        },
      });

      if (error) {
        toast.error(error.message || 'Failed to initialize payment');
        throw error;
      }

      if (!data?.success || !data?.data?.payment_url) {
        throw new Error('Invalid response from payment gateway');
      }

      // Open payment page in the same tab
      window.location.href = data.data.payment_url;

      onSuccess({
        payment_url: data.data.payment_url,
        short_url: data.data.short_url,
        reference: data.data.reference,
        success: true,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Payment initialization failed');
      onClose?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      className="w-full"
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Initializing Payment...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Pay with BobPay
        </>
      )}
    </Button>
  );
};

export default BobPayPopup;
