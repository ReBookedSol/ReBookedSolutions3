import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    let body = null;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { order_id } = body || {};
    if (!order_id) throw new Error("Order ID is required");

    console.log(`[commit-to-sale] Processing commitment for order ${order_id} by user ${user.id}`);

    // Fetch the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) throw new Error("Order not found");

    // Verify seller is committing to their own order
    if (order.seller_id !== user.id) {
      throw new Error("Only the seller can commit to this order");
    }

    // Allow both 'paid' and 'pending' status
    if (!["paid", "pending"].includes(order.status)) {
      throw new Error(`Order cannot be committed in status: ${order.status}`);
    }

    // Ensure items is an array
    let items = [];
    try {
      items = Array.isArray(order.items) ? order.items : (order.items ? JSON.parse(order.items) : []);
    } catch {
      items = [];
    }

    // Determine pickup and delivery types from order
    const pickupType = order.pickup_type || 'door';
    const deliveryType = order.delivery_type || 'door';

    console.log(`[commit-to-sale] Shipment type: ${pickupType} → ${deliveryType}`);

    // Get seller pickup information based on type
    let pickupData: any = null;

    if (pickupType === 'locker') {
      // Locker pickup - get locker details from order
      console.log(`[commit-to-sale] Getting seller locker pickup info from order`);

      const pickupLocationId = order.pickup_locker_location_id;
      const pickupProviderSlug = order.pickup_locker_provider_slug;
      const pickupLockerData = order.pickup_locker_data;

      if (pickupLocationId && pickupProviderSlug) {
        pickupData = {
          type: 'locker',
          location_id: pickupLocationId,
          provider_slug: pickupProviderSlug,
          locker_data: pickupLockerData
        };
      } else if (pickupLockerData?.id && pickupLockerData?.provider_slug) {
        // Fallback to locker_data JSON
        pickupData = {
          type: 'locker',
          location_id: pickupLockerData.id,
          provider_slug: pickupLockerData.provider_slug,
          locker_data: pickupLockerData
        };
      } else {
        // Fallback to seller profile for missing locker info
        console.log(`[commit-to-sale] Locker info incomplete, checking seller profile`);
        const { data: sellerProfile } = await supabase
          .from("profiles")
          .select("preferred_delivery_locker_location_id, preferred_delivery_locker_provider_slug, preferred_delivery_locker_data")
          .eq("id", order.seller_id)
          .single();

        if (sellerProfile?.preferred_delivery_locker_location_id) {
          pickupData = {
            type: 'locker',
            location_id: sellerProfile.preferred_delivery_locker_location_id,
            provider_slug: sellerProfile.preferred_delivery_locker_provider_slug || 'pargo',
            locker_data: sellerProfile.preferred_delivery_locker_data
          };
        } else {
          throw new Error("Seller locker pickup information not found");
        }
      }
    } else {
      // Door pickup - get physical address
      console.log(`[commit-to-sale] Getting seller door pickup address from order`);
      let pickupAddress = null;

      try {
        if (order.pickup_address_encrypted) {
          const pickupResp = await supabase.functions.invoke("decrypt-address", {
            body: {
              table: "orders",
              target_id: order_id,
              address_type: "pickup"
            },
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (pickupResp.data?.success) {
            pickupAddress = pickupResp.data.data;
          }
        }
      } catch (e) {
        console.warn("[commit-to-sale] pickup address decryption failed:", e);
      }

      // Fallback to book-level pickup address if not on order
      if (!pickupAddress && order.book_id) {
        try {
          console.log(`[commit-to-sale] Falling back to book (${order.book_id}) pickup address`);
          const { data: bookRow } = await supabase
            .from("books")
            .select("pickup_address_encrypted")
            .eq("id", order.book_id)
            .maybeSingle();

          if (bookRow?.pickup_address_encrypted) {
            const bookPickupResp = await supabase.functions.invoke("decrypt-address", {
              body: {
                table: "books",
                target_id: order.book_id,
                address_type: "pickup"
              },
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            if (bookPickupResp.data?.success) {
              pickupAddress = bookPickupResp.data.data;
            }
          }
        } catch (e) {
          console.warn("[commit-to-sale] book-level pickup address fallback failed:", e);
        }
      }

      // Final fallback to seller profile
      if (!pickupAddress) {
        console.log(`[commit-to-sale] Using seller profile pickup address`);
        const { data: sellerProfile } = await supabase
          .from("profiles")
          .select("pickup_address_encrypted")
          .eq("id", order.seller_id)
          .single();

        if (sellerProfile?.pickup_address_encrypted) {
          const profilePickupResp = await supabase.functions.invoke("decrypt-address", {
            body: {
              table: "profiles",
              target_id: order.seller_id,
              address_type: "pickup"
            },
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (profilePickupResp.data?.success) {
            pickupAddress = profilePickupResp.data.data;
          }
        }
      }

      if (!pickupAddress) throw new Error("Seller pickup address not found");

      pickupData = {
        type: 'door',
        address: pickupAddress
      };
    }

    // Get buyer delivery information based on type
    let deliveryData: any = null;

    if (deliveryType === 'locker') {
      // Locker delivery - get locker details from order
      console.log(`[commit-to-sale] Getting buyer locker delivery info from order`);

      const deliveryLocationId = order.delivery_locker_location_id;
      const deliveryProviderSlug = order.delivery_locker_provider_slug;
      const deliveryLockerData = order.delivery_locker_data;

      if (deliveryLocationId && deliveryProviderSlug) {
        deliveryData = {
          type: 'locker',
          location_id: deliveryLocationId,
          provider_slug: deliveryProviderSlug,
          locker_data: deliveryLockerData
        };
      } else if (deliveryLockerData?.id && deliveryLockerData?.provider_slug) {
        // Fallback to locker_data JSON
        deliveryData = {
          type: 'locker',
          location_id: deliveryLockerData.id,
          provider_slug: deliveryLockerData.provider_slug,
          locker_data: deliveryLockerData
        };
      } else {
        // Fallback to buyer profile for missing locker info
        console.log(`[commit-to-sale] Locker info incomplete, checking buyer profile`);
        const { data: buyerProfile } = await supabase
          .from("profiles")
          .select("preferred_delivery_locker_location_id, preferred_delivery_locker_provider_slug, preferred_delivery_locker_data")
          .eq("id", order.buyer_id)
          .maybeSingle();

        if (buyerProfile?.preferred_delivery_locker_location_id) {
          deliveryData = {
            type: 'locker',
            location_id: buyerProfile.preferred_delivery_locker_location_id,
            provider_slug: buyerProfile.preferred_delivery_locker_provider_slug || 'pargo',
            locker_data: buyerProfile.preferred_delivery_locker_data
          };
        } else {
          throw new Error("Buyer locker delivery information not found");
        }
      }
    } else {
      // Door delivery - get physical address
      console.log(`[commit-to-sale] Getting buyer door delivery address from order`);
      let shippingAddress = null;

      try {
        if (order.shipping_address_encrypted) {
          const shippingResp = await supabase.functions.invoke("decrypt-address", {
            body: {
              table: "orders",
              target_id: order_id,
              address_type: "shipping"
            },
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (shippingResp.data?.success) {
            shippingAddress = shippingResp.data.data;
          }
        }
      } catch (e) {
        console.warn("[commit-to-sale] shipping address decryption failed:", e);
      }

      // Fallback to buyer profile
      if (!shippingAddress && order.buyer_id) {
        console.log(`[commit-to-sale] Using buyer profile shipping address`);
        const { data: buyerProfile } = await supabase
          .from("profiles")
          .select("shipping_address_encrypted")
          .eq("id", order.buyer_id)
          .maybeSingle();

        if (buyerProfile?.shipping_address_encrypted) {
          const profileShippingResp = await supabase.functions.invoke("decrypt-address", {
            body: {
              table: "profiles",
              target_id: order.buyer_id,
              address_type: "shipping"
            },
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (profileShippingResp.data?.success) {
            shippingAddress = profileShippingResp.data.data;
          }
        }
      }

      if (!shippingAddress) throw new Error("Buyer shipping address not found");

      deliveryData = {
        type: 'door',
        address: shippingAddress
      };
    }

    // Get contact information from order (stored at order creation time)
    const sellerName = order.seller_full_name || "Seller";
    const buyerName = order.buyer_full_name || "Customer";
    const sellerEmail = order.seller_email || "seller@example.com";
    const buyerEmail = order.buyer_email || "buyer@example.com";
    const sellerPhone = order.seller_phone_number || "0000000000";
    const buyerPhone = order.buyer_phone_number || "0000000000";

    // Verify buyer selected a courier during checkout
    if (!order.selected_courier_slug || !order.selected_service_code) {
      throw new Error("No courier selected during checkout");
    }

    console.log(`[commit-to-sale] Using buyer's selected courier: ${order.selected_courier_name} - ${order.selected_service_name}`);

    // Build parcels array
    const parcels = (items || []).map((item: any) => ({
      description: item?.title || "Book",
      weight: 1,
      length: 25,
      width: 20,
      height: 3,
      value: Number(item?.price) || 100
    }));

    // Build shipment payload based on pickup and delivery types
    const shipmentPayload: any = {
      order_id,
      provider_slug: order.selected_courier_slug,
      service_level_code: order.selected_service_code,
      parcels,
      reference: `ORDER-${order_id}`
    };

    // Add pickup information based on type
    if (pickupData.type === 'locker') {
      shipmentPayload.pickup_locker_location_id = pickupData.location_id;
      shipmentPayload.pickup_locker_provider_slug = pickupData.provider_slug;
      shipmentPayload.pickup_locker_data = pickupData.locker_data;
      console.log(`[commit-to-sale] Pickup: Locker ${pickupData.location_id} (${pickupData.provider_slug})`);
    } else {
      const pickupAddress = pickupData.address;
      shipmentPayload.pickup_address = {
        company: sellerName,
        streetAddress: pickupAddress.streetAddress || pickupAddress.street_address || "",
        suburb: pickupAddress.local_area || pickupAddress.suburb || pickupAddress.city || "",
        city: pickupAddress.city || pickupAddress.local_area || pickupAddress.suburb || "",
        province: pickupAddress.province || pickupAddress.zone || "",
        postalCode: pickupAddress.postalCode || pickupAddress.postal_code || pickupAddress.code || "",
        contact_name: sellerName,
        contact_phone: sellerPhone,
        contact_email: sellerEmail
      };
      console.log(`[commit-to-sale] Pickup: Door address ${pickupAddress.city}`);
    }

    // Add delivery information based on type
    if (deliveryData.type === 'locker') {
      shipmentPayload.delivery_locker_location_id = deliveryData.location_id;
      shipmentPayload.delivery_locker_provider_slug = deliveryData.provider_slug;
      shipmentPayload.delivery_locker_data = deliveryData.locker_data;
      console.log(`[commit-to-sale] Delivery: Locker ${deliveryData.location_id} (${deliveryData.provider_slug})`);
    } else {
      const shippingAddress = deliveryData.address;
      shipmentPayload.delivery_address = {
        company: "",
        streetAddress: shippingAddress.streetAddress || shippingAddress.street_address || "",
        suburb: shippingAddress.local_area || shippingAddress.suburb || shippingAddress.city || "",
        city: shippingAddress.city || shippingAddress.local_area || shippingAddress.suburb || "",
        province: shippingAddress.province || shippingAddress.zone || "",
        postalCode: shippingAddress.postalCode || shippingAddress.postal_code || shippingAddress.code || "",
        contact_name: buyerName,
        contact_phone: buyerPhone,
        contact_email: buyerEmail
      };
      console.log(`[commit-to-sale] Delivery: Door address ${shippingAddress.city}`);
    }

    console.log(`[commit-to-sale] Creating Bob Go shipment`);
    const shipmentResponse = await supabase.functions.invoke("bobgo-create-shipment", {
      body: shipmentPayload,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (shipmentResponse.error) {
      console.error("[commit-to-sale] Failed to create shipment:", shipmentResponse.error);
      throw new Error("Failed to create shipment");
    }

    const shipmentData = shipmentResponse.data || {};
    console.log(`[commit-to-sale] Shipment created successfully`);

    // Update order with commitment and shipment details
    const { error: updateError } = await supabase.from("orders").update({
      status: "committed",
      committed_at: new Date().toISOString(),
      delivery_status: "scheduled",
      tracking_number: shipmentData.tracking_number || order.tracking_number || null,
      delivery_data: {
        ...order.delivery_data || {},
        provider: order.selected_courier_name || "bobgo",
        provider_slug: order.selected_courier_slug,
        service_level: order.selected_service_name || "Standard",
        service_level_code: order.selected_service_code,
        rate_amount: order.selected_shipping_cost,
        shipment_id: shipmentData.shipment_id,
        waybill_url: shipmentData.waybill_url,
        pickup_type: pickupType,
        delivery_type: deliveryType
      },
      updated_at: new Date().toISOString()
    }).eq("id", order_id);

    if (updateError) {
      console.error("[commit-to-sale] Failed to update order:", updateError);
      throw new Error("Failed to update order");
    }

    // Email templates
    const deliveryMethodText = deliveryType === 'locker' ? 'to your selected locker' : 'to your address';
    const buyerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmed - Pickup Scheduled</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f3fef7; padding: 20px; color: #1f4e3d; margin: 0; }
    .container { max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
    .header { background: #3ab26f; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 20px -30px; }
    .footer { background: #f3fef7; color: #1f4e3d; padding: 20px; text-align: center; font-size: 12px; line-height: 1.5; margin: 30px -30px -30px -30px; border-radius: 0 0 10px 10px; border-top: 1px solid #e5e7eb; }
    .info-box { background: #f3fef7; border: 1px solid #3ab26f; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
    </div>
    <h2>Great news, ${buyerName}!</h2>
    <p><strong>${sellerName}</strong> has confirmed your order and is preparing your book(s) for delivery ${deliveryMethodText}.</p>
    <div class="info-box">
      <h3>📚 Order Details</h3>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <p><strong>Book(s):</strong> ${(items || []).map((item: any) => item.title || "Book").join(", ")}</p>
      <p><strong>Seller:</strong> ${sellerName}</p>
      <p><strong>Delivery Method:</strong> ${deliveryType === 'locker' ? 'Locker Delivery' : 'Door-to-Door'}</p>
      <p><strong>Estimated Delivery:</strong> 2-3 business days</p>
      ${shipmentData.tracking_number ? `<p><strong>Tracking Number:</strong> ${shipmentData.tracking_number}</p>` : ""}
    </div>
    <p>Happy reading! 📖</p>
    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br/>Please do not reply to this email.</p>
      <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br/>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
      <p>T&Cs apply.</p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`;

    const pickupMethodText = pickupType === 'locker' ? 'from your selected locker' : 'from your address';
    const sellerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Commitment Confirmed - Prepare for Pickup</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f3fef7; padding: 20px; color: #1f4e3d; margin: 0; }
    .container { max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
    .header { background: #3ab26f; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 20px -30px; }
    .footer { background: #f3fef7; color: #1f4e3d; padding: 20px; text-align: center; font-size: 12px; line-height: 1.5; margin: 30px -30px -30px -30px; border-radius: 0 0 10px 10px; border-top: 1px solid #e5e7eb; }
    .info-box { background: #f3fef7; border: 1px solid #3ab26f; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Commitment Confirmed!</h1>
    </div>
    <h2>Thank you, ${sellerName}!</h2>
    <p>You've successfully committed to sell your book(s). The buyer has been notified and pickup has been scheduled ${pickupMethodText}.</p>
    <div class="info-box">
      <h3>📋 Order Details</h3>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <p><strong>Book(s):</strong> ${(items || []).map((item: any) => item.title || "Book").join(", ")}</p>
      <p><strong>Buyer:</strong> ${buyerName}</p>
      <p><strong>Pickup Method:</strong> ${pickupType === 'locker' ? 'Locker Pickup' : 'Door-to-Door'}</p>
      ${shipmentData.tracking_number ? `<p><strong>Tracking Number:</strong> ${shipmentData.tracking_number}</p>` : ""}
    </div>
    <p>${pickupType === 'locker' ? 'Please drop off your package at the selected locker location.' : 'A courier will contact you within 24 hours to arrange pickup.'}</p>
    <p>Thank you for selling with ReBooked Solutions! 📚</p>
    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br/>Please do not reply to this email.</p>
      <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br/>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
      <p>T&Cs apply.</p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`;

    // Send emails
    console.log(`[commit-to-sale] Sending notifications via email`);
    try {
      await supabase.functions.invoke("send-email", {
        body: {
          to: buyerEmail,
          subject: "Order Confirmed - Pickup Scheduled",
          html: buyerHtml
        }
      });
    } catch (e) {
      console.warn("[commit-to-sale] Failed to send buyer email:", e);
    }

    try {
      await supabase.functions.invoke("send-email", {
        body: {
          to: sellerEmail,
          subject: "Order Commitment Confirmed - Prepare for Pickup",
          html: sellerHtml
        }
      });
    } catch (e) {
      console.warn("[commit-to-sale] Failed to send seller email:", e);
    }

    // Create notifications for both parties
    const notifications = [];
    if (order.buyer_id) {
      notifications.push({
        user_id: order.buyer_id,
        type: "success",
        title: "Order Confirmed",
        message: `Your order has been confirmed and will be delivered ${deliveryMethodText}. Tracking: ${shipmentData.tracking_number || "TBA"}`
      });
    }
    if (order.seller_id) {
      notifications.push({
        user_id: order.seller_id,
        type: "success",
        title: "Order Committed",
        message: `You have successfully committed to the order. Pickup ${pickupMethodText}. Tracking: ${shipmentData.tracking_number || "TBA"}`
      });
    }

    if (notifications.length > 0) {
      try {
        await supabase.from("notifications").insert(notifications);
      } catch (e) {
        console.warn("[commit-to-sale] Failed to create notifications:", e);
      }
    }

    console.log(`[commit-to-sale] Order ${order_id} committed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order committed successfully",
        tracking_number: shipmentData.tracking_number,
        waybill_url: shipmentData.waybill_url,
        pickup_type: pickupType,
        delivery_type: deliveryType
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("[commit-to-sale] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    );
  }
});
