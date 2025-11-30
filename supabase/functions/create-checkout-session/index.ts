import { serve } from "std/http/server.ts";
import { createClient } from "supabase-js";
import Stripe from "stripe";
import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
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
      success_url: `${Deno.env.get(
        "SITE_URL"
      )}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get("SITE_URL")}/payment-cancelled`,
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
    return new Response(
      JSON.stringify({
        error: "Error creating checkout session",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});