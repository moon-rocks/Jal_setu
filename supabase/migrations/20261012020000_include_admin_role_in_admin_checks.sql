-- Keep the database admin check aligned with the roles accepted by the
-- frontend and server-side admin authorization.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role::TEXT IN ('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'SUPERVISOR', 'ADMIN')
  );
$$;
