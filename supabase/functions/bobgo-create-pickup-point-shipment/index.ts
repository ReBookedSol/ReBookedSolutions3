import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOBGO_API_URL = "https://api.sandbox.bobgo.co.za/v2";

interface Address {
  street_address: string;
  local_area: string;
  city: string;
  zone: string;
  code: string;
  country: string;
  company?: string;
}

interface Parcel {
  description: string;
  submitted_length_cm: number;
  submitted_width_cm: number;
  submitted_height_cm: number;
  submitted_weight_kg: number;
  custom_parcel_reference?: string;
}

interface RequestBody {
  order_id: string;

  // Collection point (EITHER address OR locker ID)
  collection_address?: Address;
  collection_contact_name?: string;
  collection_contact_phone?: string;
  collection_contact_email?: string;
  collection_pickup_point_location_id?: number;

  // Delivery point (EITHER address OR locker ID)
  delivery_address?: Address;
  delivery_contact_name?: string;
  delivery_contact_phone?: string;
  delivery_contact_email?: string;
  delivery_pickup_point_location_id?: number;

  // Parcel details
  parcels: Parcel[];

  // Rate selection
  provider_slug: string;
  service_level_code: string;

  // Optional
  reference?: string;
  special_instructions?: string;
  declared_value?: number;
  timeout?: number;
}

interface BobGoShipmentPayload {
  collection_address?: Address;
  collection_contact_name?: string;
  collection_contact_mobile_number?: string;
  collection_contact_email?: string;
  collection_pickup_point_location_id?: number;

  delivery_address?: Address;
  delivery_contact_name?: string;
  delivery_contact_mobile_number?: string;
  delivery_contact_email?: string;
  delivery_pickup_point_location_id?: number;

  parcels: Parcel[];
  declared_value?: number;
  timeout?: number;
  custom_tracking_reference?: string;
  instructions_collection?: string;
  instructions_delivery?: string;
  service_level_code: string;
  provider_slug: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verify user authentication
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const body: RequestBody = await req.json();

    // Validate inputs
    const validationError = validateInputs(body);
    if (validationError) {
      return new Response(
        JSON.stringify({ success: false, error: validationError }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // Verify order exists and belongs to seller
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*")
      .eq("id", body.order_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ success: false, error: "Order not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // Build BobGo shipment payload
    const bobgoPayload: BobGoShipmentPayload = {
      parcels: body.parcels,
      service_level_code: body.service_level_code,
      provider_slug: body.provider_slug,
      declared_value: body.declared_value || 0,
      timeout: body.timeout || 20000,
    };

    // Add collection details
    if (body.collection_pickup_point_location_id) {
      bobgoPayload.collection_pickup_point_location_id = body.collection_pickup_point_location_id;
    } else if (body.collection_address) {
      bobgoPayload.collection_address = body.collection_address;
      bobgoPayload.collection_contact_name = body.collection_contact_name;
      bobgoPayload.collection_contact_mobile_number = body.collection_contact_phone;
      bobgoPayload.collection_contact_email = body.collection_contact_email;
    }

    // Add delivery details
    if (body.delivery_pickup_point_location_id) {
      bobgoPayload.delivery_pickup_point_location_id = body.delivery_pickup_point_location_id;
    } else if (body.delivery_address) {
      bobgoPayload.delivery_address = body.delivery_address;
      bobgoPayload.delivery_contact_name = body.delivery_contact_name;
      bobgoPayload.delivery_contact_mobile_number = body.delivery_contact_phone;
      bobgoPayload.delivery_contact_email = body.delivery_contact_email;
    }

    // Add optional fields
    if (body.reference) {
      bobgoPayload.custom_tracking_reference = body.reference;
    }
    if (body.special_instructions) {
      bobgoPayload.instructions_delivery = body.special_instructions;
    }

    // Make request to BobGo API
    const bobgoApiKey = Deno.env.get("BOBGO_API_KEY");
    if (!bobgoApiKey) {
      throw new Error("BOBGO_API_KEY not configured");
    }

    const bobgoResponse = await fetch(`${BOBGO_API_URL}/shipments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${bobgoApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bobgoPayload),
    });

    const bobgoData = await bobgoResponse.json();

    if (!bobgoResponse.ok) {
      console.error("BobGo API error:", bobgoData);
      return new Response(
        JSON.stringify({
          success: false,
          error: bobgoData.message || "Failed to create shipment",
          details: bobgoData,
        }),
        {
          status: bobgoResponse.status,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // Update order with shipment details
    const deliveryData = {
      ...(order.delivery_data || {}),
      bobgo_shipment_id: bobgoData.id,
      tracking_reference: bobgoData.tracking_reference,
      provider_slug: body.provider_slug,
      service_level_code: body.service_level_code,
      submission_status: bobgoData.submission_status,

      // Store pickup point preferences
      buyer_delivery_type: body.delivery_pickup_point_location_id ? "locker" : "home",
      buyer_locker_location_id: body.delivery_pickup_point_location_id || null,
      buyer_locker_provider_slug: body.delivery_pickup_point_location_id ? body.provider_slug : null,

      seller_pickup_type: body.collection_pickup_point_location_id ? "locker" : "home",
      seller_locker_location_id: body.collection_pickup_point_location_id || null,
      seller_locker_provider_slug: body.collection_pickup_point_location_id ? body.provider_slug : null,
    };

    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({
        tracking_number: bobgoData.tracking_reference,
        delivery_status: bobgoData.status || "pending-collection",
        delivery_data: deliveryData,
        tracking_data: bobgoData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.order_id);

    if (updateError) {
      console.error("Failed to update order:", updateError);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        shipment_id: bobgoData.id,
        tracking_reference: bobgoData.tracking_reference,
        waybill_url: bobgoData.waybill_url,
        estimated_delivery_date: bobgoData.meta?.estimated_delivery_date,
        submission_status: bobgoData.submission_status,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (error) {
    console.error("Error in bobgo-create-pickup-point-shipment:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }
});

function validateInputs(body: RequestBody): string | null {
  if (!body.order_id) {
    return "order_id is required";
  }

  if (!body.parcels || body.parcels.length === 0) {
    return "At least one parcel is required";
  }

  if (!body.provider_slug || !body.service_level_code) {
    return "provider_slug and service_level_code are required";
  }

  // Validate collection point (must have EITHER address OR pickup point ID)
  const hasCollectionAddress = body.collection_address &&
    body.collection_address.street_address &&
    body.collection_address.city &&
    body.collection_address.zone &&
    body.collection_address.code &&
    body.collection_address.country;

  const hasCollectionPickupPoint = !!body.collection_pickup_point_location_id;

  if (!hasCollectionAddress && !hasCollectionPickupPoint) {
    return "Collection point must have either a full address or a pickup point location ID";
  }

  if (hasCollectionAddress && hasCollectionPickupPoint) {
    return "Collection point cannot have both an address and a pickup point location ID";
  }

  // Validate collection contact info if using address
  if (hasCollectionAddress) {
    if (!body.collection_contact_name || !body.collection_contact_phone || !body.collection_contact_email) {
      return "Collection contact name, phone, and email are required when using a collection address";
    }
  }

  // Validate delivery point (must have EITHER address OR pickup point ID)
  const hasDeliveryAddress = body.delivery_address &&
    body.delivery_address.street_address &&
    body.delivery_address.city &&
    body.delivery_address.zone &&
    body.delivery_address.code &&
    body.delivery_address.country;

  const hasDeliveryPickupPoint = !!body.delivery_pickup_point_location_id;

  if (!hasDeliveryAddress && !hasDeliveryPickupPoint) {
    return "Delivery point must have either a full address or a pickup point location ID";
  }

  if (hasDeliveryAddress && hasDeliveryPickupPoint) {
    return "Delivery point cannot have both an address and a pickup point location ID";
  }

  // Validate delivery contact info if using address
  if (hasDeliveryAddress) {
    if (!body.delivery_contact_name || !body.delivery_contact_phone || !body.delivery_contact_email) {
      return "Delivery contact name, phone, and email are required when using a delivery address";
    }
  }

  // Validate parcels
  for (const parcel of body.parcels) {
    if (!parcel.description || !parcel.submitted_length_cm ||
      !parcel.submitted_width_cm || !parcel.submitted_height_cm ||
      !parcel.submitted_weight_kg) {
      return "Each parcel must have description, length, width, height, and weight";
    }
  }

  return null;
}
