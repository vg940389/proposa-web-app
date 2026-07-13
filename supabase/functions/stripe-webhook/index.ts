import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from 'npm:stripe@14.18.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const cryptoProvider = Stripe.createCryptoProvider();

export default {
  async fetch(req: Request) {
    const signature = req.headers.get('Stripe-Signature');
    if (!signature) {
      return new Response('Missing Stripe signature', { status: 400 });
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeKey || !webhookSecret) {
      console.error('Missing Stripe configuration');
      return new Response('Server configuration error', { status: 500 });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    try {
      const body = await req.text();
      const event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider
      );

      // Initialize Supabase Client
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const proposalId = session.client_reference_id;

        if (proposalId) {
          // 1. Insert payment record
          await supabase.from('payments').insert({
            proposal_id: proposalId,
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            amount: session.amount_total,
            currency: session.currency,
            status: 'completed',
            customer_email: session.customer_details?.email || session.customer_email,
            completed_at: new Date().toISOString()
          });

          // 2. Update proposal status to 'paid'
          await supabase
            .from('proposals')
            .update({ status: 'paid', updated_at: new Date().toISOString() })
            .eq('id', proposalId);

          console.log(`Payment recorded for proposal ${proposalId}`);
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (err) {
      console.error('Error verifying webhook:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
  }
};
