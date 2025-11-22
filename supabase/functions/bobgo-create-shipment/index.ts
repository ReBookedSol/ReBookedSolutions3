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

    const {
      order_id,
      provider_slug,
      service_level_code,
      parcels,
      reference,
      pickup_address,
      pickup_contact_name,
      pickup_contact_phone,
      pickup_contact_email,
      pickup_locker_location_id,
      pickup_locker_provider_slug,
      pickup_locker_data,
      delivery_address,
      delivery_contact_name,
      delivery_contact_phone,
      delivery_contact_email,
      delivery_locker_location_id,
      delivery_locker_provider_slug,
      delivery_locker_data,
      declared_value,
      timeout,
    } = body || {};

    if (!order_id) throw new Error("Order ID is required");
    if (!provider_slug) throw new Error("Provider slug is required");
    if (!service_level_code) throw new Error("Service level code is required");
    if (!parcels || !Array.isArray(parcels) || parcels.length === 0) {
      throw new Error("Parcels array is required");
    }

    // Get BobGo API configuration
    const BOBGO_API_KEY = Deno.env.get("BOBGO_API_KEY");
    if (!BOBGO_API_KEY || BOBGO_API_KEY.trim() === "") {
      throw new Error("BOBGO_API_KEY not configured");
    }

    let BOBGO_BASE_URL = Deno.env.get("BOBGO_BASE_URL") || "https://api.bobgo.co.za";
    if (!BOBGO_BASE_URL.endsWith("/v2")) {
      if (BOBGO_BASE_URL.includes("bobgo.co.za") && !/\/v2$/.test(BOBGO_BASE_URL)) {
        BOBGO_BASE_URL = BOBGO_BASE_URL + "/v2";
      }
    }

    console.log(`[bobgo-create-shipment] Creating shipment for order ${order_id}`);
    console.log(`[bobgo-create-shipment] Provider: ${provider_slug}, Service: ${service_level_code}`);

    // Build BobGo API payload
    const bobgoPayload: any = {
      parcels: parcels.map((p: any) => ({
        description: p.description || "Book",
        submitted_length_cm: p.length || 10,
        submitted_width_cm: p.width || 10,
        submitted_height_cm: p.height || 10,
        submitted_weight_kg: p.weight || 1,
        custom_parcel_reference: "",
      })),
      service_level_code,
      provider_slug,
      declared_value: declared_value || 0,
      timeout: timeout || 20000,
    };

    // Validate and format address for BobGo
    const formatAddressForBobGo = (addr: any) => {
      if (!addr) return null;
      return {
        street_address: (addr.street_address || addr.streetAddress || addr.street || "").toString().trim(),
        local_area: (addr.local_area || addr.suburb || addr.city || "").toString().trim(),
        city: (addr.city || addr.local_area || addr.suburb || "").toString().trim(),
        zone: (addr.zone || addr.province || "ZA").toString().trim(),
        code: (addr.code || addr.postalCode || addr.postal_code || "").toString().trim(),
        country: (addr.country || "ZA").toString().trim(),
        ...(addr.company && { company: addr.company.toString().trim() }),
      };
    };

    // Add collection (pickup) information
    if (pickup_locker_location_id) {
      // Pickup from locker
      bobgoPayload.collection_pickup_point_location_id = pickup_locker_location_id;
      console.log(`[bobgo-create-shipment] Collection: Locker ${pickup_locker_location_id}`);
    } else if (pickup_address) {
      // Pickup from door
      const formattedPickupAddress = formatAddressForBobGo(pickup_address);

      // Validate that we have required address fields
      if (!formattedPickupAddress.street_address && !formattedPickupAddress.local_area) {
        throw new Error("Pickup address must have at least street_address or local_area (suburb/city)");
      }

      bobgoPayload.collection_address = formattedPickupAddress;
      if (pickup_contact_name) bobgoPayload.collection_contact_name = pickup_contact_name.toString().trim();
      if (pickup_contact_phone) bobgoPayload.collection_contact_mobile_number = pickup_contact_phone.toString().trim();
      if (pickup_contact_email) bobgoPayload.collection_contact_email = pickup_contact_email.toString().trim();

      console.log(`[bobgo-create-shipment] Collection: Door address - ${formattedPickupAddress.local_area}, ${formattedPickupAddress.city}`);
    } else {
      throw new Error("Either pickup address or locker location required");
    }

    // Add delivery information
    if (delivery_locker_location_id) {
      // Delivery to locker
      bobgoPayload.delivery_pickup_point_location_id = delivery_locker_location_id;
      console.log(`[bobgo-create-shipment] Delivery: Locker ${delivery_locker_location_id}`);
    } else if (delivery_address) {
      // Delivery to door
      const formattedDeliveryAddress = formatAddressForBobGo(delivery_address);

      // Validate that we have required address fields
      if (!formattedDeliveryAddress.street_address && !formattedDeliveryAddress.local_area) {
        throw new Error("Delivery address must have at least street_address or local_area (suburb/city)");
      }

      bobgoPayload.delivery_address = formattedDeliveryAddress;
      if (delivery_contact_name) bobgoPayload.delivery_contact_name = delivery_contact_name.toString().trim();
      if (delivery_contact_phone) bobgoPayload.delivery_contact_mobile_number = delivery_contact_phone.toString().trim();
      if (delivery_contact_email) bobgoPayload.delivery_contact_email = delivery_contact_email.toString().trim();

      console.log(`[bobgo-create-shipment] Delivery: Door address - ${formattedDeliveryAddress.local_area}, ${formattedDeliveryAddress.city}`);
    } else {
      throw new Error("Either delivery address or locker location required");
    }

    // Add tracking reference if provided
    if (reference) {
      bobgoPayload.custom_tracking_reference = reference;
    }

    console.log(`[bobgo-create-shipment] Calling BobGo API at ${BOBGO_BASE_URL}/shipments`);
    console.log(`[bobgo-create-shipment] Payload:`, JSON.stringify(bobgoPayload, null, 2));

    // Make request to BobGo API
    const bobgoResponse = await fetch(`${BOBGO_BASE_URL}/shipments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${BOBGO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bobgoPayload),
    });

    const bobgoData = await bobgoResponse.json();

    if (!bobgoResponse.ok) {
      console.error(`[bobgo-create-shipment] BobGo API error (${bobgoResponse.status}):`, bobgoData);
      const errorMessage = bobgoData.message || bobgoData.error || "Failed to create shipment";
      throw new Error(`Bobgo create shipment failed: Bobgo shipment HTTP ${bobgoResponse.status}: ${JSON.stringify(bobgoData)}`);
    }

    console.log(`[bobgo-create-shipment] Shipment created successfully:`, bobgoData);

    return new Response(
      JSON.stringify({
        success: true,
        shipment_id: bobgoData.id,
        tracking_number: bobgoData.tracking_reference,
        waybill_url: bobgoData.waybill_url || null,
        submission_status: bobgoData.submission_status,
        bobgo_response: bobgoData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[bobgo-create-shipment] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
