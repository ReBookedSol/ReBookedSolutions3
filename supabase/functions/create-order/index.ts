import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '';

interface CreateOrderRequest {
  buyer_id: string;
  seller_id: string;
  book_id: string;
  delivery_option: string;
  shipping_address_encrypted?: string;
  payment_reference?: string;
  selected_courier_slug?: string;
  selected_service_code?: string;
  selected_courier_name?: string;
  selected_service_name?: string;
  selected_shipping_cost?: number;
  // Locker support
  pickup_type?: 'door' | 'locker';
  pickup_locker_data?: any;
  pickup_locker_location_id?: number;
  pickup_locker_provider_slug?: string;
  delivery_type?: 'door' | 'locker';
  delivery_locker_data?: any;
  delivery_locker_location_id?: number;
  delivery_locker_provider_slug?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: CreateOrderRequest = await req.json();

    // Validate required fields
    if (!requestData.buyer_id || !requestData.seller_id || !requestData.book_id || !requestData.delivery_option) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: buyer_id, seller_id, book_id, delivery_option"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Helper to ensure book is marked sold and quantities adjusted only once
    async function ensureBookMarkedSold(bookId: string) {
      try {
        const { data: bookRow, error: bookRowError } = await supabase
          .from('books')
          .select('id, sold, available_quantity, sold_quantity')
          .eq('id', bookId)
          .maybeSingle();

        if (bookRowError) {
          return;
        }

        if (!bookRow) return;

        if (!bookRow.sold) {
          const newAvailable = (typeof bookRow.available_quantity === 'number' && bookRow.available_quantity > 0) ? bookRow.available_quantity - 1 : 0;
          const newSoldQuantity = (bookRow.sold_quantity || 0) + 1;

          const { error: markError } = await supabase
            .from('books')
            .update({ sold: true, available_quantity: newAvailable, sold_quantity: newSoldQuantity, updated_at: new Date().toISOString() })
            .eq('id', bookId);
        }
      } catch (e) {
        // Error marking book as sold
      }
    }

    // If a payment_reference was provided, check for existing order to make this operation idempotent
    if (requestData.payment_reference) {
      const { data: existingByRef, error: existingRefError } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_reference', requestData.payment_reference)
        .maybeSingle();

      if (existingByRef) {
        await ensureBookMarkedSold(requestData.book_id);

        return new Response(
          JSON.stringify({ success: true, message: 'Order already exists', order: existingByRef }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check for existing active order for this buyer/seller/book combination
    const { data: existingCombo, error: existingComboError } = await supabase
      .from('orders')
      .select('*')
      .eq('buyer_id', requestData.buyer_id)
      .eq('seller_id', requestData.seller_id)
      .eq('book_id', requestData.book_id)
      .in('status', ['pending', 'pending_commit', 'paid', 'committed'])
      .maybeSingle();

    if (existingCombo) {
      await ensureBookMarkedSold(requestData.book_id);

      return new Response(
        JSON.stringify({ success: true, message: 'Order already exists', order: existingCombo }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch buyer info from profiles
    const { data: buyer, error: buyerError } = await supabase
      .from("profiles")
      .select("id, full_name, name, first_name, last_name, email, phone_number, preferred_delivery_locker_data, preferred_delivery_locker_location_id, preferred_delivery_locker_provider_slug, shipping_address_encrypted")
      .eq("id", requestData.buyer_id)
      .single();

    if (buyerError) {
      return new Response(
        JSON.stringify({ success: false, error: "Buyer not found: " + buyerError.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch seller info from profiles
    const { data: seller, error: sellerError } = await supabase
      .from("profiles")
      .select("id, full_name, name, first_name, last_name, email, phone_number, pickup_address_encrypted, preferred_pickup_locker_data, preferred_pickup_locker_location_id, preferred_pickup_locker_provider_slug")
      .eq("id", requestData.seller_id)
      .single();

    if (sellerError) {
      return new Response(
        JSON.stringify({ success: false, error: "Seller not found: " + sellerError.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch book info
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("*")
      .eq("id", requestData.book_id)
      .single();

    if (bookError) {
      return new Response(
        JSON.stringify({ success: false, error: "Book not found: " + bookError.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if book is available
    if (book.sold || book.available_quantity < 1) {
      return new Response(
        JSON.stringify({ success: false, error: "Book is not available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark book as sold
    const { error: updateBookError } = await supabase
      .from("books")
      .update({
        sold: true,
        available_quantity: book.available_quantity - 1,
        sold_quantity: (book.sold_quantity || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", requestData.book_id);

    if (updateBookError) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to reserve book" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine pickup type and data
    const pickupType = requestData.pickup_type || 'door';
    let pickupLockerData = null;
    let pickupLockerLocationId = null;
    let pickupLockerProviderSlug = null;

    if (pickupType === 'locker') {
      // Use provided locker info or fall back to seller's preferred
      pickupLockerData = requestData.pickup_locker_data || seller.preferred_pickup_locker_data;
      pickupLockerLocationId = requestData.pickup_locker_location_id || seller.preferred_pickup_locker_location_id;
      pickupLockerProviderSlug = requestData.pickup_locker_provider_slug || seller.preferred_pickup_locker_provider_slug;
    }

    // Determine delivery type and data
    const deliveryType = requestData.delivery_type || 'door';
    let deliveryLockerData = null;
    let deliveryLockerLocationId = null;
    let deliveryLockerProviderSlug = null;
    let shippingAddressEncrypted = requestData.shipping_address_encrypted;

    if (deliveryType === 'locker') {
      // Use provided locker info or fall back to buyer's preferred
      deliveryLockerData = requestData.delivery_locker_data || buyer.preferred_delivery_locker_data;
      deliveryLockerLocationId = requestData.delivery_locker_location_id || buyer.preferred_delivery_locker_location_id;
      deliveryLockerProviderSlug = requestData.delivery_locker_provider_slug || buyer.preferred_delivery_locker_provider_slug;
    } else {
      // For door delivery, use provided address or fall back to buyer's stored address
      shippingAddressEncrypted = shippingAddressEncrypted || buyer.shipping_address_encrypted;
    }

    // Validate we have required delivery information
    if (deliveryType === 'locker' && !deliveryLockerLocationId) {
      // Rollback book marking
      await supabase.from("books").update({ 
        sold: false, 
        available_quantity: book.available_quantity, 
        sold_quantity: book.sold_quantity 
      }).eq("id", requestData.book_id);
      
      return new Response(
        JSON.stringify({ success: false, error: "Locker delivery requires locker location" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (deliveryType === 'door' && !shippingAddressEncrypted) {
      // Rollback book marking
      await supabase.from("books").update({ 
        sold: false, 
        available_quantity: book.available_quantity, 
        sold_quantity: book.sold_quantity 
      }).eq("id", requestData.book_id);
      
      return new Response(
        JSON.stringify({ success: false, error: "Door delivery requires shipping address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique order_id
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Prepare denormalized data
    const buyerFullName = buyer.full_name || buyer.name || `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim() || 'Unknown Buyer';
    const sellerFullName = seller.full_name || seller.name || `${seller.first_name || ''} ${seller.last_name || ''}`.trim() || 'Unknown Seller';
    const buyerEmail = buyer.email || '';
    const sellerEmail = seller.email || '';
    const buyerPhone = buyer.phone_number || '';
    const sellerPhone = seller.phone_number || '';
    const pickupAddress = seller.pickup_address_encrypted || '';

    // Create order with locker support
    const orderData = {
      order_id: orderId,
      buyer_id: requestData.buyer_id,
      seller_id: requestData.seller_id,
      book_id: requestData.book_id,
      buyer_full_name: buyerFullName,
      seller_full_name: sellerFullName,
      buyer_email: buyerEmail,
      seller_email: sellerEmail,
      buyer_phone_number: buyerPhone,
      seller_phone_number: sellerPhone,
      pickup_address_encrypted: pickupAddress,
      shipping_address_encrypted: shippingAddressEncrypted,
      delivery_option: requestData.delivery_option,
      // Pickup locker fields
      pickup_type: pickupType,
      pickup_locker_data: pickupLockerData,
      pickup_locker_location_id: pickupLockerLocationId,
      pickup_locker_provider_slug: pickupLockerProviderSlug,
      // Delivery locker fields
      delivery_type: deliveryType,
      delivery_locker_data: deliveryLockerData,
      delivery_locker_location_id: deliveryLockerLocationId,
      delivery_locker_provider_slug: deliveryLockerProviderSlug,
      delivery_data: {
        delivery_option: requestData.delivery_option,
        delivery_type: deliveryType,
        pickup_type: pickupType,
        requested_at: new Date().toISOString(),
        selected_courier_slug: requestData.selected_courier_slug,
        selected_service_code: requestData.selected_service_code,
        selected_courier_name: requestData.selected_courier_name,
        selected_service_name: requestData.selected_service_name,
        selected_shipping_cost: requestData.selected_shipping_cost,
      },
      payment_reference: requestData.payment_reference,
      paystack_reference: requestData.payment_reference,
      selected_courier_slug: requestData.selected_courier_slug,
      selected_service_code: requestData.selected_service_code,
      selected_courier_name: requestData.selected_courier_name,
      selected_service_name: requestData.selected_service_name,
      selected_shipping_cost: requestData.selected_shipping_cost,
      status: "pending",
      payment_status: "pending",
      amount: Math.round(book.price * 100),
      total_amount: book.price,
      items: [{ book_id: book.id, title: book.title, author: book.author, price: book.price, condition: book.condition }]
    };

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      // ROLLBACK: Undo the book marking
      await supabase
        .from("books")
        .update({ sold: false, available_quantity: book.available_quantity, sold_quantity: book.sold_quantity, updated_at: new Date().toISOString() })
        .eq("id", requestData.book_id);

      return new Response(
        JSON.stringify({ success: false, error: "Failed to create order: " + orderError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Order created successfully", 
        order: { 
          id: order.id, 
          order_id: order.order_id, 
          status: order.status, 
          payment_status: order.payment_status, 
          total_amount: order.total_amount, 
          buyer_email: order.buyer_email, 
          seller_email: order.seller_email,
          pickup_type: order.pickup_type,
          delivery_type: order.delivery_type
        } 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
