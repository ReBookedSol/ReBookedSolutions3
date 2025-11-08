import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { book_id, order_id, seller_id } = await req.json();

    console.log('Processing affiliate earning:', { book_id, order_id, seller_id });

    // Check if seller was referred by an affiliate
    const { data: referral, error: referralError } = await supabaseClient
      .from('affiliates_referrals')
      .select('affiliate_id')
      .eq('referred_user_id', seller_id)
      .single();

    if (referralError || !referral) {
      console.log('Seller not referred by any affiliate');
      return new Response(
        JSON.stringify({ message: 'Seller not referred' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Check if earning already exists for this order
    const { data: existing } = await supabaseClient
      .from('affiliate_earnings')
      .select('id')
      .eq('order_id', order_id)
      .single();

    if (existing) {
      console.log('Earning already processed for this order');
      return new Response(
        JSON.stringify({ message: 'Earning already processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Create earning record (R10)
    const { data: earning, error: earningError } = await supabaseClient
      .from('affiliate_earnings')
      .insert({
        affiliate_id: referral.affiliate_id,
        referred_user_id: seller_id,
        book_id: book_id,
        order_id: order_id,
        amount: 10.00
      })
      .select()
      .single();

    if (earningError) {
      console.error('Error creating earning:', earningError);
      throw earningError;
    }

    console.log('Affiliate earning processed:', earning);

    return new Response(
      JSON.stringify({ success: true, earning }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in process-affiliate-earning:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
