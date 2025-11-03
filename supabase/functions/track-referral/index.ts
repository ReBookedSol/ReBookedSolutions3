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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { affiliate_code, new_user_id } = await req.json();

    console.log('Tracking referral:', { affiliate_code, new_user_id });

    // Find affiliate by code - use maybeSingle() since affiliate might not exist
    // Convert to uppercase for case-insensitive comparison
    const { data: affiliate, error: affiliateError } = await supabaseClient
      .from('profiles')
      .select('id')
      .ilike('affiliate_code', affiliate_code)
      .eq('is_affiliate', true)
      .maybeSingle();

    if (affiliateError) {
      console.error('Error looking up affiliate:', affiliateError);
      throw affiliateError;
    }

    if (!affiliate) {
      console.error('Affiliate not found for code:', affiliate_code);
      return new Response(
        JSON.stringify({ error: 'Invalid affiliate code' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Check if user is already referred - use maybeSingle() since referral might not exist
    const { data: existing, error: existingError } = await supabaseClient
      .from('affiliates_referrals')
      .select('id')
      .eq('referred_user_id', new_user_id)
      .maybeSingle();

    if (existingError) {
      console.error('Error checking existing referral:', existingError);
      throw existingError;
    }

    if (existing) {
      console.log('User already referred');
      return new Response(
        JSON.stringify({ message: 'User already has a referrer' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Create referral record
    const { data: referral, error: referralError } = await supabaseClient
      .from('affiliates_referrals')
      .insert({
        affiliate_id: affiliate.id,
        referred_user_id: new_user_id,
      })
      .select()
      .single();

    if (referralError) {
      console.error('Error creating referral:', referralError);
      throw referralError;
    }

    console.log('Referral created:', referral);

    return new Response(
      JSON.stringify({ success: true, referral }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in track-referral:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
