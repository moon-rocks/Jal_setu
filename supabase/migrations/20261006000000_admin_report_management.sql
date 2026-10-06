-- Allow verified municipal administrators to edit and permanently remove reports
-- and the associated evidence through their authenticated Supabase session.

CREATE OR REPLACE FUNCTION public.can_manage_reports()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.id = auth.uid()
        AND profile.role::TEXT = 'ADMIN'
    );
$$;

DROP POLICY IF EXISTS reports_admin_delete ON public.reports;
CREATE POLICY reports_admin_delete ON public.reports
  FOR DELETE TO authenticated
  USING (public.can_manage_reports());

DROP POLICY IF EXISTS notifications_admin_delete ON public.notifications;
CREATE POLICY notifications_admin_delete ON public.notifications
  FOR DELETE TO authenticated
  USING (public.can_manage_reports());

DROP POLICY IF EXISTS audit_logs_admin_delete ON public.audit_logs;
CREATE POLICY audit_logs_admin_delete ON public.audit_logs
  FOR DELETE TO authenticated
  USING (public.can_manage_reports());

DROP POLICY IF EXISTS report_photos_storage_admin_delete ON storage.objects;
CREATE POLICY report_photos_storage_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'report-photos'
    AND public.can_manage_reports()
  );
