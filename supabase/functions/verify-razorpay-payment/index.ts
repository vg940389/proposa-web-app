import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default {
  async fetch(req: Request) {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      const body = await req.json();
      const { proposalId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

      if (!proposalId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new Error('Missing required parameters');
      }

      const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
      if (!keySecret) {
        throw new Error('Razorpay configuration missing');
      }

      // Verify HMAC SHA256 signature
      const encoder = new TextEncoder();
      const keyData = encoder.encode(keySecret);
      const msgData = encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
      const expectedSigHex = Array.from(new Uint8Array(sig))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (expectedSigHex !== razorpay_signature) {
        throw new Error('Invalid payment signature');
      }

      // Initialize Supabase Client
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Fetch proposal for email
      const { data: proposal } = await supabase
        .from('proposals')
        .select('customer_email')
        .eq('id', proposalId)
        .single();

      // Fetch order from Razorpay to get the exact amount
      const keyId = Deno.env.get('RAZORPAY_KEY_ID');
      const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
        headers: {
          'Authorization': `Basic ${btoa(`${keyId}:${keySecret}`)}`
        }
      });
      const orderData = await orderResponse.json();

      // Insert payment record
      // If it exists, this will fail on UNIQUE constraint, which prevents double-credit
      const { error: insertError } = await supabase.from('payments').insert({
        proposal_id: proposalId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount: orderData.amount || 0,
        currency: orderData.currency || 'INR',
        status: 'completed',
        customer_email: proposal?.customer_email,
        completed_at: new Date().toISOString()
      });

      if (insertError) {
        // If unique constraint violation (code 23505), it's already recorded, so we just return success
        if (insertError.code !== '23505') {
          throw insertError;
        }
      }

      // Update proposal status to 'paid'
      await supabase
        .from('proposals')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', proposalId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (error) {
      console.error('Error verifying payment:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
  }
};
