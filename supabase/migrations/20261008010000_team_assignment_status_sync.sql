CREATE OR REPLACE FUNCTION public.sync_team_assignment_status(
  p_report_id UUID,
  p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_report RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required.';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('assigned', 'in_progress', 'completed') THEN
    RAISE EXCEPTION 'Invalid team-assignment status.';
  END IF;

  SELECT id, assigned_team_id, assigned_member_id
  INTO target_report
  FROM public.reports
  WHERE id = p_report_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assigned report was not found.';
  END IF;

  IF target_report.assigned_team_id IS NULL THEN
    RAISE EXCEPTION 'Assigned report was not found.';
  END IF;

  IF NOT public.is_admin() AND NOT EXISTS (
    SELECT 1
    FROM public.team_members AS member
    WHERE member.id = target_report.assigned_member_id
      AND member.team_id = target_report.assigned_team_id
      AND member.status = 'active'
      AND (member.user_id = auth.uid() OR member.profile_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'You are not the active team member assigned to this report.';
  END IF;

  UPDATE public.team_assignments
  SET status = p_status
  WHERE id = (
    SELECT assignment.id
    FROM public.team_assignments AS assignment
    WHERE assignment.report_id = p_report_id
      AND assignment.team_id = target_report.assigned_team_id
    ORDER BY assignment.assigned_at DESC
    LIMIT 1
  );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team-assignment record was not found.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_team_assignment_status(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_team_assignment_status(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_ward_centers()
RETURNS TABLE (
  id UUID,
  ward_number VARCHAR,
  ward_name VARCHAR,
  city VARCHAR,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT w.id, w.ward_number, w.ward_name, w.city, ST_Y(w.centroid), ST_X(w.centroid)
  FROM public.wards AS w
  WHERE w.centroid IS NOT NULL
    AND w.boundary IS NOT NULL
  ORDER BY w.city, w.ward_number;
$$;

DROP POLICY IF EXISTS reports_update_admin_or_assigned ON public.reports;
CREATE POLICY reports_update_admin_or_assigned ON public.reports FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.team_members AS member
      WHERE member.id = reports.assigned_member_id
        AND member.team_id = reports.assigned_team_id
        AND member.status = 'active'
        AND (member.user_id = auth.uid() OR member.profile_id = auth.uid())
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.team_members AS member
      WHERE member.id = reports.assigned_member_id
        AND member.team_id = reports.assigned_team_id
        AND member.status = 'active'
        AND (member.user_id = auth.uid() OR member.profile_id = auth.uid())
    )
  );
