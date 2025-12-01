import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { organizationId, isAnonymous } = await req.json();

    if (!organizationId && !isAnonymous) {
      throw new Error("Missing organizationId");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
      apiVersion: "2023-10-16",
    });

    let customerId;
    let successUrl;
    let cancelUrl;
    let metadata = {};

    if (isAnonymous) {
      // Anonymous flow (Landing page)
      successUrl = `${req.headers.get("origin")}/signup?session_id={CHECKOUT_SESSION_ID}`;
      cancelUrl = `${req.headers.get("origin")}/`;
      metadata = {
        sessionType: "new_signup",
      };
    } else {
      // Authenticated flow (Settings page)
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Get organization details
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("name, owner_id")
        .eq("id", organizationId)
        .single();

      if (orgError || !org) {
        throw new Error("Organization not found");
      }

      // Get owner email
      const { data: owner, error: ownerError } = await supabase.auth.admin.getUserById(org.owner_id);
      const ownerEmail = owner?.user?.email;

      // Check for existing subscription/customer
      const { data: subscription } = await supabase
        .from("platform_subscriptions")
        .select("stripe_customer_id")
        .eq("organization_id", organizationId)
        .maybeSingle();

      customerId = subscription?.stripe_customer_id;

      if (!customerId) {
        // Create new customer
        const customer = await stripe.customers.create({
          email: ownerEmail,
          name: org.name,
          metadata: {
            organizationId: organizationId,
          },
        });
        customerId = customer.id;
      }

      successUrl = `${req.headers.get("origin")}/settings/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`;
      cancelUrl = `${req.headers.get("origin")}/settings/subscription?canceled=true`;
      metadata = {
        organizationId,
        sessionType: "platform_subscription",
      };
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId, // Will be undefined for anonymous flow, which is fine (Stripe creates a guest customer)
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Standard Plan",
              description: "Full access to gym management features",
            },
            unit_amount: 2900, // $29.00
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: metadata,
      subscription_data: {
        metadata: metadata,
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});