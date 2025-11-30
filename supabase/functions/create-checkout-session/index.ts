import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import Stripe from "https://esm.sh/stripe@12.3.0";
import { corsHeaders } from "../_shared/cors.ts";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

if (!stripeSecretKey) {
  console.error("Missing STRIPE_SECRET_KEY environment variable");
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(stripeSecretKey as string, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("Function invoked.");
    const { studentId, planId, organizationId } = await req.json();
    console.log("Request body:", { studentId, planId, organizationId });

    const siteUrl = Deno.env.get("SITE_URL");
    if (!siteUrl) {
      console.error("Missing SITE_URL environment variable");
      throw new Error("Missing SITE_URL environment variable");
    }
    if (!studentId || !planId || !organizationId) {
      console.error("Missing required parameters.");
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Initializing Supabase client...");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    console.log(`Fetching student with ID: ${studentId}`);
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("name, email")
      .eq("id", studentId)
      .single();

    if (studentError || !student) {
      console.error("Error fetching student:", studentError);
      return new Response(JSON.stringify({ error: "Student not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log("Student found:", student);

    console.log(`Fetching plan with ID: ${planId}`);
    const { data: plan, error: planError } = await supabase
      .from("membership_plans")
      .select("name, price")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      console.error("Error fetching plan:", planError);
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log("Plan found:", plan);

    console.log("Creating Stripe customer...");
    const customer = await stripe.customers.create({
      email: student.email,
      name: student.name,
    });
    console.log("Stripe customer created:", customer.id);

    console.log("Creating Stripe checkout session...");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.name,
            },
            unit_amount: Math.round(parseFloat(plan.price) * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${siteUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/payment-cancelled`,
      customer: customer.id,
      client_reference_id: studentId.toString(),
      metadata: {
        studentId: studentId.toString(),
        planId: planId.toString(),
        organizationId: organizationId.toString(),
      },
    });

    console.log("Stripe checkout session created:", session.id);

    return new Response(JSON.stringify({ sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Caught error:", error);
    const errorMessage =
      error instanceof Error ? error.message : JSON.stringify(error);
    return new Response(
      JSON.stringify({
        error: "Error creating checkout session",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});