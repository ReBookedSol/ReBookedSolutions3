import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const placeId = url.searchParams.get('place_id');

    if (!placeId) {
      return new Response(
        JSON.stringify({ error: 'Missing place_id parameter' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Call Google Place Details API with address_components
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=formatted_address,geometry,address_components&key=${apiKey}`;

    console.log('Calling Google Place Details API');
    const response = await fetch(detailsUrl);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google API error:', data);
      return new Response(
        JSON.stringify({ error: `Google API error: ${data.status}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const result = data.result;

    // Parse address components
    const components = result.address_components || [];
    const addressData: any = {
      formatted_address: result.formatted_address,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      street_number: '',
      route: '',
      street_address: '',
      city: '',
      province: '',
      postal_code: '',
      country: ''
    };

    // Extract components
    components.forEach((component: any) => {
      const types = component.types;

      if (types.includes('street_number')) {
        addressData.street_number = component.long_name;
      }
      if (types.includes('route')) {
        addressData.route = component.long_name;
      }
      if (types.includes('locality')) {
        addressData.city = component.long_name;
      }
      if (types.includes('sublocality') && !addressData.city) {
        addressData.city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        addressData.province = component.long_name;
      }
      if (types.includes('postal_code')) {
        addressData.postal_code = component.long_name;
      }
      if (types.includes('country')) {
        addressData.country = component.long_name;
      }
    });

    // Combine street number and route for full street address
    addressData.street_address = `${addressData.street_number} ${addressData.route}`.trim();

    console.log('Place details retrieved:', addressData);

    return new Response(
      JSON.stringify(addressData),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in autocomplete-details function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
