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

    console.log("📋 Processing order creation:", requestData);

    // Validate required fields
    if (!requestData.buyer_id || !requestData.seller_id || !requestData.book_id || !requestData.delivery_option || !requestData.shipping_address_encrypted) {
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
    const { data: buyer, error: buyerError } = await supabase
      .from("profiles")
      .select("full_name, name, email, phone_number")
      .eq("id", requestData.buyer_id)
      .single();

    if (buyerError || !buyer) {
      return new Response(
        JSON.stringify({ success: false, error: "Buyer not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch seller info from profiles (including pickup_address_encrypted)
    const { data: seller, error: sellerError } = await supabase
      .from("profiles")
      .select("full_name, name, email, phone_number, pickup_address_encrypted")
      .eq("id", requestData.seller_id)
      .single();

    if (sellerError || !seller) {
      return new Response(
        JSON.stringify({ success: false, error: "Seller not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch book info
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("*")
      .eq("id", requestData.book_id)
      .single();

    if (bookError || !book) {
      return new Response(
        JSON.stringify({ success: false, error: "Book not found" }),
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

    // Reserve the book
    const { error: updateBookError } = await supabase
      .from("books")
      .update({
        sold: true,
        available_quantity: book.available_quantity - 1,
        sold_quantity: book.sold_quantity + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", requestData.book_id);

    if (updateBookError) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to reserve book" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique order_id
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Create order with denormalized data from profiles
    const orderData = {
      order_id: orderId,
      buyer_id: requestData.buyer_id,
      seller_id: requestData.seller_id,
      book_id: requestData.book_id,
      buyer_full_name: buyer.full_name || buyer.name || '',
      seller_full_name: seller.full_name || seller.name || '',
      buyer_email: buyer.email || '',
      seller_email: seller.email || '',
      buyer_phone_number: buyer.phone_number || '',
      seller_phone_number: seller.phone_number || '',
      pickup_address_encrypted: seller.pickup_address_encrypted || '',
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

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error("Failed to create order:", orderError);
      // Rollback book reservation
      await supabase
        .from("books")
        .update({
          sold: false,
          available_quantity: book.available_quantity,
          sold_quantity: book.sold_quantity
        })
        .eq("id", requestData.book_id);

      return new Response(
        JSON.stringify({ success: false, error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Order created successfully:", (order as any).id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order created successfully",
        order: {
          id: (order as any).id,
          status: (order as any).status,
          payment_status: (order as any).payment_status,
          total_amount: (order as any).total_amount
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error creating order:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
