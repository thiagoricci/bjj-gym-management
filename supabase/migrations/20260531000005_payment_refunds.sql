-- Refund support + Stripe PaymentIntent tracking on payments.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_reason TEXT,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- Allow staff to update payments for their organization (needed to record refunds
-- from the refund-payment edge function context and keep parity with other tables).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payments'
      AND policyname = 'Users can update payments for their organization'
  ) THEN
    CREATE POLICY "Users can update payments for their organization"
    ON public.payments FOR UPDATE
    USING (
      organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
    );
  END IF;
END $$;
