-- ===========================================================================
-- Database Linter / Advisor hardening.
--
-- Clears the actionable security WARNINGS without weakening tenant isolation:
--   1. Trigger/audit SECURITY DEFINER fns -> no longer callable over the RPC API
--   2. RLS helper fns closed to `anon` (kept for `authenticated`, which RLS needs)
--   3. `logos` public bucket no longer listable (still reachable by object URL)
--   4. pg_net moved out of the API-exposed `public` schema into `extensions`
--
-- IMPORTANT (residual warnings, by design):
--   is_org_admin / has_org_role / get_my_organization_id / is_platform_admin stay
--   executable by `authenticated`. RLS policies call these during evaluation, and
--   policy expressions run as the querying user, so revoking from authenticated
--   would break every org-scoped policy. All four are caller-scoped (they only
--   ever return the caller's own org/membership/admin status), so exposing them
--   to authenticated is not a data leak. is_platform_admin is also called via RPC
--   by the /admin UI (AdminDashboard, AdminLogin).
-- ===========================================================================

-- 1) SECURITY DEFINER functions that should never be invoked over PostgREST.
--    Trigger functions fire regardless of EXECUTE grants (Postgres does not check
--    EXECUTE when a trigger fires), and audit_actor_email() is only ever called
--    from inside the SECURITY DEFINER audit_students() trigger (runs as its
--    owner), so revoking from PUBLIC is safe and removes anon + authenticated.
REVOKE EXECUTE ON FUNCTION public.audit_students() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_student_update_perms() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_actor_email() FROM PUBLIC;

-- 2) RLS helper functions: close to `anon`, keep for `authenticated`.
--    `authenticated` still needs EXECUTE because the org-scoped policies call
--    these while evaluating. Anon has no legitimate access to any guarded table,
--    and the functions are caller-scoped anyway.
REVOKE EXECUTE ON FUNCTION public.is_org_admin(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_org_admin(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_org_role(UUID, TEXT[]) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.has_org_role(UUID, TEXT[]) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_organization_id() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_my_organization_id() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

-- 3) The `logos` public bucket must not be listable. Public objects are reachable
--    by URL without any SELECT policy; this policy only enabled storage.list(),
--    which the app never uses (LogoUpload only uploads + getPublicUrl). Dropping it
--    stops the bucket contents from being enumerated.
DROP POLICY IF EXISTS "logos_select_public" ON storage.objects;

-- 4) Move pg_net out of the API-exposed `public` schema into `extensions`, and
--    re-point the daily dunning cron at the schema-qualified function so it no
--    longer depends on search_path. Only moved when we can also re-schedule the
--    cron that references it (otherwise the existing schedule would break).
--    Skipped entirely where pg_net is unavailable (plain Postgres in the RLS
--    test harness) -> harmless no-op there.
DO $$
DECLARE
  v_url TEXT;
  v_key TEXT;
  v_can_reschedule BOOLEAN := FALSE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_net') THEN
    RAISE NOTICE 'pg_net not available; skipping extension move (expected in test/local Postgres).';
    RETURN;
  END IF;

  BEGIN
    SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'project_url';
    SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'service_role_key';
  EXCEPTION WHEN OTHERS THEN
    v_url := NULL; v_key := NULL;
  END;

  v_can_reschedule :=
        EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron')
    AND v_url IS NOT NULL
    AND v_key IS NOT NULL;

  IF NOT v_can_reschedule THEN
    RAISE NOTICE 'Cannot safely re-point dunning cron (pg_cron or vault secrets missing); leaving pg_net in public.';
    RETURN;
  END IF;

  CREATE SCHEMA IF NOT EXISTS extensions;
  DROP EXTENSION IF EXISTS pg_net;
  CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-dunning-daily') THEN
    PERFORM cron.unschedule('process-dunning-daily');
  END IF;

  PERFORM cron.schedule(
    'process-dunning-daily',
    '0 8 * * *',
    format(
      $cron$
        SELECT extensions.net.http_post(
          url := %L,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || %L
          ),
          body := '{}'::jsonb
        );
      $cron$,
      v_url || '/functions/v1/process-dunning',
      v_key
    )
  );

  RAISE NOTICE 'Moved pg_net to extensions and re-scheduled process-dunning-daily with extensions.net.http_post.';
END $$;
