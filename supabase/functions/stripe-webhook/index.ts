import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import Stripe from "https://esm.sh/stripe@12.3.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("Stripe-Signature");
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET");

    if (!signature || !webhookSecret) {
      console.error("Missing Stripe signature or webhook secret.");
      return new Response("Webhook Error: Missing signature or secret", { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        Stripe.createSubtleCryptoProvider()
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { studentId, planId } = session.metadata;

      if (!studentId || !planId) {
        console.error("Missing metadata in checkout session:", session.metadata);
        return new Response("Error: Missing metadata in session", { status: 400 });
      }

      console.log(`Processing successful payment for student: ${studentId}`);

      const { error } = await supabaseAdmin
        .from("students")
        .update({
          membership_status: "active",
          status: "student",
          membership_plan_id: parseInt(planId),
        })
        .eq("id", studentId);

      if (error) {
        console.error("Error updating student record:", error);
        return new Response(`Database Error: ${error.message}`, { status: 500 });
      }

      console.log(`Successfully activated membership for student: ${studentId}`);
    } else {
      console.log(`Received unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});