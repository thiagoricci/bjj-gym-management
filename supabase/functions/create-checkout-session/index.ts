/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import Stripe from "https://esm.sh/stripe@12.3.0";
import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { studentId, planId, organizationId } = await req.json();

    if (!studentId || !planId || !organizationId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("name, email, stripe_customer_id, organization_id")
      .eq("id", studentId)
      .single();

    if (studentError || !student) {
      return new Response(JSON.stringify({ error: "Student not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: plan, error: planError } = await supabase
      .from("membership_plans")
      .select("name, price")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: organization, error: organizationError } = await supabase
      .from("organizations")
      .select("stripe_account_id")
      .eq("id", organizationId)
      .single();

    if (organizationError || !organization || !organization.stripe_account_id) {
      return new Response(
        JSON.stringify({ error: "Stripe account not configured for this organization" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let customerId = student.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: student.email,
        name: student.name,
      }, {
        stripeAccount: organization.stripe_account_id,
      });
      customerId = customer.id;

      const { error: updateError } = await supabase
        .from("students")
        .update({ stripe_customer_id: customerId })
        .eq("id", studentId);

      if (updateError) {
        console.error("Failed to update student with Stripe customer ID:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update student record" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create a subscription checkout session
    // The payment method is automatically saved when creating a subscription
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        customer: customerId,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: plan.name,
              },
              unit_amount: Math.round(parseFloat(plan.price) * 100),
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${Deno.env.get(
          "SITE_URL"
        )}/payment-success?session_id={CHECKOUT_SESSION_ID}&student_id=${studentId}`,
        cancel_url: `${Deno.env.get("SITE_URL")}/payment-cancelled`,
        client_reference_id: studentId.toString(),
        metadata: {
          planId: planId.toString(),
          organizationId: organizationId,
        },
        subscription_data: {
          metadata: {
            studentId: studentId.toString(),
            planId: planId.toString(),
            organizationId: organizationId,
          },
        },
        customer_update: {
          address: "auto",
        },
      },
      {
        stripeAccount: organization.stripe_account_id,
      }
    );

    return new Response(JSON.stringify({ sessionId: session.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});