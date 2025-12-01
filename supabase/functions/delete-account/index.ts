import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    console.log("=== DELETE ACCOUNT FUNCTION INVOKED ===");

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });
    
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a Supabase client with the Auth context of the user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the user from the token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error("Error getting user:", userError);
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`User authenticated: ${user.id}`);

    // Create a Supabase client with Service Role Key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the user's profile to find their organization
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error("Error fetching profile or organization:", profileError);
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const organizationId = profile.organization_id;
    console.log(`Target organization ID: ${organizationId}`);

    // 1. Cancel Platform Subscription in Stripe
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("platform_subscriptions")
      .select("stripe_subscription_id")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (subError) {
      console.error("Error fetching platform subscription:", subError);
    }

    if (subscription?.stripe_subscription_id) {
      console.log(`Cancelling Stripe subscription: ${subscription.stripe_subscription_id}`);
      try {
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
        console.log("Stripe subscription cancelled.");
      } catch (stripeError) {
        console.error("Error cancelling Stripe subscription:", stripeError);
        // Proceed with data deletion even if Stripe fails, but log it.
      }
    }

    // 2. Delete Organization Data
    // We rely on CASCADE delete in Postgres. If 'profiles' and other tables 
    // reference 'organizations' with ON DELETE CASCADE, deleting the organization 
    // will wipe everything.
    
    console.log("Deleting organization...");
    const { error: deleteError } = await supabaseAdmin
      .from("organizations")
      .delete()
      .eq("id", organizationId);

    if (deleteError) {
      console.error("Error deleting organization:", deleteError);
      throw deleteError;
    }

    // 3. Delete the User from Auth (Optional but recommended for "Delete Account")
    console.log("Deleting user from auth...");
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id
    );

    if (deleteUserError) {
      console.error("Error deleting user:", deleteUserError);
      // Not critical if organization is gone, but good to know.
    }

    console.log("=== DELETE ACCOUNT COMPLETE ===");
    
    return new Response(
      JSON.stringify({ success: true, message: "Account and data deleted successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in delete-account function:", error);
    
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});