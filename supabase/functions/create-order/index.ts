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

    // Processing order creation - sensitive data not logged

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

    // Helper to ensure book is marked sold and quantities adjusted only once
    async function ensureBookMarkedSold(bookId: string) {
      try {
        const { data: bookRow, error: bookRowError } = await supabase
          .from('books')
          .select('id, sold, available_quantity, sold_quantity')
          .eq('id', bookId)
          .maybeSingle();

        if (bookRowError) {
          console.warn('⚠️ Failed to fetch book for ensureBookMarkedSold:', bookRowError);
          return;
        }

        if (!bookRow) return;

        if (!bookRow.sold) {
          // Only decrement available_quantity if it's > 0
          const newAvailable = (typeof bookRow.available_quantity === 'number' && bookRow.available_quantity > 0) ? bookRow.available_quantity - 1 : 0;
          const newSoldQuantity = (bookRow.sold_quantity || 0) + 1;

          const { error: markError } = await supabase
            .from('books')
            .update({ sold: true, available_quantity: newAvailable, sold_quantity: newSoldQuantity, updated_at: new Date().toISOString() })
            .eq('id', bookId);

          if (markError) {
            console.warn('⚠️ Failed to mark book as sold in ensureBookMarkedSold:', markError);
          } else {
            console.log('✅ ensureBookMarkedSold: book updated');
          }
        }
      } catch (e) {
        console.warn('⚠️ ensureBookMarkedSold unexpected error:', e);
      }
    }

    // If a payment_reference was provided, check for existing order to make this operation idempotent
    if (requestData.payment_reference) {
      // Checking for existing order by payment reference
      const { data: existingByRef, error: existingRefError } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_reference', requestData.payment_reference)
        .maybeSingle();

      if (existingRefError) {
        console.warn('⚠️ Failed to query existing order by payment_reference:', existingRefError);
      }

      if (existingByRef) {
        console.log('ℹ️ Existing order found by payment_reference. Ensuring book is marked sold and returning existing order.');
        await ensureBookMarkedSold(requestData.book_id);

        return new Response(
          JSON.stringify({ success: true, message: 'Order already exists', order: existingByRef }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Additionally check for an existing order for this buyer/seller/book combination in active states
    console.log('🔎 Checking for existing active order for buyer/seller/book');
    const { data: existingCombo, error: existingComboError } = await supabase
      .from('orders')
      .select('*')
      .eq('buyer_id', requestData.buyer_id)
      .eq('seller_id', requestData.seller_id)
      .eq('book_id', requestData.book_id)
      .in('status', ['pending', 'pending_commit', 'paid', 'committed'])
      .maybeSingle();

    if (existingComboError) {
      console.warn('⚠️ Failed to query existing order by combo:', existingComboError);
    }

    if (existingCombo) {
      console.log('ℹ️ Existing active order found for combo. Ensuring book is marked sold and returning existing order.');
      await ensureBookMarkedSold(requestData.book_id);

      return new Response(
        JSON.stringify({ success: true, message: 'Order already exists', order: existingCombo }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Buyer profile retrieved

    // Fetch seller info from profiles (including pickup_address_encrypted)
    // Fetching seller profile
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

    // Seller profile retrieved

    // Fetch book info
    // Fetching book details
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

    // Book details retrieved

    // Step 2: Check if book is available (BEFORE marking sold)
    if (book.sold || book.available_quantity < 1) {
      console.error("❌ Book is not available");
      return new Response(
        JSON.stringify({ success: false, error: "Book is not available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ⭐ Step 3: MARK BOOK AS SOLD (THE CRITICAL UPDATE)
    // This happens BEFORE order insertion to ensure atomicity
    console.log("📝 Marking book as sold...");
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
      console.error("❌ Failed to mark book as sold:", updateBookError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to reserve book" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Book marked as sold:", { id: book.id, title: book.title });

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

    // Preparing order data

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
      items: [{ book_id: book.id, title: book.title, author: book.author, price: book.price, condition: book.condition }]
    };

    // Inserting order into database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error("❌ Failed to create order:", orderError);
      console.error("Order data that failed:", JSON.stringify(orderData, null, 2));

      // ROLLBACK: Undo the book marking
      console.log("🔄 Rolling back book marking...");
      const { error: rollbackError } = await supabase
        .from("books")
        .update({ sold: false, available_quantity: book.available_quantity, sold_quantity: book.sold_quantity, updated_at: new Date().toISOString() })
        .eq("id", requestData.book_id);

      if (rollbackError) {
        console.error("❌ Failed to rollback book marking:", rollbackError);
      } else {
        console.log("✅ Book marking rolled back successfully");
      }

      return new Response(
        JSON.stringify({ success: false, error: "Failed to create order: " + orderError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Order created successfully

    return new Response(
      JSON.stringify({ success: true, message: "Order created successfully", order: { id: order.id, order_id: order.order_id, status: order.status, payment_status: order.payment_status, total_amount: order.total_amount, buyer_email: order.buyer_email, seller_email: order.seller_email } }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error creating order:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
