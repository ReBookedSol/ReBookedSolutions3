import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bodyResult = await parseRequestBody(req, corsHeaders);
    if (!bodyResult.success) return bodyResult.errorResponse;

    let { fromAddress, toAddress, parcels, serviceType, preferences, collectionPickupPoint, deliveryPickupPoint, user_id } = bodyResult.data;

    // ===== FETCH USER PREFERENCES IF PROVIDED =====
    if (user_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_pickup_locker_location_id, preferred_pickup_locker_provider_slug, preferred_pickup_locker_data, preferred_delivery_locker_location_id, preferred_delivery_locker_provider_slug, preferred_delivery_locker_data')
        .eq('id', user_id)
        .single();

      if (profile) {
        // Use preferred pickup locker if no collectionPickupPoint provided
        if (!collectionPickupPoint && profile.preferred_pickup_locker_location_id) {
          collectionPickupPoint = {
            locationId: profile.preferred_pickup_locker_location_id,
            providerSlug: profile.preferred_pickup_locker_provider_slug,
            data: profile.preferred_pickup_locker_data
          };
          console.log("✅ Using preferred pickup locker from profile");
        }

        // Use preferred delivery locker if no deliveryPickupPoint provided
        if (!deliveryPickupPoint && profile.preferred_delivery_locker_location_id) {
          deliveryPickupPoint = {
            locationId: profile.preferred_delivery_locker_location_id,
            providerSlug: profile.preferred_delivery_locker_provider_slug,
            data: profile.preferred_delivery_locker_data
          };
          console.log("✅ Using preferred delivery locker from profile");
        }
      }
    }

    const validationErrors = [];

    // Validate that we have either addresses or pickup points
    const hasCollectionAddress = fromAddress && fromAddress.suburb && fromAddress.province;
    const hasCollectionPickupPoint = collectionPickupPoint && collectionPickupPoint.locationId;
    const hasDeliveryAddress = toAddress && toAddress.suburb && toAddress.province;
    const hasDeliveryPickupPoint = deliveryPickupPoint && deliveryPickupPoint.locationId;

    if (!hasCollectionAddress && !hasCollectionPickupPoint) {
      validationErrors.push("Either fromAddress or collectionPickupPoint is required");
    }
    if (!hasDeliveryAddress && !hasDeliveryPickupPoint) {
      validationErrors.push("Either toAddress or deliveryPickupPoint is required");
    }
    if (!parcels || !Array.isArray(parcels) || parcels.length === 0) {
      validationErrors.push("parcels array is required and cannot be empty");
    }

    // Validate that locker-to-locker uses the same provider
    if (hasCollectionPickupPoint && hasDeliveryPickupPoint) {
      if (collectionPickupPoint.providerSlug !== deliveryPickupPoint.providerSlug) {
        validationErrors.push("For locker-to-locker shipments, both pickup points must use the same provider");
      }
    }

    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "VALIDATION_FAILED",
          details: validationErrors,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const BOBGO_API_KEY = Deno.env.get("BOBGO_API_KEY");

    function resolveBaseUrl() {
      const env = (Deno.env.get("BOBGO_BASE_URL") || "").trim().replace(/\/+$/, "");
      if (!env) return "https://api.bobgo.co.za/v2";
      if (env.includes("sandbox.bobgo.co.za") && !env.includes("api.sandbox.bobgo.co.za")) {
        return "https://api.sandbox.bobgo.co.za/v2";
      }
      if (env.includes("bobgo.co.za") && !/\/v2$/.test(env)) {
        return env + "/v2";
      }
      return env;
    }

    const BOBGO_BASE_URL = resolveBaseUrl();

    if (!parcels) throw new Error("Validation should have caught missing data");

    if (!BOBGO_API_KEY || BOBGO_API_KEY.trim() === "") {
      console.warn("BOBGO_API_KEY not set - returning simulated quotes");
      return new Response(
        JSON.stringify({
          success: true,
          quotes: parcels.map((p: any, i: number) => ({
            provider: "bobgo",
            carrier: "simulated",
            service_name: serviceType || "Standard",
            service_code: "STANDARD",
            cost: Math.round(Math.max(50, (p.weight || 1) * 40)),
            transit_days: 2,
            offer_id: `SIM_OFFER_${Date.now()}_${i}`,
            fallback: true,
          })),
          simulated: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload: any = {
      parcels: parcels.map((p: any) => ({
        description: "Book",
        submitted_length_cm: p.length || 10,
        submitted_width_cm: p.width || 10,
        submitted_height_cm: p.height || 10,
        submitted_weight_kg: p.weight || 1,
        custom_parcel_reference: "",
      })),
      declared_value: parcels.reduce((sum: number, p: any) => sum + (p.value || 100), 0),
      timeout: 10000,
    };

    // Add collection details (either address or pickup point)
    if (hasCollectionPickupPoint) {
      // Pickup point collection (locker to door OR locker to locker)
      payload.collection_pickup_point_location_id = collectionPickupPoint.locationId;
      payload.pickup_point_provider_slug = collectionPickupPoint.providerSlug;
      console.log("Using collection pickup point:", {
        locationId: collectionPickupPoint.locationId,
        providerSlug: collectionPickupPoint.providerSlug,
      });
    } else if (hasCollectionAddress) {
      // Door collection (door to door OR door to locker)
      payload.collection_address = {
        street_address: fromAddress.streetAddress || "",
        company: fromAddress.company || "",
        local_area: fromAddress.suburb,
        city: fromAddress.city || fromAddress.suburb,
        zone: fromAddress.province,
        country: "ZA",
        code: fromAddress.postalCode || "",
      };
      payload.collection_contact_name = fromAddress.contactName || "Seller";
      payload.collection_contact_mobile_number = fromAddress.contactPhone || "+27000000000";
      payload.collection_contact_email = fromAddress.contactEmail || "seller@example.com";
      console.log("Using collection address:", fromAddress.suburb);
    }

    // Add delivery details (either address or pickup point)
    if (hasDeliveryPickupPoint) {
      // Pickup point delivery (door to locker OR locker to locker)
      payload.delivery_pickup_point_location_id = deliveryPickupPoint.locationId;

      // For locker to locker, provider_slug is already set from collection
      // For door to locker, set it from delivery
      if (!payload.pickup_point_provider_slug) {
        payload.pickup_point_provider_slug = deliveryPickupPoint.providerSlug;
      }
      console.log("Using delivery pickup point:", {
        locationId: deliveryPickupPoint.locationId,
        providerSlug: deliveryPickupPoint.providerSlug,
      });
    } else if (hasDeliveryAddress) {
      // Door delivery (door to door OR locker to door)
      payload.delivery_address = {
        street_address: toAddress.streetAddress || "",
        company: toAddress.company || "",
        local_area: toAddress.suburb,
        city: toAddress.city || toAddress.suburb,
        zone: toAddress.province,
        country: "ZA",
        code: toAddress.postalCode || "",
      };
      payload.delivery_contact_name = toAddress.contactName || "Buyer";
      payload.delivery_contact_mobile_number = toAddress.contactPhone || "+27000000000";
      payload.delivery_contact_email = toAddress.contactEmail || "buyer@example.com";
      console.log("Using delivery address:", toAddress.suburb);
    }

    if (preferences?.carriers?.length) payload.providers = preferences.carriers;
    if (preferences?.service_levels?.length) payload.service_levels = preferences.service_levels;

    console.log("Requesting rates from BobGo with payload:", JSON.stringify(payload, null, 2));

    try {
      const resp = await fetch(`${BOBGO_BASE_URL}/rates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${BOBGO_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        console.error("Bobgo rates HTTP error:", resp.status, text);
        throw new Error(`Bobgo rates HTTP ${resp.status}: ${text}`);
      }

      const data = await resp.json();
      const rates = data.rates || [];
      const quotes = rates.map((r: any) => ({
        provider: "bobgo",
        provider_slug: r.provider_slug,
        service_level_code: r.service_level_code,
        carrier: r.provider_name || r.courier_name || "Unknown",
        service_name: r.service_level_name || r.service_name || "Unknown Service",
        cost: r.total_charge || r.charge || 0,
        currency: r.currency || "ZAR",
        transit_days: r.delivery_days || 3,
        collection_date: r.collection_date,
        delivery_date: r.delivery_date,
        rate_id: r.id,
        // Include pickup point info if present
        pickup_point_location_id: r.pickup_point_location_id,
        type: r.type,
        meta: r,
      }));

      console.log(`Received ${quotes.length} quotes from BobGo`);

      return new Response(
        JSON.stringify({
          success: true,
          quotes,
          provider: "bobgo",
          raw: data,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (err: any) {
      console.error("Bobgo rates failed:", err?.message || err);
      return new Response(
        JSON.stringify({
          success: true,
          quotes: [
            {
              provider: "bobgo",
              carrier: "simulated",
              service_name: "Standard (Estimated)",
              service_code: "STANDARD",
              cost: 95,
              transit_days: 3,
              offer_id: `SIM_OFFER_${Date.now()}`,
              fallback: true,
              api_error: err.message,
            },
          ],
          simulated: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("bobgo-get-rates error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to get rates",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
