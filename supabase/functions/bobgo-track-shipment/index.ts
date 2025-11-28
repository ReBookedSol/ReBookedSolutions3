import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let tracking_number: string | null = null;

    // Handle GET requests with tracking number in path
    if (req.method === "GET") {
      const url = new URL(req.url);
      const searchParams = url.searchParams;
      tracking_number = searchParams.get("tracking_number");

      // Also check path params
      if (!tracking_number) {
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts.length > 0) {
          tracking_number = decodeURIComponent(parts[parts.length - 1]);
        }
      }
    }

    // Handle POST requests with tracking number in body
    if (!tracking_number && req.method === "POST") {
      const bodyResult = await parseRequestBody<{ tracking_number?: string }>(req, corsHeaders);
      if (!bodyResult.success) return bodyResult.errorResponse!;
      tracking_number = bodyResult.data!.tracking_number || null;
    }

    if (!tracking_number) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing tracking_number parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const BOBGO_API_KEY = Deno.env.get("BOBGO_API_KEY");

    // Resolve base URL
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

    let trackingInfo: any = null;
    let simulated = false;

    if (!BOBGO_API_KEY) {
      simulated = true;
      trackingInfo = {
        tracking_number,
        status: "in_transit",
        status_friendly: "In Transit",
        current_location: "Cape Town Hub",
        estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        events: [
          {
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: "collected",
            status_friendly: "Collected",
            description: "Package collected from sender",
            location: "Seller Hub",
          },
          {
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            status: "in_transit",
            status_friendly: "In Transit",
            description: "Package in transit to destination",
            location: "Regional Hub",
          },
        ],
        provider: "bobgo",
        simulated: true,
      };
    } else {
      try {
        // Correct BobGo API endpoint for tracking
        const trackingUrl = `${BOBGO_BASE_URL}/tracking?tracking_reference=${encodeURIComponent(tracking_number)}`;

        const resp = await fetch(trackingUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${BOBGO_API_KEY}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          throw new Error(`BobGo API returned ${resp.status}: ${text || resp.statusText}`);
        }

        const data = await resp.json();

        // BobGo returns an array, get the first item
        const shipmentData = Array.isArray(data) ? data[0] : data;

        if (!shipmentData) {
          throw new Error("No tracking data returned from BobGo API");
        }

        // Parse checkpoints into events
        const events = (shipmentData.checkpoints || []).map((checkpoint: any) => ({
          timestamp: checkpoint.time,
          status: checkpoint.status,
          status_friendly: checkpoint.status_friendly || checkpoint.status,
          location: checkpoint.location || checkpoint.city || "",
          message: checkpoint.message || checkpoint.status_friendly || "",
          description: checkpoint.message || checkpoint.status_friendly || checkpoint.status,
          country: checkpoint.country || "",
          zone: checkpoint.zone || "",
          city: checkpoint.city || "",
        }));

        // Get the latest checkpoint for current location
        const latestCheckpoint = events.length > 0 ? events[0] : null;

        trackingInfo = {
          tracking_number: shipmentData.shipment_tracking_reference || tracking_number,
          full_tracking_reference: shipmentData.custom_tracking_reference,
          shipment_id: shipmentData.id,
          status: shipmentData.status,
          status_friendly: shipmentData.status_friendly || shipmentData.status,
          provider: "bobgo",
          courier_name: shipmentData.courier_name,
          courier_phone: shipmentData.courier_phone,
          service_level: shipmentData.service_level,
          current_location: latestCheckpoint?.location || latestCheckpoint?.city || "Unknown",
          created_at: shipmentData.shipment_time_created,
          updated_at: shipmentData.last_checkpoint_time,
          delivery_location: shipmentData.delivery_location,
          events,
          raw: data,
        };
      } catch (err: any) {

        // Return error with simulated fallback
        simulated = true;
        trackingInfo = {
          tracking_number,
          status: "unknown",
          status_friendly: "Status Unknown",
          current_location: "Unknown",
          events: [],
          provider: "bobgo",
          simulated: true,
          api_error: err.message,
        };
      }
    }

    return new Response(
      JSON.stringify({ success: true, tracking: trackingInfo, simulated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to track shipment" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
