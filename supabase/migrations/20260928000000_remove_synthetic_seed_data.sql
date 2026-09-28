ALTER TABLE public.wards
  ALTER COLUMN population DROP DEFAULT,
  ALTER COLUMN city DROP DEFAULT;
ALTER TABLE public.profiles
  ALTER COLUMN ward_name DROP DEFAULT,
  ALTER COLUMN city DROP DEFAULT;
ALTER TABLE public.field_teams
    ALTER COLUMN assigned_wards DROP DEFAULT,
    ALTER COLUMN members_count SET DEFAULT 0,
    ALTER COLUMN skills DROP DEFAULT,
    ALTER COLUMN latitude DROP DEFAULT,
    ALTER COLUMN longitude DROP DEFAULT,
    ALTER COLUMN contact_phone DROP DEFAULT;
ALTER TABLE public.reports
    ALTER COLUMN accuracy DROP DEFAULT,
    ALTER COLUMN ward_name DROP DEFAULT,
  ALTER COLUMN ward_name DROP NOT NULL,
  ALTER COLUMN city DROP DEFAULT,
  ALTER COLUMN city DROP NOT NULL,
    ALTER COLUMN ai_status DROP DEFAULT,
    ALTER COLUMN ai_confidence DROP DEFAULT;
  ALTER TABLE public.reports
    ADD COLUMN IF NOT EXISTS assigned_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assigned_member_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS assignment_deadline TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS assignment_instructions TEXT,
    ADD COLUMN IF NOT EXISTS assigned_by_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS before_photo_url TEXT,
    ADD COLUMN IF NOT EXISTS during_photo_url TEXT,
    ADD COLUMN IF NOT EXISTS after_photo_url TEXT,
    ADD COLUMN IF NOT EXISTS completion_notes TEXT,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS admin_verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS admin_verification_notes TEXT;
ALTER TABLE public.team_members
    ALTER COLUMN assigned_area DROP DEFAULT,
    ALTER COLUMN ward DROP DEFAULT,
    ALTER COLUMN team_name DROP DEFAULT,
    ALTER COLUMN responsibilities DROP DEFAULT;
  ALTER TABLE public.team_members
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS designation VARCHAR(100),
    ADD COLUMN IF NOT EXISTS department VARCHAR(100),
    ADD COLUMN IF NOT EXISTS assigned_area VARCHAR(150),
    ADD COLUMN IF NOT EXISTS ward VARCHAR(100),
    ADD COLUMN IF NOT EXISTS team_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS responsibilities TEXT,
    ADD COLUMN IF NOT EXISTS status VARCHAR(50),
    ADD COLUMN IF NOT EXISTS assigned_reports_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS completed_reports_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

  CREATE INDEX IF NOT EXISTS idx_wards_centroid ON public.wards USING GIST(centroid);
  CREATE INDEX IF NOT EXISTS idx_reports_assigned_member ON public.reports(assigned_member_id);
  CREATE INDEX IF NOT EXISTS idx_reports_city_ward ON public.reports(city, ward_name);
  CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_work_updates_member_created ON public.report_work_updates(team_member_id, created_at DESC);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email) WHERE email IS NOT NULL;

  ALTER TABLE public.wards DROP CONSTRAINT IF EXISTS wards_ward_number_key;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_wards_city_number ON public.wards(city, ward_number);

DELETE FROM public.water_notices
WHERE published_by IS NULL
  AND (
    (title = 'Pipeline maintenance in Ward 12' AND time_window = 'Today, 2:00 PM – 4:00 PM')
    OR (title = 'Water quality testing schedule' AND time_window = 'Tomorrow, 10:00 AM – 1:00 PM')
    OR (title = 'Normal supply schedule restored' AND time_window = 'Yesterday, 6:00 PM')
    OR (title = 'Low Pressure Warning in Ward 8 & 9' AND time_window = '24 Sep 2026, 6:00 AM – 9:00 AM')
  );

DELETE FROM public.field_teams AS team
WHERE team.name IN (
    'Team Alpha (Rapid Repair)',
    'Team Beta (Hydraulics & Pressure)',
    'Team Gamma (Quality & Chlorination)',
    'Team Delta (Standpost Replacement)'
  )
  AND NOT EXISTS (SELECT 1 FROM public.reports WHERE assigned_team_id = team.id)
  AND NOT EXISTS (SELECT 1 FROM public.team_assignments WHERE team_id = team.id)
  AND NOT EXISTS (SELECT 1 FROM public.team_members WHERE team_id = team.id);

DELETE FROM public.wards AS ward
WHERE ward.ward_number IN ('Ward 12', 'Ward 8', 'Ward 4', 'Ward 9', 'Ward 11', 'Ward 14')
  AND ward.ward_name IN (
    'Ward 12 - Pokhraira Central',
    'Ward 8 - Saraiyaganj North',
    'Ward 4 - Brahampura Market',
    'Ward 9 - Sutapatti Commerce',
    'Ward 11 - Mithanpura Sector',
    'Ward 14 - Kazi Mohammadpur'
  )
  AND NOT EXISTS (SELECT 1 FROM public.reports WHERE ward_id = ward.id)
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE ward_id = ward.id)
  AND NOT EXISTS (SELECT 1 FROM public.water_notices WHERE ward_id = ward.id);

DELETE FROM public.system_settings
WHERE key IN ('ai_verification', 'gis_parameters')
  AND updated_by IS NULL;

CREATE OR REPLACE FUNCTION public.get_ward_by_coordinates(lat DOUBLE PRECISION, lon DOUBLE PRECISION)
RETURNS TABLE (ward_id UUID, ward_number VARCHAR, ward_name VARCHAR, city VARCHAR)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT w.id, w.ward_number, w.ward_name, w.city
    FROM public.wards AS w
    WHERE w.centroid IS NOT NULL
      AND ST_DWithin(
        w.centroid::geography,
        ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
        25000
      )
    ORDER BY ST_Distance(w.centroid::geography, ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography)
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_ward_centers()
RETURNS TABLE (id UUID, ward_number VARCHAR, ward_name VARCHAR, city VARCHAR, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT w.id, w.ward_number, w.ward_name, w.city, ST_Y(w.centroid), ST_X(w.centroid)
    FROM public.wards AS w
    WHERE w.centroid IS NOT NULL
    ORDER BY w.ward_number;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles AS profile
    WHERE profile.id = auth.uid()
      AND profile.role IN ('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'SUPERVISOR')
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_report(report_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.reports AS report
      WHERE report.id = report_uuid AND report.citizen_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.reports AS report
      JOIN public.team_members AS member ON member.id = report.assigned_member_id
      WHERE report.id = report_uuid
      AND (member.user_id = auth.uid() OR member.profile_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.reports AS report
      JOIN public.team_members AS member ON member.team_id = report.assigned_team_id
      WHERE report.id = report_uuid
      AND (member.user_id = auth.uid() OR member.profile_id = auth.uid())
    );
$$;

CREATE OR REPLACE FUNCTION public.prevent_team_member_privilege_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
      IF auth.uid() IS NULL
        OR (OLD.user_id IS DISTINCT FROM auth.uid() AND OLD.profile_id IS DISTINCT FROM auth.uid()) THEN
      RAISE EXCEPTION 'Not authorized to update this team member';
    END IF;
    IF NEW.team_id IS DISTINCT FROM OLD.team_id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.profile_id IS DISTINCT FROM OLD.profile_id
       OR NEW.name IS DISTINCT FROM OLD.name
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.role IS DISTINCT FROM OLD.role
       OR NEW.designation IS DISTINCT FROM OLD.designation
       OR NEW.department IS DISTINCT FROM OLD.department
       OR NEW.assigned_area IS DISTINCT FROM OLD.assigned_area
       OR NEW.ward IS DISTINCT FROM OLD.ward
       OR NEW.team_name IS DISTINCT FROM OLD.team_name
       OR NEW.responsibilities IS DISTINCT FROM OLD.responsibilities
       OR NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Only administrators can change team assignment or authorization fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_citizen_report_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.citizen_id = auth.uid() AND NOT public.is_admin() THEN
    IF OLD.status <> 'submitted'
       OR NEW.status <> OLD.status
       OR (to_jsonb(NEW) - 'photo_url' - 'updated_at') IS DISTINCT FROM
        (to_jsonb(OLD) - 'photo_url' - 'updated_at') THEN
      RAISE EXCEPTION 'Citizens may only attach evidence to their submitted reports';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_citizen_report_mutation ON public.reports;
CREATE TRIGGER prevent_citizen_report_mutation
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.prevent_citizen_report_mutation();

DROP TRIGGER IF EXISTS prevent_team_member_privilege_change ON public.team_members;
CREATE TRIGGER prevent_team_member_privilege_change
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.prevent_team_member_privilege_change();

DROP POLICY IF EXISTS "Public profiles can be read by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Read reports policy" ON public.reports;
DROP POLICY IF EXISTS "Citizens can insert reports" ON public.reports;
DROP POLICY IF EXISTS "Admins and field teams can update reports" ON public.reports;
DROP POLICY IF EXISTS "Read status history" ON public.report_status_history;
DROP POLICY IF EXISTS "Insert status history" ON public.report_status_history;
DROP POLICY IF EXISTS "Read report photos" ON public.report_photos;
DROP POLICY IF EXISTS "Insert report photos" ON public.report_photos;
DROP POLICY IF EXISTS "Read field teams" ON public.field_teams;
DROP POLICY IF EXISTS "Admins manage field teams" ON public.field_teams;
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Anyone can view active notices" ON public.water_notices;
DROP POLICY IF EXISTS "Admins manage water notices" ON public.water_notices;
DROP POLICY IF EXISTS "Wards are readable by everyone" ON public.wards;
DROP POLICY IF EXISTS "Read AI analyses" ON public.ai_analyses;
DROP POLICY IF EXISTS "Insert AI analyses" ON public.ai_analyses;
DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Read system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins update system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated users read authorized report photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload authorized report photos" ON storage.objects;
DROP POLICY IF EXISTS "Read work updates policy" ON public.report_work_updates;
DROP POLICY IF EXISTS "Team members and Admins insert work updates" ON public.report_work_updates;
DROP POLICY IF EXISTS "Admins full access to team members" ON public.team_members;
DROP POLICY IF EXISTS "Team members read own profile" ON public.team_members;
DROP POLICY IF EXISTS "Team members update permitted profile info" ON public.team_members;
DROP POLICY IF EXISTS profiles_select_scoped ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;
DROP POLICY IF EXISTS reports_select_scoped ON public.reports;
DROP POLICY IF EXISTS reports_insert_citizen ON public.reports;
DROP POLICY IF EXISTS reports_update_admin_or_assigned ON public.reports;
DROP POLICY IF EXISTS reports_update_citizen_evidence ON public.reports;
DROP POLICY IF EXISTS report_history_select_scoped ON public.report_status_history;
DROP POLICY IF EXISTS report_photos_select_scoped ON public.report_photos;
DROP POLICY IF EXISTS report_photos_insert_scoped ON public.report_photos;
DROP POLICY IF EXISTS field_teams_select_authenticated ON public.field_teams;
DROP POLICY IF EXISTS field_teams_admin_all ON public.field_teams;
DROP POLICY IF EXISTS team_members_select_scoped ON public.team_members;
DROP POLICY IF EXISTS team_members_admin_all ON public.team_members;
DROP POLICY IF EXISTS team_members_update_self ON public.team_members;
DROP POLICY IF EXISTS assignments_select_scoped ON public.team_assignments;
DROP POLICY IF EXISTS assignments_admin_insert ON public.team_assignments;
DROP POLICY IF EXISTS assignments_admin_update ON public.team_assignments;
DROP POLICY IF EXISTS work_updates_select_scoped ON public.report_work_updates;
DROP POLICY IF EXISTS work_updates_insert_scoped ON public.report_work_updates;
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
DROP POLICY IF EXISTS notifications_admin_insert ON public.notifications;
DROP POLICY IF EXISTS notices_select_active ON public.water_notices;
DROP POLICY IF EXISTS notices_admin_all ON public.water_notices;
DROP POLICY IF EXISTS wards_select_public ON public.wards;
DROP POLICY IF EXISTS wards_admin_all ON public.wards;
DROP POLICY IF EXISTS ai_analyses_select_scoped ON public.ai_analyses;
DROP POLICY IF EXISTS ai_analyses_admin_insert ON public.ai_analyses;
DROP POLICY IF EXISTS audit_logs_select_admin ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_insert_authenticated ON public.audit_logs;
DROP POLICY IF EXISTS system_settings_admin_select ON public.system_settings;
DROP POLICY IF EXISTS system_settings_admin_write ON public.system_settings;

CREATE POLICY profiles_select_scoped ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY profiles_insert_self ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND role = 'CITIZEN');
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND role = 'CITIZEN');
CREATE POLICY profiles_admin_all ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY reports_select_scoped ON public.reports FOR SELECT TO authenticated
  USING (public.can_access_report(id));
CREATE POLICY reports_insert_citizen ON public.reports FOR INSERT TO authenticated
  WITH CHECK (citizen_id = auth.uid() AND status = 'submitted');
CREATE POLICY reports_update_admin_or_assigned ON public.reports FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.team_members m WHERE m.id = assigned_member_id AND (m.user_id = auth.uid() OR m.profile_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.team_members m WHERE m.team_id = assigned_team_id AND (m.user_id = auth.uid() OR m.profile_id = auth.uid()))
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.team_members m WHERE m.id = assigned_member_id AND (m.user_id = auth.uid() OR m.profile_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.team_members m WHERE m.team_id = assigned_team_id AND (m.user_id = auth.uid() OR m.profile_id = auth.uid()))
  );
CREATE POLICY reports_update_citizen_evidence ON public.reports FOR UPDATE TO authenticated
  USING (citizen_id = auth.uid() AND status = 'submitted')
  WITH CHECK (citizen_id = auth.uid() AND status = 'submitted');

CREATE POLICY report_history_select_scoped ON public.report_status_history FOR SELECT TO authenticated
  USING (public.can_access_report(report_id));
CREATE POLICY report_photos_select_scoped ON public.report_photos FOR SELECT TO authenticated
  USING (public.can_access_report(report_id));
CREATE POLICY report_photos_insert_scoped ON public.report_photos FOR INSERT TO authenticated
  WITH CHECK (public.can_access_report(report_id));

CREATE POLICY field_teams_select_authenticated ON public.field_teams FOR SELECT TO authenticated
  USING (true);
CREATE POLICY field_teams_admin_all ON public.field_teams FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY team_members_select_scoped ON public.team_members FOR SELECT TO authenticated
  USING (public.is_admin() OR user_id = auth.uid() OR profile_id = auth.uid());
CREATE POLICY team_members_admin_all ON public.team_members FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY team_members_update_self ON public.team_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR profile_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR profile_id = auth.uid());

CREATE POLICY assignments_select_scoped ON public.team_assignments FOR SELECT TO authenticated
  USING (public.can_access_report(report_id));
CREATE POLICY assignments_admin_insert ON public.team_assignments FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY assignments_admin_update ON public.team_assignments FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY work_updates_select_scoped ON public.report_work_updates FOR SELECT TO authenticated
  USING (public.can_access_report(report_id));
CREATE POLICY work_updates_insert_scoped ON public.report_work_updates FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
    SELECT 1 FROM public.reports r
    JOIN public.team_members m ON m.id = r.assigned_member_id
    WHERE r.id = report_id AND m.id = team_member_id
      AND (m.user_id = auth.uid() OR m.profile_id = auth.uid())
    )
  );

CREATE POLICY notifications_select_own ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY notifications_admin_insert ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY notices_select_active ON public.water_notices FOR SELECT TO anon, authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()) OR public.is_admin());
CREATE POLICY notices_admin_all ON public.water_notices FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY wards_select_public ON public.wards FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY wards_admin_all ON public.wards FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY ai_analyses_select_scoped ON public.ai_analyses FOR SELECT TO authenticated
  USING (public.can_access_report(report_id));
CREATE POLICY ai_analyses_admin_insert ON public.ai_analyses FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY audit_logs_select_admin ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY audit_logs_insert_authenticated ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY system_settings_admin_select ON public.system_settings FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY system_settings_admin_write ON public.system_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

UPDATE storage.buckets SET public = false WHERE id = 'report-photos';
DROP POLICY IF EXISTS "Public read for report photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow photo upload to report-photos" ON storage.objects;
DROP POLICY IF EXISTS report_photos_read_authorized ON storage.objects;
DROP POLICY IF EXISTS report_photos_upload_authorized ON storage.objects;
CREATE POLICY report_photos_read_authorized ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'report-photos'
      AND CASE
        WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          THEN public.can_access_report(((storage.foldername(name))[1])::UUID)
        ELSE EXISTS (
          SELECT 1 FROM public.report_photos AS photo
          WHERE photo.storage_path = name AND public.can_access_report(photo.report_id)
        )
      END
  );
CREATE POLICY report_photos_upload_authorized ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'report-photos'
      AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND public.can_access_report(((storage.foldername(name))[1])::UUID)
  );
