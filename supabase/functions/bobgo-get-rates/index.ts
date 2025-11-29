import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";

interface Address {
  street_address?: string;
  company?: string;
  local_area: string;
  city: string;
  zone: string; // Province code like "GP"
  country: string; // "ZA"
  code: string; // Postal code
}

interface PickupPointLocation {
  locationId: number;
  providerSlug: string;
}

interface Parcel {
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  value?: number;
  description?: string;
}

interface RateRequest {
  fromAddress?: Address;
  toAddress?: Address;
  parcels: Parcel[];
  serviceType?: string;
  preferences?: { carriers?: string[]; service_levels?: string[] };
  collectionPickupPoint?: PickupPointLocation;
  deliveryPickupPoint?: PickupPointLocation;
  declaredValue?: number;
  timeout?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const bodyResult = await parseRequestBody<RateRequest>(req, corsHeaders);
    if (!bodyResult.success) return bodyResult.errorResponse!;

    const { 
      fromAddress, 
      toAddress, 
      parcels, 
      preferences, 
      collectionPickupPoint, 
      deliveryPickupPoint,
      declaredValue,
      timeout 
    } = bodyResult.data!;

    // Validation
    const validationErrors = [] as string[];
    
    const hasCollectionAddress = fromAddress && fromAddress.local_area && fromAddress.zone;
    const hasCollectionPickupPoint = collectionPickupPoint && collectionPickupPoint.locationId;
    const hasDeliveryAddress = toAddress && toAddress.local_area && toAddress.zone;
    const hasDeliveryPickupPoint = deliveryPickupPoint && deliveryPickupPoint.locationId;

    if (!hasCollectionAddress && !hasCollectionPickupPoint) {
      validationErrors.push("Either fromAddress or collectionPickupPoint is required");
    }
    if (!hasDeliveryAddress && !hasDeliveryPickupPoint) {
      validationErrors.push("Either toAddress or deliveryPickupPoint is required");
    }
    if (!parcels || !Array.isArray(parcels) || parcels.length === 0) {
      validationErrors.push("parcels array is required and must not be empty");
    }
    
    // Validate locker-to-locker must use same provider
    if (hasCollectionPickupPoint && hasDeliveryPickupPoint) {
      if (collectionPickupPoint!.providerSlug !== deliveryPickupPoint!.providerSlug) {
        validationErrors.push("For locker-to-locker shipments, both pickup points must use the same provider");
      }
    }
    
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ success: false, error: "VALIDATION_FAILED", details: validationErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Build the payload according to BobGo API specs
    const payload: any = {
      parcels: parcels.map((p) => ({
        description: p.description || "Book",
        submitted_length_cm: p.length || 10,
        submitted_width_cm: p.width || 10,
        submitted_height_cm: p.height || 10,
        submitted_weight_kg: p.weight || 1,
        custom_parcel_reference: "",
      })),
      declared_value: declaredValue || parcels.reduce((sum, p) => sum + (p.value || 100), 0),
      timeout: timeout || 10000,
    };

    // Handle collection (either address or pickup point)
    if (collectionPickupPoint) {
      // Locker collection - use pickup point
      payload.collection_pickup_point_location_id = collectionPickupPoint.locationId;
      payload.pickup_point_provider_slug = collectionPickupPoint.providerSlug;
    } else if (fromAddress) {
      // Door collection - use address
      payload.collection_address = {
        street_address: fromAddress.street_address || "",
        company: fromAddress.company || "",
        local_area: fromAddress.local_area,
        city: fromAddress.city,
        zone: fromAddress.zone,
        country: fromAddress.country,
        code: fromAddress.code,
      };
      payload.collection_contact_name = "Seller";
      payload.collection_contact_mobile_number = "+27000000000";
      payload.collection_contact_email = "seller@example.com";
    }

    // Handle delivery (either address or pickup point)
    if (deliveryPickupPoint) {
      // Locker delivery - use pickup point
      payload.delivery_pickup_point_location_id = deliveryPickupPoint.locationId;
      // Only set provider_slug if not already set from collection
      if (!payload.pickup_point_provider_slug) {
        payload.pickup_point_provider_slug = deliveryPickupPoint.providerSlug;
      }
    } else if (toAddress) {
      // Door delivery - use address
      payload.delivery_address = {
        street_address: toAddress.street_address || "",
        company: toAddress.company || "",
        local_area: toAddress.local_area,
        city: toAddress.city,
        zone: toAddress.zone,
        country: toAddress.country,
        code: toAddress.code,
      };
      payload.delivery_contact_name = "Buyer";
      payload.delivery_contact_mobile_number = "+27000000000";
      payload.delivery_contact_email = "buyer@example.com";
    }

    // Optional filters
    if (preferences?.carriers?.length) payload.providers = preferences.carriers;
    if (preferences?.service_levels?.length) payload.service_levels = preferences.service_levels;

    // Make API call if key is available
    if (!BOBGO_API_KEY || BOBGO_API_KEY.trim() === "") {
      return new Response(
        JSON.stringify({
          success: true,
          quotes: parcels.map((p, i) => ({
            provider: "bobgo",
            carrier: "simulated",
            service_name: "Standard (Simulated)",
            service_code: "STANDARD",
            cost: Math.round(Math.max(50, (p.weight || 1) * 40)),
            transit_days: 2,
            offer_id: `SIM_OFFER_${Date.now()}_${i}`,
            fallback: true,
          })),
          simulated: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
        throw new Error(`BobGo API HTTP ${resp.status}: ${text}`);
      }

      const data = await resp.json();
      
      // Extract rates from nested provider_rate_requests structure
      const quotes: any[] = [];
      const providerRequests = data.provider_rate_requests || [];
      
      for (const providerReq of providerRequests) {
        const responses = providerReq.responses || [];
        for (const rate of responses) {
          quotes.push({
            provider: "bobgo",
            provider_slug: providerReq.provider_slug,
            provider_name: providerReq.provider_name,
            service_level_code: rate.service_level_code,
            carrier: providerReq.provider_name || "Unknown",
            service_name: rate.service_level?.name || "Unknown Service",
            service_description: rate.service_level?.description || "",
            cost: rate.rate_amount || 0,
            cost_excl_vat: rate.rate_amount_excl_vat || 0,
            currency: "ZAR",
            charged_weight_kg: rate.charged_weight_kg,
            transit_days: rate.service_level?.service_level_days || null,
            collection_date: data.collection_date,
            delivery_date: data.delivery_date,
            rate_id: data.id,
            pickup_point_location_id: rate.pickup_point_location_id || rate.collection_pickup_point_location_id,
            delivery_type: rate.service_level?.delivery_type,
            type: rate.service_level?.type,
            parcel_size_name: rate.service_level?.parcel_size_name,
            meta: rate,
          });
        }
      }

      return new Response(
        JSON.stringify({ success: true, quotes, provider: "bobgo", raw: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          quotes: [{ 
            provider: "bobgo", 
            carrier: "simulated", 
            service_name: "Standard (Estimated)", 
            service_code: "STANDARD", 
            cost: 95, 
            transit_days: 3, 
            offer_id: `SIM_OFFER_${Date.now()}`, 
            fallback: true, 
            api_error: err.message 
          }], 
          simulated: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to get rates" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
