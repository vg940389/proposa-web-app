import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from 'npm:stripe@14.18.0';
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
      const { proposalId, successUrl, cancelUrl } = await req.json();

      if (!proposalId || !successUrl || !cancelUrl) {
        throw new Error('Missing required parameters');
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

      // Calculate total from pricing blocks in sections
      const sections = proposal.sections || [];
      let totalAmountCents = 0;

      for (const section of sections) {
        if (section.type === 'pricing') {
          const items = section.content?.items || [];
          for (const item of items) {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.price) || 0;
            // Assuming price is in dollars, convert to cents
            totalAmountCents += Math.round(qty * price * 100);
          }
        }
      }

      if (totalAmountCents === 0) {
        throw new Error('Proposal amount cannot be zero');
      }

      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (!stripeKey) {
         throw new Error('Stripe configuration missing');
      }

      const stripe = new Stripe(stripeKey, {
        apiVersion: '2023-10-16',
        httpClient: Stripe.createFetchHttpClient(),
      });

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Proposal: ${proposal.title || 'Untitled'}`,
                description: `Payment for proposal by ${proposal.client_name || 'Client'}`,
              },
              unit_amount: totalAmountCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: proposal.client_email,
        client_reference_id: proposal.id,
        metadata: {
          proposalId: proposal.id,
        },
      });

      return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
  }
};
