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
      const message =
        err instanceof Error ? err.message : JSON.stringify(err);
      console.error(`Webhook signature verification failed: ${message}`);
      return new Response(`Webhook Error: ${message}`, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { studentId, planId, organizationId, sessionType } = session.metadata || {};

      console.log("Checkout session completed:", {
        mode: session.mode,
        sessionType,
        studentId,
        planId,
        organizationId,
      });

      // Handle SETUP sessions (adding payment method only, no charge)
      if (session.mode === "setup") {
        console.log("=== PROCESSING SETUP SESSION (Payment Method Only) ===");
        
        if (!studentId) {
          console.error("Missing studentId in setup session metadata");
          return new Response("Error: Missing studentId in setup session", { status: 400 });
        }

        // Get the SetupIntent to retrieve the payment method
        const setupIntentId = session.setup_intent as string;
        if (!setupIntentId) {
          console.error("No setup_intent found in session");
          return new Response("Error: No setup_intent in session", { status: 400 });
        }

        // Retrieve the SetupIntent to get the payment method
        // Note: For connected accounts, we need to use the stripeAccount header
        const connectedAccountId = event.account;
        console.log("Connected account ID:", connectedAccountId);

        let setupIntent: Stripe.SetupIntent;
        if (connectedAccountId) {
          setupIntent = await stripe.setupIntents.retrieve(setupIntentId, {
            stripeAccount: connectedAccountId,
          });
        } else {
          setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
        }

        const paymentMethodId = setupIntent.payment_method as string;
        console.log("Payment method from SetupIntent:", paymentMethodId);

        if (paymentMethodId && session.customer) {
          // Set the payment method as the default for the customer
          const customerId = session.customer as string;
          console.log(`Setting payment method ${paymentMethodId} as default for customer ${customerId}`);
          
          try {
            if (connectedAccountId) {
              await stripe.customers.update(customerId, {
                invoice_settings: {
                  default_payment_method: paymentMethodId,
                },
              }, {
                stripeAccount: connectedAccountId,
              });
            } else {
              await stripe.customers.update(customerId, {
                invoice_settings: {
                  default_payment_method: paymentMethodId,
                },
              });
            }
            console.log("Successfully set default payment method for customer");
          } catch (updateError) {
            console.error("Error setting default payment method:", updateError);
            // Don't fail the webhook, the payment method is still attached
          }
        }

        console.log(`Successfully processed setup session for student: ${studentId}`);
        return new Response(JSON.stringify({ received: true, type: "setup" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle PAYMENT/SUBSCRIPTION sessions
      if (!studentId || !planId) {
        console.error("Missing metadata in checkout session:", session.metadata);
        return new Response("Error: Missing metadata in session", { status: 400 });
      }

      console.log(`Processing successful payment for student: ${studentId}`);

      // Fetch the plan to determine if it's a trial plan
      const { data: plan, error: planError } = await supabaseAdmin
        .from("membership_plans")
        .select("price, period")
        .eq("id", planId)
        .single();

      if (planError || !plan) {
        console.error("Error fetching plan:", planError);
        return new Response(`Database Error: Plan not found`, { status: 404 });
      }

      // Check if this is a trial plan (free with Daily or Weekly period)
      const isTrialPlan =
        (plan.price === "0" || plan.price === "0.00") &&
        ["Daily", "Weekly"].includes(plan.period);

      const { error } = await supabaseAdmin
        .from("students")
        .update({
          membership_status: "active",
          status: isTrialPlan ? "trial" : "student",
          membership_plan_id: parseInt(planId),
        })
        .eq("id", studentId);

      if (error) {
        console.error("Error updating student record:", error);
        return new Response(`Database Error: ${error.message}`, { status: 500 });
      }

      // Record payment
      if (organizationId) {
        const amount = session.amount_total ? session.amount_total / 100 : 0;
        console.log(`Attempting to insert payment for student ${studentId} in org ${organizationId}`);
        const { data: paymentData, error: paymentError } = await supabaseAdmin
          .from("payments")
          .insert({
            student_id: parseInt(studentId.toString()),
            organization_id: organizationId,
            amount: amount,
            date: new Date().toISOString(),
            status: 'paid'
          })
          .select();

        if (paymentError) {
          console.error("Error recording payment:", JSON.stringify(paymentError));
        } else {
          console.log(`Payment recorded for student: ${studentId}`, paymentData);
        }
      } else {
        console.warn(`Missing organizationId in metadata for student: ${studentId}, skipping payment record.`);
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
    const errorMessage =
      error instanceof Error ? error.message : JSON.stringify(error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});