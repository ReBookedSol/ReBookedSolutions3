import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { testFunction } from "../_mock-data/edge-function-tester.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 🧪 TEST MODE: Check if this is a test request with mock data
  const testResult = await testFunction("automate-delivery", req);
  if (testResult.isTest) {
    return testResult.response!;
  }

  try {
    const bodyResult = await parseRequestBody(req, corsHeaders);
    if (!bodyResult.success) {
      return bodyResult.errorResponse!;
    }
    const {
      order_id,
      seller_address,
      buyer_address,
      weight,
      preferred_courier = "courier-guy",
    } = bodyResult.data;

    if (!order_id || !seller_address || !buyer_address) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Missing required fields: order_id, seller_address, buyer_address",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      console.warn(
        "Order not found, proceeding with automation anyway:",
        orderError?.message,
      );
    }

    // Step 1: Get quotes from Bob Go
    let quotes: any[] = [];
    try {
      const provinceMap: Record<string, string> = {
        "eastern cape": "EC",
        "free state": "FS",
        "gauteng": "GP",
        "kwazulu-natal": "KZN",
        "kwa zulu natal": "KZN",
        "limpopo": "LP",
        "mpumalanga": "MP",
        "northern cape": "NC",
        "north west": "NW",
        "western cape": "WC",
      };
      const toCode = (p: string = "") => provinceMap[p.toLowerCase()] || (p.length <= 3 ? p.toUpperCase() : p.toUpperCase().slice(0, 3));
      const normalizeAddress = (a: any) => ({
        suburb: a?.suburb || a?.city || "",
        province: toCode(a?.province || a?.state || ""),
        postalCode: a?.postalCode || a?.postal_code || "",
        streetAddress: a?.streetAddress || a?.street || a?.address || "",
        city: a?.city || a?.suburb || "",
      });

      const ratesResp = await fetch(`${SUPABASE_URL}/functions/v1/bobgo-get-rates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          fromAddress: normalizeAddress(seller_address),
          toAddress: normalizeAddress(buyer_address),
          parcels: [{ weight: weight || 1, length: 25, width: 20, height: 3, value: 100 }],
          serviceType: "standard",
        }),
      });
      const ratesJson = await ratesResp.json().catch(() => ({}));
      if (ratesJson?.quotes?.length) {
        quotes = ratesJson.quotes.map((q: any) => ({
          courier: "bobgo",
          service_name: q.service_name,
          price: q.cost,
          estimated_days: q.transit_days || 3,
          provider_slug: q.provider_slug,
          service_level_code: q.service_level_code,
        }));
      }
    } catch (quoteError) {
      console.error("Failed to get Bob Go rates:", quoteError);
    }

    // Add fallback quote if no quotes received
    if (quotes.length === 0) {
      console.warn("No quotes received, adding fallback Bob Go quote");
      quotes.push({
        courier: "bobgo",
        service_name: "Standard Delivery",
        price: 95.0,
        estimated_days: 3,
        provider_slug: "simulated",
        service_level_code: "STANDARD",
      });
    }

    // Step 2: Select best quote (cheapest available)
    const selectedQuote = quotes.reduce((best, current) =>
      current.price < best.price ? current : best,
    );

    // Step 3: Create shipment with Bob Go
    let shipmentResult = null;
    if (selectedQuote) {
      try {
        const shipmentResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/bobgo-create-shipment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({
              order_id,
              provider_slug: selectedQuote.provider_slug,
              service_level_code: selectedQuote.service_level_code,
              pickup_address: normalizeAddress(seller_address),
              pickup_contact_name: seller_address?.contact_name || seller_address?.contactName || seller_address?.name || "",
              pickup_contact_phone: seller_address?.contact_phone || seller_address?.phone || "",
              pickup_contact_email: seller_address?.contact_email || seller_address?.email || "",
              delivery_address: normalizeAddress(buyer_address),
              delivery_contact_name: buyer_address?.contact_name || buyer_address?.contactName || buyer_address?.name || "",
              delivery_contact_phone: buyer_address?.contact_phone || buyer_address?.phone || "",
              delivery_contact_email: buyer_address?.contact_email || buyer_address?.email || "",
              parcels: [{ weight: weight || 1, length: 25, width: 20, height: 3, value: 100 }],
              reference: `AUTO-${order_id}`,
            }),
          },
        );

        const shipmentData = await shipmentResponse.json();
        shipmentResult = shipmentData;
      } catch (shipmentError) {
        console.error("Failed to create Bob Go shipment:", shipmentError);
      }
    }

    // Step 4: Update order with delivery information (if order exists)
    if (order) {
      const updateData: any = {
        delivery_automated: true,
        delivery_automation_date: new Date().toISOString(),
        selected_courier: "bobgo",
        delivery_cost: selectedQuote.price,
        delivery_provider: "bobgo",
      };

      if (shipmentResult?.success) {
        updateData.status = "courier_scheduled";
        updateData.tracking_number = shipmentResult.tracking_number;
        updateData.courier_reference = shipmentResult.shipment_id;
        updateData.delivery_provider = "bobgo";
        updateData.delivery_data = shipmentResult;
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", order_id);

      if (updateError) {
        console.error("Failed to update order:", updateError);
      }
    }

    // Step 5: Log automation activity (optional table)
    try {
      await supabase.from("delivery_automation_log").insert({
        order_id,
        quotes_received: quotes.length,
        selected_courier: selectedQuote?.courier,
        delivery_cost: selectedQuote?.price,
        shipment_created: !!shipmentResult?.success,
        tracking_number: shipmentResult?.tracking_number,
        automation_status: shipmentResult?.success ? "success" : "partial",
        created_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.warn(
        "Failed to log automation activity (table may not exist):",
        logError?.message,
      );
      // Don't fail for logging errors
    }

    return new Response(
      JSON.stringify({
        success: true,
        automation_status: shipmentResult?.success ? "complete" : "partial",
        quotes_received: quotes.length,
        selected_courier: "bobgo",
        delivery_cost: selectedQuote?.price,
        tracking_number: shipmentResult?.tracking_number,
        shipment_created: !!shipmentResult?.success,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Automate delivery error:", error);

    const errorMessage = error instanceof Error ? error.message :
                        typeof error === "string" ? error :
                        "Failed to automate delivery";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        error_type: error instanceof Error ? error.constructor.name : typeof error
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
