import { supabase } from "@/integrations/supabase/client";

// Unified delivery types
export interface UnifiedAddress {
  name?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  company?: string;
  streetAddress: string;
  unitNumber?: string;
  complex?: string;
  suburb?: string;
  city: string;
  province: string; // Accept full name; will be converted to short code for Bob Go
  postalCode: string;
  country?: string;
}

export interface UnifiedParcel {
  reference?: string;
  description?: string;
  weight: number; // in kg
  length?: number; // in cm
  width?: number; // in cm
  height?: number; // in cm
  value?: number; // for insurance
}

export interface UnifiedShipmentRequest {
  collection: UnifiedAddress;
  delivery: UnifiedAddress;
  parcels: UnifiedParcel[];
  service_type?: "standard" | "express" | "overnight";
  special_instructions?: string;
  reference?: string;
  preferred_provider?: "bobgo";
  provider_slug?: string; // from quote
  service_level_code?: string; // from quote
}

export interface UnifiedPickupPoint {
  locationId: string;
  providerSlug: string;
}

export interface UnifiedQuoteRequest {
  from: UnifiedAddress;
  to: UnifiedAddress;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  service_type?: "standard" | "express" | "overnight";
  deliveryLocker?: UnifiedPickupPoint;
  sellerCollectionPickupPoint?: UnifiedPickupPoint;
  user_id?: string;
}

export interface UnifiedQuote {
  provider: "bobgo";
  provider_name: string;
  provider_slug: string;
  service_level_code: string;
  service_name: string;
  cost: number;
  price_excl?: number;
  currency?: string;
  transit_days: number;
  collection_cutoff?: string;
  estimated_delivery?: string;
  features: string[];
  terms?: string;
}

export interface UnifiedShipment {
  provider: "bobgo";
  shipment_id: string;
  tracking_number: string;
  labels?: string[];
  cost?: number;
  service_level_code?: string;
  collection_date?: string;
  estimated_delivery_date?: string;
  reference?: string;
  tracking_url?: string;
}

export interface UnifiedTrackingEvent {
  timestamp: string;
  status: string;
  location?: string;
  description?: string;
  signature?: string;
}

export interface UnifiedTrackingResponse {
  provider: "bobgo";
  tracking_number: string;
  status:
    | "pending"
    | "collected"
    | "in_transit"
    | "out_for_delivery"
    | "delivered"
    | "failed"
    | "cancelled";
  current_location?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  events: UnifiedTrackingEvent[];
  recipient_signature?: string;
  proof_of_delivery?: string;
  tracking_url?: string;
  courier_name?: string;
  courier_slug?: string;
  service_level?: string;
  shipment_id?: string;
  merchant_name?: string;
  created_at?: string;
  last_updated?: string;
}

const PROVINCE_CODE_MAP: Record<string, string> = {
  "eastern cape": "EC",
  "free state": "FS",
  "gauteng": "GP",
  "kwazulu-natal": "KZN",
  "kwazulu natal": "KZN",
  "kwaZulu-Natal": "KZN",
  "limpopo": "LP",
  "mpumalanga": "MP",
  "northern cape": "NC",
  "north west": "NW",
  "western cape": "WC",
};

function toProvinceCode(input: string): string {
  const s = (input || "").toLowerCase().trim();
  if (PROVINCE_CODE_MAP[s]) return PROVINCE_CODE_MAP[s];
  // If already code-like, return as-is (max 3 chars)
  if (s.length <= 3) return input.toUpperCase();
  return input.toUpperCase().slice(0, 2);
}

/** Get quotes from Bob Go */
export const getAllDeliveryQuotes = async (
  request: UnifiedQuoteRequest,
): Promise<UnifiedQuote[]> => {
  try {
    const body: any = {
      parcels: [
        {
          weight: request.weight || 1,
          length: request.length || 25,
          width: request.width || 20,
          height: request.height || 3,
          value: 100,
        },
      ],
      serviceType: request.service_type || "standard",
    };

    // If seller collection pickup point is specified, use it as origin instead of from address
    if (request.sellerCollectionPickupPoint) {
      body.collectionPickupPoint = {
        locationId: request.sellerCollectionPickupPoint.locationId,
        providerSlug: request.sellerCollectionPickupPoint.providerSlug,
      };
      console.log("🚀 Calculating rates from locker pickup point:", request.sellerCollectionPickupPoint);
    } else {
      const provinceCode = toProvinceCode(request.from.province);
      body.fromAddress = {
        street_address: request.from.streetAddress || "",
        company: request.from.company || "",
        local_area: request.from.suburb || request.from.city,
        city: request.from.city,
        zone: provinceCode,
        country: "ZA",
        code: request.from.postalCode,
      };
      console.log("🚀 Calculating rates from address:", request.from.city);
    }

    // If delivery locker is specified, use it instead of toAddress
    if (request.deliveryLocker) {
      body.deliveryPickupPoint = {
        locationId: request.deliveryLocker.locationId,
        providerSlug: request.deliveryLocker.providerSlug,
      };
      console.log("🚀 Calculating rates to locker:", request.deliveryLocker);
    } else {
      const toProvinceCode_value = toProvinceCode(request.to.province);
      body.toAddress = {
        street_address: request.to.streetAddress || "",
        company: request.to.company || "",
        local_area: request.to.suburb || request.to.city,
        city: request.to.city,
        zone: toProvinceCode_value,
        country: "ZA",
        code: request.to.postalCode,
      };
      console.log("🚀 Calculating rates to address:", request.to.city);
    }

    // Pass user_id for preference lookup
    if (request.user_id) {
      body.user_id = request.user_id;
    }

    console.log("📡 Calling bobgo-get-rates edge function with body:", JSON.stringify(body, null, 2));

    const { data, error } = await supabase.functions.invoke("bobgo-get-rates", { body });

    console.log("📡 Edge function response - error:", error, "data:", JSON.stringify(data, null, 2));

    if (error) {
      console.error("❌ Edge function error:", error.message);
      throw new Error(`Edge function error: ${error.message}`);
    }

    if (!data) {
      console.warn("⚠️ Edge function returned no data");
      return generateFallbackQuotes(request);
    }

    if (!data.success) {
      console.error("❌ Edge function returned success: false", data.error);
      return generateFallbackQuotes(request);
    }

    console.log("✅ Edge function returned data:", {
      hasQuotes: !!data.quotes,
      quotesLength: data.quotes?.length,
      simulated: data.simulated,
    });

    // Map the quotes directly from the response
    let quotes: UnifiedQuote[] = (data.quotes || []).map((q: any) => ({
      provider: "bobgo" as const,
      provider_name: q.provider_name || q.carrier || "Bob Go",
      provider_slug: q.provider_slug || "unknown",
      service_level_code: q.service_level_code || q.service_code || "",
      service_name: q.service_name || "Unknown Service",
      cost: q.cost || 0,
      price_excl: q.cost_excl_vat,
      currency: q.currency || "ZAR",
      transit_days: q.transit_days || 3,
      collection_cutoff: q.collection_cutoff,
      features: ["Tracking included"],
      terms: undefined,
    }));

    console.log(`✅ Mapped ${quotes.length} quotes from response`);

    if (!quotes.length) {
      console.warn("⚠️ No quotes found, returning fallback quotes");
      return generateFallbackQuotes(request);
    }

    quotes.sort((a, b) => a.cost - b.cost);
    console.log(`✅ Returning ${quotes.length} sorted quotes`);
    return quotes;
  } catch (err) {
    console.error("getAllDeliveryQuotes error:", err);
    return generateFallbackQuotes(request);
  }
};

/** Create shipment using Bob Go */
export const createUnifiedShipment = async (
  request: UnifiedShipmentRequest,
  selected?: UnifiedQuote,
): Promise<UnifiedShipment> => {
  const parcels = (request.parcels?.length ? request.parcels : [{ weight: 1, length: 25, width: 20, height: 3, value: 100 }]) as UnifiedParcel[];

  let quote = selected;
  if (!quote) {
    const quotes = await getAllDeliveryQuotes({
      from: request.collection,
      to: request.delivery,
      weight: parcels[0].weight || 1,
    });
    if (quotes.length === 0) throw new Error("No rates available");
    quote = quotes[0];
  }

  const { data, error } = await supabase.functions.invoke("bobgo-create-shipment", {
    body: {
      order_id: request.reference || `order-${Date.now()}`,
      provider_slug: quote.provider_slug,
      service_level_code: quote.service_level_code,
      pickup_address: {
        company: request.collection.company,
        streetAddress: request.collection.streetAddress,
        suburb: request.collection.suburb || request.collection.city,
        city: request.collection.city,
        province: toProvinceCode(request.collection.province),
        postalCode: request.collection.postalCode,
        contact_name: request.collection.contactName || request.collection.name,
        contact_phone: request.collection.phone,
        contact_email: request.collection.email,
      },
      delivery_address: {
        company: request.delivery.company,
        streetAddress: request.delivery.streetAddress,
        suburb: request.delivery.suburb || request.delivery.city,
        city: request.delivery.city,
        province: toProvinceCode(request.delivery.province),
        postalCode: request.delivery.postalCode,
        contact_name: request.delivery.contactName || request.delivery.name,
        contact_phone: request.delivery.phone,
        contact_email: request.delivery.email,
      },
      parcels: parcels.map((p) => ({
        weight: p.weight || 1,
        length: p.length || 25,
        width: p.width || 20,
        height: p.height || 3,
        value: p.value || 100,
        description: p.description || "Book",
      })),
      reference: request.reference,
      special_instructions: request.special_instructions,
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || "Shipment creation failed");

  return {
    provider: "bobgo",
    shipment_id: data.shipment_id,
    tracking_number: data.tracking_number,
    cost: data.cost,
    service_level_code: quote!.service_level_code,
    estimated_delivery_date: data.estimated_delivery,
    reference: request.reference,
    tracking_url: undefined,
  };
};

/** Track shipment via Bob Go */
export const trackUnifiedShipment = async (
  trackingNumber: string,
  provider?: "bobgo",
): Promise<UnifiedTrackingResponse> => {
  const { data, error } = await supabase.functions.invoke(`bobgo-track-shipment/${encodeURIComponent(trackingNumber)}`, { method: "GET" as any });
  if (error) throw new Error(error.message);
  const t = data?.tracking || {};

  console.log("Tracking response:", JSON.stringify(t, null, 2));

  // Map checkpoints/events to events array
  const events = (t.checkpoints || t.events || []).map((e: any) => ({
    timestamp: e.time || e.timestamp,
    status: (e.status || "").toLowerCase().replace(/_/g, "-"),
    location: e.location || e.zone || e.city,
    description: e.message || e.description || e.status_friendly || e.status,
    signature: e.signature,
  }));

  return {
    provider: "bobgo",
    tracking_number: t.tracking_number || t.shipment_tracking_reference || trackingNumber,
    status: (t.status || "pending").toLowerCase().replace(/_/g, "-"),
    current_location: t.current_location || t.zone || "Unknown",
    estimated_delivery: t.estimated_delivery || t.shipment_estimated_delivery_date_to,
    actual_delivery: t.delivered_at || t.shipment_movement_events?.delivered_time,
    events,
    recipient_signature: t.recipient_signature,
    proof_of_delivery: undefined,
    tracking_url: t.tracking_url || `https://track.bobgo.co.za/${encodeURIComponent(trackingNumber)}`,
    courier_name: t.courier_name,
    courier_slug: t.courier_slug,
    service_level: t.service_level,
    shipment_id: t.shipment_id || t.id,
    merchant_name: t.merchant_name,
    created_at: t.created_at,
    last_updated: t.updated_at,
  };
};

function detectProviderFromTrackingNumber(_trackingNumber: string): "bobgo" {
  return "bobgo";
}

function generateFallbackQuotes(request: UnifiedQuoteRequest): UnifiedQuote[] {
  const basePrice = Math.max(50, request.weight * 15);
  return [
    {
      provider: "bobgo",
      provider_name: "Bob Go",
      provider_slug: "simulated",
      service_level_code: "STANDARD",
      service_name: "Standard Delivery",
      cost: Math.round(basePrice),
      transit_days: 3,
      features: ["Reliable delivery", "Tracking included"],
    },
  ];
}

export default {
  getAllDeliveryQuotes,
  createUnifiedShipment,
  trackUnifiedShipment,
  detectProviderFromTrackingNumber,
};
