-- Versiona no repositório o contrato administrativo já presente no projeto
-- Supabase oficial. Este contrato é consumido pelas policies admin-only do
-- hardening operacional e pela função helper public.is_admin_user().

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read their own admin membership" ON public.admin_users;
CREATE POLICY "Authenticated users can read their own admin membership"
ON public.admin_users
FOR SELECT
TO authenticated
USING (((SELECT auth.uid()) = user_id));

CREATE OR REPLACE FUNCTION public.is_admin_user(p_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public', 'auth'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = COALESCE(p_user_id, (SELECT auth.uid()))
      AND is_active = true
  );
$function$;
