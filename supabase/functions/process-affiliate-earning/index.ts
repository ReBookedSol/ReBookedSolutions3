import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { book_id, order_id, seller_id } = await req.json();

    // Check if order already tracked
    const { data: existingOrder } = await supabaseClient
      .from('affiliate_orders')
      .select('id')
      .eq('order_id', order_id)
      .single();

    if (existingOrder) {
      return new Response(
        JSON.stringify({ message: 'Order already tracked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Check affiliates_referrals table only
    const { data: affiliateReferral } = await supabaseClient
      .from('affiliates_referrals')
      .select('affiliate_id, id')
      .eq('referred_user_id', seller_id)
      .single();

    if (!affiliateReferral) {
      return new Response(
        JSON.stringify({ message: 'Seller not referred' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }


    // Create affiliate_orders record with Pending status
    const { data: affiliateOrder, error: orderError } = await supabaseClient
      .from('affiliate_orders')
      .insert({
        order_id: order_id,
        referral_id: affiliateReferral.id,
        affiliate_id: affiliateReferral.affiliate_id,
        status: 'Pending'
      })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }


    return new Response(
      JSON.stringify({
        success: true,
        affiliateOrder
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
