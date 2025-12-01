import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import Stripe from "https://esm.sh/stripe@12.3.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { paymentMethodId, studentId } = await req.json();

    if (!paymentMethodId || !studentId) {
      return new Response(
        JSON.stringify({ error: "Missing paymentMethodId or studentId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("stripe_customer_id, organization_id")
      .eq("id", studentId)
      .single();

    if (studentError || !student || !student.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: "Student or Stripe customer not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the organization's Stripe account ID (optional for Connect mode)
    let stripeAccountId: string | null = null;
    if (student.organization_id) {
      const { data: organization } = await supabase
        .from("organizations")
        .select("stripe_account_id")
        .eq("id", student.organization_id)
        .single();
      
      stripeAccountId = organization?.stripe_account_id || null;
    }

    // Build Stripe options - only include stripeAccount if we have a connected account
    const stripeOptions = stripeAccountId ? { stripeAccount: stripeAccountId } : {};

    await stripe.paymentMethods.detach(paymentMethodId, stripeOptions);

    return new Response(
      JSON.stringify({ success: true, message: "Payment method deleted" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});