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
  shipping_address_encrypted: string;
  payment_reference?: string;
  selected_courier_slug?: string;
  selected_service_code?: string;
  selected_courier_name?: string;
  selected_service_name?: string;
  selected_shipping_cost?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: CreateOrderRequest = await req.json();

    console.log("📋 Processing order creation:", {
      buyer_id: requestData.buyer_id,
      seller_id: requestData.seller_id,
      book_id: requestData.book_id,
      delivery_option: requestData.delivery_option
    });

    // Validate required fields
    if (!requestData.buyer_id || !requestData.seller_id || !requestData.book_id || !requestData.delivery_option || !requestData.shipping_address_encrypted) {
      console.error("❌ Missing required fields");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: buyer_id, seller_id, book_id, delivery_option, shipping_address_encrypted"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch buyer info from profiles
    console.log("🔍 Fetching buyer profile:", requestData.buyer_id);
    const { data: buyer, error: buyerError } = await supabase
      .from("profiles")
      .select("id, full_name, name, first_name, last_name, email, phone_number")
      .eq("id", requestData.buyer_id)
      .single();

    if (buyerError) {
      console.error("❌ Buyer fetch error:", buyerError);
      return new Response(
        JSON.stringify({ success: false, error: "Buyer not found: " + buyerError.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Buyer found:", {
      id: buyer?.id,
      full_name: buyer?.full_name,
      name: buyer?.name,
      email: buyer?.email,
      phone: buyer?.phone_number
    });

    // Fetch seller info from profiles (including pickup_address_encrypted)
    console.log("🔍 Fetching seller profile:", requestData.seller_id);
    const { data: seller, error: sellerError } = await supabase
      .from("profiles")
      .select("id, full_name, name, first_name, last_name, email, phone_number, pickup_address_encrypted")
      .eq("id", requestData.seller_id)
      .single();

    if (sellerError) {
      console.error("❌ Seller fetch error:", sellerError);
      return new Response(
        JSON.stringify({ success: false, error: "Seller not found: " + sellerError.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Seller found:", {
      id: seller?.id,
      full_name: seller?.full_name,
      name: seller?.name,
      email: seller?.email,
      phone: seller?.phone_number,
      has_pickup_address: !!seller?.pickup_address_encrypted
    });

    // Fetch book info
    console.log("🔍 Fetching book:", requestData.book_id);
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("*")
      .eq("id", requestData.book_id)
      .single();

    if (bookError) {
      console.error("❌ Book fetch error:", bookError);
      return new Response(
        JSON.stringify({ success: false, error: "Book not found: " + bookError.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Book found:", {
      id: book?.id,
      title: book?.title,
      sold: book?.sold,
      available_quantity: book?.available_quantity,
      price: book?.price
    });

    // Check if book is available
    if (book.sold || book.available_quantity < 1) {
      console.error("❌ Book is not available");
      return new Response(
        JSON.stringify({ success: false, error: "Book is not available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Note: Book will be marked as sold only AFTER payment is confirmed by the webhook
    // This prevents marking books as sold for orders that fail payment
    console.log("📦 Order created - Book will be marked as sold after payment confirmation");

    // Generate unique order_id
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Prepare denormalized data with fallbacks
    const buyerFullName = buyer.full_name || buyer.name || `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim() || 'Unknown Buyer';
    const sellerFullName = seller.full_name || seller.name || `${seller.first_name || ''} ${seller.last_name || ''}`.trim() || 'Unknown Seller';
    const buyerEmail = buyer.email || '';
    const sellerEmail = seller.email || '';
    const buyerPhone = buyer.phone_number || '';
    const sellerPhone = seller.phone_number || '';
    const pickupAddress = seller.pickup_address_encrypted || '';

    console.log("📝 Preparing order data:", {
      buyer_full_name: buyerFullName,
      seller_full_name: sellerFullName,
      buyer_email: buyerEmail,
      seller_email: sellerEmail,
      buyer_phone: buyerPhone ? '***' : 'missing',
      seller_phone: sellerPhone ? '***' : 'missing',
      pickup_address: pickupAddress ? 'present' : 'missing'
    });

    // Create order with denormalized data from profiles
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
      shipping_address_encrypted: requestData.shipping_address_encrypted,
      delivery_option: requestData.delivery_option,
      delivery_data: {
        delivery_option: requestData.delivery_option,
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
      items: [{
        book_id: book.id,
        title: book.title,
        author: book.author,
        price: book.price,
        condition: book.condition
      }]
    };

    console.log("💾 Inserting order into database...");
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error("❌ Failed to create order:", orderError);
      console.error("Order data that failed:", JSON.stringify(orderData, null, 2));

      // Rollback book reservation
      console.log("🔄 Rolling back book reservation...");
      await supabase
        .from("books")
        .update({
          sold: false,
          available_quantity: book.available_quantity,
          sold_quantity: book.sold_quantity
        })
        .eq("id", requestData.book_id);

      return new Response(
        JSON.stringify({ success: false, error: "Failed to create order: " + orderError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Order created successfully:", {
      id: order.id,
      order_id: order.order_id,
      buyer_email: order.buyer_email,
      seller_email: order.seller_email,
      buyer_full_name: order.buyer_full_name,
      seller_full_name: order.seller_full_name
    });

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
          seller_email: order.seller_email
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error creating order:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
