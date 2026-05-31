import Stripe from "https://esm.sh/stripe@12.3.0";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

/**
 * Upserts a Stripe customer on a connected account:
 * 1. Verify the stored customer ID is valid on the connected account
 * 2. If not, search by email to find an existing customer
 * 3. If still not found, create a new one
 * Always saves the resolved customer ID back to the student record.
 */
export async function upsertStripeCustomer(
  stripe: Stripe,
  supabase: SupabaseClient,
  student: { id: number | string; name: string; email?: string | null; stripe_customer_id?: string | null },
  stripeAccountId: string
): Promise<string> {
  const stripeOptions = { stripeAccount: stripeAccountId };

  // 1. Verify stored customer ID
  if (student.stripe_customer_id) {
    try {
      const existing = await stripe.customers.retrieve(student.stripe_customer_id, stripeOptions);
      if (!(existing as Stripe.DeletedCustomer).deleted) {
        return student.stripe_customer_id;
      }
    } catch {
      // Not found on this connected account — fall through
    }
  }

  // 2. Search by email to avoid duplicates
  if (student.email) {
    const results = await stripe.customers.list({ email: student.email, limit: 1 }, stripeOptions);
    if (results.data.length > 0) {
      const customerId = results.data[0].id;
      await supabase.from("students").update({ stripe_customer_id: customerId }).eq("id", student.id);
      return customerId;
    }
  }

  // 3. Create new customer
  const customer = await stripe.customers.create({
    ...(student.email ? { email: student.email } : {}),
    name: student.name,
    metadata: { studentId: String(student.id) },
  }, stripeOptions);

  await supabase.from("students").update({ stripe_customer_id: customer.id }).eq("id", student.id);
  return customer.id;
}
