-- Staff members support.
-- Adds display columns to profiles and a guard against privilege escalation.

-- 1. Display columns for the staff list in Settings.
--    These are populated by the create-staff edge function and shown to admins.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Prevent users from escalating their own privileges.
--    The "Users can update own profile" policy (USING id = auth.uid()) lets a
--    user change any column on their own row, including role and organization_id.
--    Block changes to those two columns when the caller is editing their own row.
--    Service-role edge functions run with auth.uid() = NULL, so they bypass this
--    guard (used by create-staff to provision new staff rows).
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = NEW.id
     AND (
       NEW.role IS DISTINCT FROM OLD.role
       OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
     )
  THEN
    RAISE EXCEPTION 'Changing your own role or organization is not allowed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation ON public.profiles;

CREATE TRIGGER prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();
