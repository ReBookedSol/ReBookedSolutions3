import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Package,
  Truck,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { OrderSummary, OrderConfirmation } from "@/types/checkout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import PaymentErrorHandler, {
  classifyPaymentError,
  PaymentError,
} from "@/components/payments/PaymentErrorHandler";
import { logError, getUserFriendlyErrorMessage } from "@/utils/errorLogging";

interface Step3PaymentProps {
  orderSummary: OrderSummary;
  onBack: () => void;
  onPaymentSuccess: (orderData: OrderConfirmation) => void;
  onPaymentError: (error: string) => void;
  userId: string;
}

const Step3Payment: React.FC<Step3PaymentProps> = ({
  orderSummary,
  onBack,
  onPaymentSuccess,
  onPaymentError,
  userId,
}) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<PaymentError | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const isMobile = useIsMobile();

  // Fetch user email only
  React.useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const email = await getUserEmail();
        setUserEmail(email);
      } catch (err) {
        console.error("Failed to fetch user email:", err);
      }
    };
    fetchUserEmail();
  }, []);

  const handleBobPayPayment = async () => {
    setProcessing(true);
    setError(null);
    try {
      console.log("Initiating BobPay payment for order:", orderSummary);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.email) {
        throw new Error("User authentication error");
      }

      const customPaymentId = `ORDER-${Date.now()}-${userId}`;
      const baseUrl = window.location.origin;

      // Step 1: Fetch buyer and seller profiles for denormalized data
      console.log("🔍 Fetching buyer and seller profiles...");
      const { data: buyerProfile, error: buyerError } = await supabase
        .from("profiles")
        .select("id, full_name, name, first_name, last_name, email, phone_number")
        .eq("id", userId)
        .single();

      if (buyerError || !buyerProfile) {
        throw new Error("Failed to fetch buyer profile");
      }

      const { data: sellerProfile, error: sellerError } = await supabase
        .from("profiles")
        .select("id, full_name, name, first_name, last_name, email, phone_number, pickup_address_encrypted")
        .eq("id", orderSummary.book.seller_id)
        .single();

      if (sellerError || !sellerProfile) {
        throw new Error("Failed to fetch seller profile");
      }

      const buyerFullName = buyerProfile.full_name || buyerProfile.name || `${buyerProfile.first_name || ''} ${buyerProfile.last_name || ''}`.trim() || 'Buyer';
      const sellerFullName = sellerProfile.full_name || sellerProfile.name || `${sellerProfile.first_name || ''} ${sellerProfile.last_name || ''}`.trim() || 'Seller';

      // Prepare locker data if delivery method is locker
      const deliveryType = orderSummary.delivery_method === "locker" ? "locker" : "door";
      const deliveryLockerData = orderSummary.delivery_method === "locker" ? orderSummary.selected_locker : null;
      const deliveryLockerLocationId = orderSummary.delivery_method === "locker" ? orderSummary.selected_locker?.id : null;

      // Step 2: Encrypt the shipping address (only for door deliveries)
      let shipping_address_encrypted = "";
      if (deliveryType === "door") {
        console.log("🔐 Encrypting shipping address...");
        const shippingObject = {
          streetAddress: orderSummary.buyer_address.street,
          city: orderSummary.buyer_address.city,
          province: orderSummary.buyer_address.province,
          postalCode: orderSummary.buyer_address.postal_code,
          country: orderSummary.buyer_address.country,
          phone: orderSummary.buyer_address.phone,
          additional_info: orderSummary.buyer_address.additional_info,
        };

        const { data: encResult, error: encError } = await supabase.functions.invoke(
          'encrypt-address',
          { body: { object: shippingObject } }
        );

        if (encError || !encResult?.success || !encResult?.data) {
          throw new Error(encError?.message || 'Failed to encrypt shipping address');
        }

        shipping_address_encrypted = JSON.stringify(encResult.data);
      } else {
        console.log("📦 Locker delivery selected - skipping address encryption");
      }

      // Step 3: Create the order (before payment)
      console.log("📦 Creating order before payment initialization...");

      const { data: createdOrder, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            buyer_email: buyerProfile.email || userData.user.email,
            buyer_full_name: buyerFullName,
            seller_id: orderSummary.book.seller_id,
            seller_email: sellerProfile.email || "",
            seller_full_name: sellerFullName,
            buyer_phone_number: buyerProfile.phone_number || "",
            seller_phone_number: sellerProfile.phone_number || "",
            pickup_address_encrypted: sellerProfile.pickup_address_encrypted || "",
            amount: Math.round(orderSummary.total_price * 100),
            status: "pending",
            payment_reference: customPaymentId,
            buyer_id: userId,
            book_id: orderSummary.book.id,
            delivery_option: orderSummary.delivery.service_name,
            payment_status: "pending",

            items: [
              {
                type: "book",
                book_id: orderSummary.book.id,
                book_title: orderSummary.book.title,
                price: Math.round(orderSummary.book_price * 100),
                quantity: 1,
                condition: orderSummary.book.condition,
                seller_id: orderSummary.book.seller_id,
              },
            ],

            shipping_address_encrypted,

            delivery_data: {
              delivery_method: orderSummary.delivery.service_name,
              delivery_price: Math.round(orderSummary.delivery_price * 100),
              courier: orderSummary.delivery.courier,
              estimated_days: orderSummary.delivery.estimated_days,
              pickup_address: orderSummary.seller_address,
              pickup_locker_data: orderSummary.seller_locker_data || null,
              delivery_quote: orderSummary.delivery,
              delivery_type: deliveryType,
            },

            metadata: {
              buyer_id: userId,
              platform_fee: 2000,
              seller_amount: Math.round(orderSummary.book_price * 100) - 2000,
              original_total: orderSummary.total_price,
              original_book_price: orderSummary.book_price,
              original_delivery_price: orderSummary.delivery_price,
            },

            total_amount: orderSummary.total_price,
            selected_courier_name: orderSummary.delivery.provider_name || orderSummary.delivery.courier,
            selected_courier_slug: orderSummary.delivery.provider_slug || orderSummary.delivery.courier,
            selected_service_code: orderSummary.delivery.service_level_code || "",
            selected_service_name: orderSummary.delivery.service_name,
            selected_shipping_cost: orderSummary.delivery_price,
            delivery_type: deliveryType,
            delivery_locker_data: deliveryLockerData,
            delivery_locker_location_id: deliveryLockerLocationId,
          },
        ])
        .select()
        .single();

      if (orderError) {
        console.error("❌ Failed to create order:", orderError);
        throw new Error(`Failed to create order: ${orderError.message}`);
      }

      console.log("✅ Order created successfully:", createdOrder.id);

      // Step 3.5: Process affiliate earning if seller was referred
      supabase.functions.invoke('process-affiliate-earning', {
        body: {
          book_id: orderSummary.book.id,
          order_id: createdOrder.id,
          seller_id: orderSummary.book.seller_id,
        },
      }).then(() => {
        console.log('✅ Affiliate earning processed successfully');
      }).catch((affiliateErr) => {
        console.warn('Warning: Failed to process affiliate earning:', affiliateErr);
        // Non-blocking error - affiliate processing is secondary
      });

      // Step 4: Initialize BobPay payment with the order_id
      const paymentRequest = {
        order_id: createdOrder.id,
        amount: orderSummary.total_price,
        email: buyerProfile.email || userData.user.email,
        mobile_number: buyerProfile.phone_number || "",
        item_name: orderSummary.book.title,
        item_description: `Book purchase - ${orderSummary.book.author || "Unknown Author"}`,
        custom_payment_id: customPaymentId,
        notify_url: `${baseUrl}/api/bobpay-webhook`,
        success_url: `${baseUrl}/checkout/success?reference=${customPaymentId}`,
        pending_url: `${baseUrl}/checkout/pending?reference=${customPaymentId}`,
        cancel_url: `${baseUrl}/checkout/cancel?reference=${customPaymentId}`,
        buyer_id: userId,
      };

      console.log("Calling bobpay-initialize-payment with order_id:", paymentRequest.order_id);

      const { data: bobpayResult, error: bobpayError } = await supabase.functions.invoke(
        "bobpay-initialize-payment",
        { body: paymentRequest }
      );

      if (bobpayError || !bobpayResult?.success) {
        throw new Error(
          bobpayError?.message || bobpayResult?.error || "Failed to initialize BobPay payment"
        );
      }

      const paymentUrl = bobpayResult.data?.payment_url;
      if (!paymentUrl) {
        throw new Error("No payment URL received from BobPay");
      }

      console.log("BobPay payment URL:", paymentUrl);
      toast.success("Redirecting to payment page...");

      // Open payment page in the same tab
      window.location.href = paymentUrl;
    } catch (err) {
      console.error("BobPay initialization error:", err);
      const errorMessage = err instanceof Error ? err.message : "Payment initialization failed";
      const classifiedError = classifyPaymentError(errorMessage);
      setError(classifiedError);
      onPaymentError(errorMessage);
      toast.error("Payment initialization failed", {
        description: classifiedError.message,
        duration: 5000,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handlePaystackSuccess = async (paystackResponse: {
    reference: string;
    status: string;
    trans: string;
    transaction: string;
    trxref: string;
    redirecturl: string;
  }) => {
    setProcessing(true);
    try {
      console.log("Paystack payment successful:", paystackResponse);

      // Encrypt buyer shipping address AFTER payment
      const buyer = orderSummary.buyer_address;
      const shippingObject = {
        streetAddress: buyer.street,
        city: buyer.city,
        province: buyer.province,
        postalCode: buyer.postal_code,
        country: buyer.country,
        phone: buyer.phone,
        additional_info: buyer.additional_info,
      } as any;

      const { data: encResult, error: encError } = await supabase.functions.invoke('encrypt-address', {
        body: { object: shippingObject },
      });
      if (encError || !encResult?.success || !encResult?.data) {
        throw new Error(encError?.message || 'Failed to encrypt shipping address');
      }

      const shipping_address_encrypted = JSON.stringify(encResult.data);

      // Create order only after payment
      const createOrderPayload = {
        buyer_id: userId,
        seller_id: orderSummary.book.seller_id,
        book_id: orderSummary.book.id,
        delivery_option: orderSummary.delivery.service_name,
        shipping_address_encrypted,
        payment_reference: paystackResponse.reference,
        selected_courier_slug: orderSummary.delivery.provider_slug,
        selected_service_code: orderSummary.delivery.service_level_code,
        selected_courier_name: orderSummary.delivery.provider_name || orderSummary.delivery.courier,
        selected_service_name: orderSummary.delivery.service_name,
        selected_shipping_cost: orderSummary.delivery.price,
      };

      // Create order first
      const { data: createData, error: createErr } = await supabase.functions.invoke('create-order', {
        body: createOrderPayload,
      });

      if (createErr || !createData?.success || !createData?.order?.id) {
        throw new Error(createErr?.message || 'Failed to create order');
      }

      console.log('✅ Order created successfully:', createData.order.id);

      // Invoke process-affiliate-earning immediately after order creation (in parallel/background)
      supabase.functions.invoke('process-affiliate-earning', {
        body: {
          book_id: orderSummary.book.id,
          order_id: createData.order.id,
          seller_id: orderSummary.book.seller_id,
        },
      }).then(() => {
        console.log('✅ Affiliate earning processed successfully');
      }).catch((affiliateErr) => {
        console.warn('Warning: Failed to process affiliate earning:', affiliateErr);
        // Non-blocking error - affiliate processing is secondary
      });

      onPaymentSuccess({
        order_id: createData.order.id,
        payment_reference: paystackResponse.reference,
        book_id: orderSummary.book.id,
        seller_id: orderSummary.book.seller_id,
        buyer_id: userId,
        book_title: orderSummary.book.title,
        book_price: orderSummary.book_price,
        delivery_method: orderSummary.delivery.service_name,
        delivery_price: orderSummary.delivery_price,
        total_paid: orderSummary.total_price,
        created_at: new Date().toISOString(),
        status: 'paid',
      });
      toast.success('Payment successful. Order created.');

      // Order created; backend will handle any further status transitions.

                                    if (error) {
        // Direct error logging for debugging
        console.log("🔍 DIRECT ERROR LOG - Type:", typeof error);
        console.log("🔍 DIRECT ERROR LOG - Constructor:", error?.constructor?.name);
        console.log("🔍 DIRECT ERROR LOG - Raw:", error);
        console.log("�� DIRECT ERROR LOG - Message:", error?.message);
        console.log("�� DIRECT ERROR LOG - Details:", error?.details);
        console.log("🔍 DIRECT ERROR LOG - Code:", error?.code);
        console.log("🔍 DIRECT ERROR LOG - Hint:", error?.hint);
        console.log("🔍 DIRECT ERROR LOG - Stringified:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

        const errorDetails = logError("Edge Function Error", error, {
          requestBody,
          orderSummary: orderSummary.book.id
        });

                                // Fixed error message extraction for Supabase FunctionsError
        const extractErrorMessage = (err: any): string => {
          console.log('🔍 Extracting error message from:', err);

          // Handle null/undefined
          if (err === null || err === undefined) {
            return 'Edge function returned null error';
          }

          // Direct string check
          if (typeof err === 'string') {
            return err === '[object Object]' ? 'Edge function returned unreadable error' : err;
          }

          // Handle Supabase FunctionsError objects
          if (err && typeof err === 'object') {
            // Most common Supabase patterns
            if (err.context?.message) {
              return String(err.context.message);
            }

            if (err.message && err.message !== '[object Object]') {
              return String(err.message);
            }

            if (err.details && err.details !== '[object Object]') {
              return String(err.details);
            }

            if (err.hint) {
              return String(err.hint);
            }

            if (err.code) {
              return `Error code: ${err.code}`;
            }

            // Check if this looks like a network error
            if (err.name === 'FunctionsError' || err.name === 'FunctionsHttpError') {
              return 'Edge function is not available or not deployed';
            }

            // Try to extract any string property
            const keys = Object.keys(err);
            for (const key of keys) {
              const value = err[key];
              if (typeof value === 'string' && value && value !== '[object Object]') {
                return `${key}: ${value}`;
              }
            }

            // If all else fails, describe what we have
            return `Edge function error (${err.constructor?.name || 'Unknown'}) with keys: ${keys.join(', ')}`;
          }

          return 'Edge function returned an unrecognizable error';
        };

        const userFriendlyMessage = extractErrorMessage(error);

        console.log("🔍 RAW ERROR:", error);
        console.log("🔍 EXTRACTED MESSAGE:", userFriendlyMessage);
        console.log("🔍 MESSAGE TYPE:", typeof userFriendlyMessage);

        // Fallback: Create order directly in database when Edge Function fails
        console.log("🔄 Attempting fallback order creation...");

        try {
          const fallbackOrderData = {
            buyer_email: userData.user.email,
            seller_id: orderSummary.book.seller_id,
            amount: Math.round(orderSummary.total_price * 100), // Convert to kobo
            paystack_ref: paystackResponse.reference,
            status: "pending",
            items: [
              {
                type: "book",
                book_id: orderSummary.book.id,
                book_title: orderSummary.book.title,
                price: Math.round(orderSummary.book_price * 100),
                condition: orderSummary.book.condition,
                seller_id: orderSummary.book.seller_id,
                quantity: 1,
              },
            ],
            shipping_address: orderSummary.buyer_address,
            delivery_data: {
              method: orderSummary.delivery.service_name,
              courier: orderSummary.delivery.courier,
              price: orderSummary.delivery_price,
              estimated_days: orderSummary.delivery.estimated_days,
            },
            metadata: {
              buyer_id: userId,
              fallback_creation: true,
              edge_function_error: error.message,
              platform_fee: 2000,
              seller_amount: Math.round(orderSummary.book_price * 100) - 2000,
            },
          };

          const { data: fallbackOrder, error: fallbackError } = await supabase
            .from("orders")
            .insert(fallbackOrderData)
            .select()
            .single();

          if (fallbackError) {
            throw new Error(`Fallback order creation failed: ${fallbackError.message}`);
          }

          console.log("✅ Fallback order created successfully:", fallbackOrder);

          // Mark book as sold (non-blocking - order is already created)
          try {
            const { error: bookUpdateError } = await supabase
              .from("books")
              .update({
                sold: true,
                sold_at: new Date().toISOString(),
                availability: "sold",
              })
              .eq("id", orderSummary.book.id);

            if (bookUpdateError) {
              console.warn("⚠️ Book update failed (non-critical):", bookUpdateError.message);
              // Don't throw - order is already created successfully
            } else {
              console.log("✅ Book marked as sold");
            }
          } catch (bookError) {
            console.warn("⚠️ Book update error (non-critical):", bookError);
            // Don't throw - order is already created successfully
          }

          // Use fallback order data for success handler
          const fallbackData = {
            order_id: fallbackOrder.id,
            success: true,
            details: {
              order: fallbackOrder,
              fallback_used: true,
            },
          };

          console.log("✅ Using fallback order data:", fallbackData);

          // Continue with success flow using fallback data
          onPaymentSuccess({
            order_id: fallbackOrder.id,
            payment_reference: paystackResponse.reference,
            book_id: orderSummary.book.id,
            seller_id: orderSummary.book.seller_id,
            buyer_id: userId,
            book_title: orderSummary.book.title,
            book_price: orderSummary.book_price,
            delivery_method: orderSummary.delivery.service_name,
            delivery_price: orderSummary.delivery_price,
            total_paid: orderSummary.total_price,
            created_at: fallbackOrder.created_at,
            status: "completed",
          });

          toast.success("Payment completed successfully! (Fallback mode)");
          return; // Exit early on fallback success

                } catch (fallbackError) {
          logError("Fallback order creation failed", fallbackError);
          // Fall through to original error throwing
        }

                        // Final safety check and throw
        // BULLETPROOF ERROR MESSAGE CONSTRUCTION
        let finalMessage: string;

        try {
          // Convert to string safely
          const messageStr = String(userFriendlyMessage || 'Unknown error');

          // Check for [object Object] pattern
          if (messageStr === '[object Object]' || messageStr.includes('[object Object]')) {
            console.error('🚨 [object Object] detected! Using immediate error instead');

            // Use the immediate error we captured earlier
            const immediateError = (window as any).lastEdgeFunctionError;
            if (immediateError && typeof immediateError === 'string') {
              finalMessage = immediateError;
            } else {
              finalMessage = 'Edge function failed with unreadable error format';
            }
          } else {
            finalMessage = messageStr;
          }
        } catch (stringError) {
          console.error('🚨 Error stringification failed:', stringError);
          finalMessage = 'Edge function error stringification failed';
        }

        // Final safety check - ensure it's a proper string
        if (typeof finalMessage !== 'string') {
          finalMessage = 'Edge function returned non-string error';
        }

        // One more check for [object Object]
        if (finalMessage.includes('[object Object]')) {
          finalMessage = 'Edge function returned unprocessable error object';
        }

        // Add context if needed
        const contextualMessage = finalMessage.includes('Edge function')
          ? finalMessage
          : `Edge function (process-book-purchase) error: ${finalMessage}`;

        console.log("🔍 BULLETPROOF FINAL MESSAGE:", contextualMessage);

        // Instead of throwing, show toast and continue with fallback
        toast.error(contextualMessage, { duration: 10000 });
        console.error("🚨 Edge function error handled:", contextualMessage);
      }

      // Already handled via onPaymentSuccess above.
    } catch (error) {
      console.error("Post-payment handler error:", error);
      toast.error('Payment captured but there was a client error. Check your orders.');
    } finally {
      setProcessing(false);
    }
  };


  const handleRetryPayment = () => {
    setError(null);
    setRetryCount((prev) => prev + 1);

    if (retryCount >= 2) {
      toast.warning(
        "Multiple payment attempts detected. Please contact support if issues persist.",
      );
    }
  };

  const handleContactSupport = () => {
    const subject = "Payment Issue - ReBooked Solutions";
    const body = `
I'm experiencing payment issues:

Order Details:
- Book: ${orderSummary.book.title}
- Total: R${orderSummary.total_price}
- Error: ${error?.message || "Unknown error"}

Retry Count: ${retryCount}
User ID: ${userId}
Time: ${new Date().toISOString()}
`;

    const mailtoLink = `mailto:support@rebookedsolutions.co.za?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, "_blank");
  };

  // Get user email for payment
  const getUserEmail = async () => {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData.user?.email) {
      throw new Error("User authentication error");
    }
    return userData.user.email;
  };

  /**
   * Legacy payment initialization method - keeping for reference
   * Now using PaystackPopup component for better UX
   */
  const initiatePaymentLegacy = async () => {
    setProcessing(true);
    setError(null);

    try {
      console.log(
        "💳 POST /api/payment/initiate - Initiating payment for order:",
        orderSummary,
      );

      // Verify user authentication first
      const { data: authCheck, error: authError } =
        await supabase.auth.getSession();
      if (authError || !authCheck.session) {
        throw new Error("User authentication failed. Please log in again.");
      }

      console.log("User authenticated:", {
        userId: userId,
        email: authCheck.session.user?.email,
        authenticated: !!authCheck.session,
      });

      // Debug mode: Test payment initialization with simplified data
      const debugMode = import.meta.env.DEV && false; // Set to true for debugging

      if (debugMode) {
        console.log("🔍 DEBUG MODE: Testing payment initialization directly");

        const simplePaymentRequest = {
          order_id: "test-order-" + Date.now(),
          email: authCheck.session.user?.email,
          amount: orderSummary.total_price,
          currency: "ZAR",
          callback_url: `${window.location.origin}/checkout/success`,
          metadata: {
            debug: true,
            book_title: orderSummary.book.title,
            buyer_id: userId,
          },
        };

        console.log("🔍 DEBUG: Testing payment with:", simplePaymentRequest);

        const { data: testData, error: testError } =
          await supabase.functions.invoke("initialize-paystack-payment", {
            body: simplePaymentRequest,
          });

        console.log("🔍 DEBUG: Payment test result:", { testData, testError });

        if (testError) {
          throw new Error(`DEBUG: Payment test failed - ${testError.message}`);
        }

        return; // Exit early in debug mode
      }

      // Create order data
      const orderRequest = {
        book_id: orderSummary.book.id,
        seller_id: orderSummary.book.seller_id,
        buyer_id: userId,
        book_price: orderSummary.book_price,
        delivery_price: orderSummary.delivery_price,
        total_amount: orderSummary.total_price,
        delivery_method: orderSummary.delivery.service_name,
        delivery_courier: orderSummary.delivery.courier,
        buyer_address: orderSummary.buyer_address,
        seller_address: orderSummary.seller_address,
        estimated_delivery_days: orderSummary.delivery.estimated_days,
      };

      // Get user email first
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user?.email) {
        throw new Error("User authentication error");
      }

      // Subaccount not required: funds go to main Paystack account

      // Step 1: Encrypt shipping address
      const shippingObject = {
        streetAddress: orderSummary.buyer_address.street,
        city: orderSummary.buyer_address.city,
        province: orderSummary.buyer_address.province,
        postalCode: orderSummary.buyer_address.postal_code,
        country: orderSummary.buyer_address.country,
        phone: orderSummary.buyer_address.phone,
        additional_info: orderSummary.buyer_address.additional_info,
      };

      console.log("🔐 Encrypting shipping address...");

      const { data: encResult, error: encError } = await supabase.functions.invoke(
        'encrypt-address',
        { body: { object: shippingObject } }
      );

      if (encError || !encResult?.success || !encResult?.data) {
        throw new Error(encError?.message || 'Failed to encrypt shipping address');
      }

      const shipping_address_encrypted = JSON.stringify(encResult.data);

      // Step 2: Create order with correct field names
      const createOrderRequest = {
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

      console.log("📦 Creating order with data:", createOrderRequest);

      // Create the order first
      console.log("📦 Calling create-order function...");

      let orderInvokeResult;
      try {
        orderInvokeResult = await supabase.functions.invoke("create-order", {
          body: createOrderRequest,
        });
        console.log("📎 Raw create-order response:", orderInvokeResult);
      } catch (invokeError) {
        console.error("🚫 Function invoke failed:", invokeError);

        let errorMessage = "Function call failed";
        if (invokeError.message) {
          errorMessage = invokeError.message;
        } else if (typeof invokeError === "string") {
          errorMessage = invokeError;
        } else {
          errorMessage = `Function invoke error: ${JSON.stringify(invokeError)}`;
        }

        // Check for specific Edge Function errors
        if (errorMessage.includes("non-2xx status code")) {
          errorMessage += ". The order service may be temporarily unavailable.";
        }

        throw new Error(errorMessage);
      }

      const { data: orderData, error: orderError } = orderInvokeResult;

      if (orderError) {
        console.error("Order creation error details:", {
          error: orderError.message || orderError,
          errorCode: orderError.code,
          details: orderError.details,
          hint: orderError.hint,
          request: createOrderRequest,
          userId: userId,
        });

        // Extract more specific error information
        let errorMessage = "Failed to create order";

        if (orderError.message) {
          errorMessage = orderError.message;
        } else if (orderError.details) {
          errorMessage = orderError.details;
        } else if (typeof orderError === "string") {
          errorMessage = orderError;
        } else {
          errorMessage = `Order service error: ${JSON.stringify(orderError)}`;
        }

        throw new Error(`Order creation failed: ${errorMessage}`);
      }

      if (!orderData?.success || !orderData?.order?.id) {
        throw new Error("Failed to create order - no order ID returned");
      }

      console.log("Order created successfully:", orderData);

      // Step 1.5: Process affiliate earning if seller was referred
      try {
        console.log("📊 Processing affiliate earning...");
        const { data: affiliateResult, error: affiliateError } = await supabase.functions.invoke(
          "process-affiliate-earning",
          {
            body: {
              book_id: orderSummary.book.id,
              order_id: orderData.order.id,
              seller_id: orderSummary.book.seller_id,
            },
          }
        );

        if (affiliateError) {
          console.warn("⚠️ Affiliate earning processing error (non-blocking):", affiliateError);
        } else if (affiliateResult?.success) {
          console.log("✅ Affiliate earning processed:", affiliateResult.earning);
        } else {
          console.log("���️ Affiliate earning info:", affiliateResult?.message);
        }
      } catch (affiliateException) {
        console.warn("⚠️ Exception processing affiliate earning:", affiliateException);
        // Don't throw - affiliate earning is not critical to order completion
      }

      // Step 2: Initialize payment with the correct parameters for the function
      const paymentRequest = {
        user_id: userId,
        email: userData.user.email,
        total_amount: orderSummary.total_price * 100, // Convert to kobo
        items: [
          {
            book_id: orderSummary.book.id,
            title: orderSummary.book.title,
            price: orderSummary.book_price * 100, // Convert to kobo
            seller_id: orderSummary.book.seller_id,
            condition: orderSummary.book.condition,
          },
        ],
        shipping_address: orderSummary.buyer_address,
        metadata: {
          order_id: orderData.order.id,
          order_data: orderData,
          book_title: orderSummary.book.title,
          delivery_method: orderSummary.delivery.service_name,
          delivery_price: orderSummary.delivery_price * 100, // Convert to kobo
          buyer_id: userId,
        },
      };

      console.log("Initializing payment with data:", paymentRequest);

      // Initialize Paystack payment with correct format
      console.log("📦 Calling initialize-paystack-payment function...");

      let paymentInvokeResult;
      try {
        paymentInvokeResult = await supabase.functions.invoke(
          "initialize-paystack-payment",
          {
            body: paymentRequest,
          },
        );
        console.log(
          "📎 Raw payment initialization response:",
          paymentInvokeResult,
        );
      } catch (invokeError) {
        console.error("🚫 Payment function invoke failed:", invokeError);

        let errorMessage = "Payment function call failed";
        if (invokeError.message) {
          errorMessage = invokeError.message;
        } else if (typeof invokeError === "string") {
          errorMessage = invokeError;
        } else {
          errorMessage = `Function invoke error: ${JSON.stringify(invokeError)}`;
        }

        // Check for specific Edge Function errors
        if (errorMessage.includes("non-2xx status code")) {
          errorMessage +=
            ". The payment service may be temporarily unavailable.";
        }

        throw new Error(errorMessage);
      }

      const { data: paymentData, error: paymentError } = paymentInvokeResult;

      if (paymentError) {
        console.error("Payment initialization error details:", {
          error: paymentError.message || paymentError,
          errorCode: paymentError.code,
          details: paymentError.details,
          hint: paymentError.hint,
          request: paymentRequest,
          orderData: orderData,
        });

        // Extract more specific error information
        let errorMessage = "Failed to initialize payment";

        if (paymentError.message) {
          errorMessage = paymentError.message;
        } else if (paymentError.details) {
          errorMessage = paymentError.details;
        } else if (typeof paymentError === "string") {
          errorMessage = paymentError;
        } else {
          errorMessage = `Payment service error: ${JSON.stringify(paymentError)}`;
        }

        throw new Error(`Payment initialization failed: ${errorMessage}`);
      }

      if (!paymentData) {
        throw new Error("No response received from payment service");
      }

      if (!paymentData.success) {
        throw new Error(paymentData.message || "Payment initialization failed");
      }

      // Use Paystack popup instead of redirect
      console.log("🔍 Payment data received:", paymentData);

      if (!paymentData.data?.reference) {
        console.error("❌ No reference in payment data:", paymentData);
        throw new Error("No payment reference received from Paystack");
      }

      if (paymentData.data?.access_code && paymentData.data?.reference) {
        console.log(
          "Opening Paystack popup with access code:",
          paymentData.data.access_code,
        );

        // Import and use PaystackPop for modal experience
        const { PaystackPaymentService } = await import(
          "@/services/paystackPaymentService"
        );

        // Create order in database first so it appears in purchase history
        // Validate required data before creating order
        if (
          !userData.user.email ||
          !orderSummary.book.seller_id ||
          !orderSummary.book.id ||
          !paymentData.data.reference
        ) {
          throw new Error("Missing required order data");
        }

        console.log("🔄 Creating order with data:", {
          buyer_id: userId,
          buyer_email: userData.user.email,
          seller_id: orderSummary.book.seller_id,
          book_id: orderSummary.book.id,
          paystack_ref: paymentData.data.reference,
          book_price: orderSummary.book_price,
          delivery_price: orderSummary.delivery_price,
          total_price: orderSummary.total_price,
        });

        const { data: createdOrder, error: orderError } = await supabase
          .from("orders")
          .insert([
            {
              // Required fields matching actual schema
              buyer_email: userData.user.email,
              seller_id: orderSummary.book.seller_id,
              amount: Math.round(orderSummary.total_price * 100), // Total amount in kobo
              status: "pending",
              paystack_ref: paymentData.data.reference,

              // Order items as JSONB array
              items: [
                {
                  type: "book",
                  book_id: orderSummary.book.id,
                  book_title: orderSummary.book.title,
                  price: Math.round(orderSummary.book_price * 100), // Book price in kobo
                  quantity: 1,
                  condition: orderSummary.book.condition,
                  seller_id: orderSummary.book.seller_id,
                },
              ],

              // Shipping address as JSONB
              shipping_address: orderSummary.buyer_address,

              // Delivery data as JSONB
              delivery_data: {
                delivery_method: orderSummary.delivery.service_name,
                delivery_price: Math.round(orderSummary.delivery_price * 100), // In kobo
                courier: orderSummary.delivery.courier,
                estimated_days: orderSummary.delivery.estimated_days,
                pickup_address: orderSummary.seller_address,
                delivery_quote: orderSummary.delivery,
              },

              // Additional metadata
              metadata: {
                buyer_id: userId,
                order_data: orderData,
                platform_fee: Math.round(orderSummary.book_price * 0.1 * 100), // 10% platform fee in kobo
                seller_amount: Math.round(orderSummary.book_price * 0.9 * 100), // 90% to seller in kobo
                original_total: orderSummary.total_price, // Keep original prices for reference
                original_book_price: orderSummary.book_price,
                original_delivery_price: orderSummary.delivery_price,
              },
            },
          ])
          .select()
          .single();

        if (orderError) {
          console.error(
            "❌ Failed to create order - Full error object:",
            orderError,
          );
          console.error("❌ Error message:", orderError.message);
          console.error("❌ Error details:", orderError.details);
          console.error("❌ Error code:", orderError.code);
          console.error("❌ Error hint:", orderError.hint);

          let errorMessage = "Unknown database error";
          if (orderError.message) {
            errorMessage = orderError.message;
          } else if (orderError.details) {
            errorMessage = orderError.details;
          }

          // Add more context for common errors
          if (orderError.code === "23505") {
            errorMessage = `Duplicate order reference: ${errorMessage}`;
          } else if (orderError.code === "23502") {
            errorMessage = `Missing required field: ${errorMessage}`;
          } else if (orderError.code === "23503") {
            errorMessage = `Invalid reference (foreign key): ${errorMessage}`;
          }

          throw new Error(`Failed to create order: ${errorMessage}`);
        }

        console.log("✅ Order created in database:", createdOrder);

        try {
          const result = await PaystackPaymentService.initializePayment({
            email: userData.user.email,
            amount: orderSummary.total_price * 100,
            reference: paymentData.data.reference,
            metadata: {
              order_id: createdOrder.id,
              order_data: orderData,
              book_title: orderSummary.book.title,
              delivery_method: orderSummary.delivery.service_name,
              buyer_id: userId,
            },
          });

          if (result.cancelled) {
            console.log("❌ Paystack payment cancelled by user");
            toast.warning("Payment cancelled");
            setProcessing(false);
            return;
          }

          console.log("✅ Paystack payment successful:", result);

          // Extract book item data for processing
          const bookItem = createdOrder.items[0]; // Get the book item

          // Update order status to paid
          const { error: updateError } = await supabase
            .from("orders")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              metadata: {
                ...createdOrder.metadata,
                paystack_data: result,
              },
            })
            .eq("id", createdOrder.id);

          if (updateError) {
            console.warn("Failed to update order status:", updateError);
          }


          // Create order confirmation data using the database order
          const orderConfirmation = {
            order_id: createdOrder.id,
            payment_reference: result.reference,
            book_id: bookItem.book_id,
            seller_id: createdOrder.seller_id,
            buyer_id: createdOrder.metadata.buyer_id,
            book_title: bookItem.book_title,
            book_price: bookItem.price / 100, // Convert back from kobo to rands
            delivery_method: createdOrder.delivery_data.delivery_method,
            delivery_price: createdOrder.delivery_data.delivery_price / 100, // Convert back from kobo
            platform_fee: 20,
            total_paid: createdOrder.amount / 100, // Convert back from kobo
            created_at: createdOrder.created_at,
            status: "paid",
          };

          // Call the success handler to show Step4Confirmation
          onPaymentSuccess(orderConfirmation);
          toast.success("Payment completed successfully! 🎉");
        } catch (paymentError) {
          console.error("Payment processing error:", paymentError);

          // Clean up pending order if payment failed/cancelled
          const { error: cleanupError } = await supabase
            .from("orders")
            .update({
              status: "cancelled",
              metadata: {
                ...createdOrder.metadata,
                cancelled_at: new Date().toISOString(),
                cancellation_reason: "payment_failed",
                error: paymentError.message,
              },
            })
            .eq("id", createdOrder.id);

          if (cleanupError) {
            console.warn("Failed to update cancelled order:", cleanupError);
          }

          let errorMessage = "Payment failed";
          if (paymentError.message?.includes("cancelled")) {
            errorMessage = "Payment cancelled";
            toast.warning(errorMessage);
          } else if (
            paymentError.message?.includes("popup") ||
            paymentError.message?.includes("blocked")
          ) {
            errorMessage =
              "Payment popup was blocked. Please allow popups and try again.";
            toast.error(errorMessage);
          } else if (paymentError.message?.includes("library not available")) {
            errorMessage =
              "Payment system not available. Please refresh the page and try again.";
            toast.error(errorMessage);
          } else {
            errorMessage = paymentError.message || "Payment failed";
            toast.error(errorMessage);
          }

          onPaymentError(errorMessage);
          setProcessing(false);
        }
      } else {
        console.error("Payment response:", paymentData);
        throw new Error("No payment access code received from Paystack");
      }
    } catch (err) {
      console.error("Payment initialization error:", err);

      let errorMessage = "Payment failed";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else {
        errorMessage = `Payment error: ${JSON.stringify(err)}`;
      }

      setError(errorMessage);
      onPaymentError(errorMessage);

      // Show user-friendly error message
      if (errorMessage.includes("temporarily unavailable")) {
        toast.error(
          "Payment service is temporarily unavailable. Please try again in a moment.",
        );
      } else if (errorMessage.includes("Missing required fields")) {
        toast.error(
          "Payment setup error. Please refresh the page and try again.",
        );
      } else {
        const safeErrorMessage = typeof errorMessage === 'string' ? errorMessage : String(errorMessage || 'Unknown error');
        const finalSafeMessage = safeErrorMessage === '[object Object]' ? 'Payment processing failed' : safeErrorMessage;
        toast.error(`Payment failed: ${finalSafeMessage}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment</h1>
        <p className="text-gray-600">Review and complete your purchase</p>
      </div>

      {/* Order Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Book Details */}
          <div className="flex items-center gap-3">
            {orderSummary.book.image_url && (
              <img
                src={orderSummary.book.image_url}
                alt={orderSummary.book.title}
                className="w-16 h-20 object-cover rounded border"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            )}
            <div className="flex-1">
              <h3 className="font-medium">{orderSummary.book.title}</h3>
              <p className="text-sm text-gray-600">
                {orderSummary.book.author}
              </p>
              <p className="text-sm text-gray-500">
                {orderSummary.book.condition}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                R{orderSummary.book_price.toFixed(2)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Delivery Details */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded">
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">
                {orderSummary.delivery.service_name}
              </p>
              <p className="text-sm text-gray-600">
                {orderSummary.delivery.description}
              </p>
              <p className="text-sm text-gray-500">
                Estimated: {orderSummary.delivery.estimated_days} business day
                {orderSummary.delivery.estimated_days > 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                R{orderSummary.delivery_price.toFixed(2)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Platform Processing Fee */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">
                Platform Processing Fee
              </p>
              <p className="text-sm text-gray-600">
                Secure payment processing and order management
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                R20.00
              </p>
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span className="text-green-600">
              R{orderSummary.total_price.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Address Card */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Address</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <p>{orderSummary.buyer_address.street}</p>
            <p>
              {orderSummary.buyer_address.city},{" "}
              {orderSummary.buyer_address.province}{" "}
              {orderSummary.buyer_address.postal_code}
            </p>
            <p>{orderSummary.buyer_address.country}</p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <PaymentErrorHandler
          error={error}
          onRetry={handleRetryPayment}
          onContactSupport={handleContactSupport}
          onBack={onBack}
        />
      )}

      {/* Payment Information */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium">Secure Payment</h3>
              <p className="text-sm text-gray-600">
                Powered by BobPay - Your payment information is encrypted and
                secure
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <ul className="list-disc list-inside space-y-1">
              <li>Payment will be processed immediately</li>
              <li>You'll receive an email confirmation</li>
              <li>Seller will be notified to prepare shipment</li>
              <li>You can track your order in your account</li>
            </ul>
          </div>
        </CardContent>
      </Card>



      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6">
        <Button variant="outline" onClick={onBack} disabled={processing}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={handleBobPayPayment}
          disabled={processing}
          className="w-full px-8 py-3 text-lg"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Complete Payment
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Step3Payment;
