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
      const { proposalId } = await req.json();

      if (!proposalId) {
        throw new Error('Missing required parameter: proposalId');
      }

      // Initialize Supabase Client
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Fetch the proposal
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      if (proposalError || !proposal) {
        throw new Error('Proposal not found');
      }

      // Calculate total from pricing blocks in sections (fix data path bug here)
      const sections = proposal.sections || [];
      let totalAmountPaise = 0;

      for (const section of sections) {
        if (section.type === 'pricing_table') {
          const items = section.data?.items || [];
          for (const item of items) {
            const qty = Number(item.qty) || 0;
            const price = Number(item.unit_price) || 0;
            totalAmountPaise += Math.round(qty * price * 100);
          }
        }
      }

      if (totalAmountPaise === 0) {
        throw new Error('Proposal amount cannot be zero');
      }

      const keyId = Deno.env.get('RAZORPAY_KEY_ID');
      const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

      if (!keyId || !keySecret) {
         throw new Error('Razorpay configuration missing');
      }

      // Create Razorpay order via REST API
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${keyId}:${keySecret}`)}`
        },
        body: JSON.stringify({
          amount: totalAmountPaise,
          currency: 'INR',
          receipt: proposalId.slice(0, 40)
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Razorpay API error: ${response.status} ${errorText}`);
      }

      const order = await response.json();

      return new Response(JSON.stringify({
        orderId: order.id,
        keyId,
        amount: order.amount,
        currency: order.currency
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (error) {
      console.error('Error creating razorpay order:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
  }
};
