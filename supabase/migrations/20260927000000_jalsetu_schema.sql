-- ==============================================================================
-- JALSETU — SUPABASE POSTGRESQL + POSTGIS PRODUCTION DATABASE SCHEMA MIGRATION
-- Project: JalSetu (Water Intelligence & Issue Reporting Platform)
-- Tagline: "Har Boond, Behtar Bihar."
-- Target: Supabase PostgreSQL with PostGIS, RLS, Storage & Realtime
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'CITIZEN',
        'SUPER_ADMIN',
        'MUNICIPAL_ADMIN',
        'SUPERVISOR',
        'FIELD_TEAM',
        'ANALYST'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE issue_type_enum AS ENUM (
        'pipeline_leakage',
        'low_pressure',
        'dirty_water',
        'no_water',
        'broken_tap',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status_enum AS ENUM (
        'submitted',
        'location_verified',
        'under_review',
        'team_assigned',
        'repair_in_progress',
        'resolved',
        'rejected',
        'duplicate'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority_level_enum AS ENUM (
        'low',
        'medium',
        'high',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE team_status_enum AS ENUM (
        'available',
        'on_duty',
        'busy',
        'offline'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notice_severity_enum AS ENUM (
        'info',
        'warning',
        'critical',
        'success'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. WARDS TABLE (With PostGIS geometry polygon)
CREATE TABLE IF NOT EXISTS public.wards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_number VARCHAR(50) NOT NULL,
    ward_name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    boundary GEOMETRY(Geometry, 4326),
    centroid GEOMETRY(Point, 4326),
    population INTEGER,
    supervisor_name VARCHAR(150),
    contact_phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wards_city_number ON public.wards(city, ward_number);
CREATE INDEX IF NOT EXISTS idx_wards_boundary ON public.wards USING GIST (boundary);
CREATE INDEX IF NOT EXISTS idx_wards_centroid ON public.wards USING GIST (centroid);

-- 4. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    role user_role NOT NULL DEFAULT 'CITIZEN',
    avatar_url TEXT,
    ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
    ward_name VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_ward_id ON public.profiles(ward_id);

-- 5. FIELD TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.field_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL UNIQUE,
    status team_status_enum NOT NULL DEFAULT 'available',
    vehicle_number VARCHAR(50),
    assigned_wards TEXT[],
    current_task TEXT,
    active_tasks_count INTEGER DEFAULT 0,
    members_count INTEGER DEFAULT 0,
    skills TEXT[],
    current_location GEOMETRY(Point, 4326),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    contact_phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TEAM MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.field_teams(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);

-- 7. REPORTS TABLE (Central civic issue table)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_number VARCHAR(50) NOT NULL UNIQUE,
    citizen_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    issue_type issue_type_enum NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status report_status_enum NOT NULL DEFAULT 'submitted',
    priority priority_level_enum NOT NULL DEFAULT 'medium',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    location_point GEOMETRY(Point, 4326),
    ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
    ward_name VARCHAR(100),
    city VARCHAR(100),
    address TEXT,
    photo_url TEXT,
    assigned_team_id UUID REFERENCES public.field_teams(id) ON DELETE SET NULL,
    assigned_team_name VARCHAR(150),
    assigned_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
    assigned_member_name VARCHAR(150),
    assignment_deadline TIMESTAMPTZ,
    assignment_instructions TEXT,
    assigned_by_name VARCHAR(255),
    before_photo_url TEXT,
    during_photo_url TEXT,
    after_photo_url TEXT,
    completion_notes TEXT,
    completed_at TIMESTAMPTZ,
    admin_verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    admin_verification_notes TEXT,
    ai_status VARCHAR(50),
    ai_confidence DOUBLE PRECISION,
    ai_evidence TEXT[] DEFAULT ARRAY[]::TEXT[],
    repair_notes TEXT,
    resolution_photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    assigned_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_citizen_id ON public.reports(citizen_id);
CREATE INDEX IF NOT EXISTS idx_reports_ward_name ON public.reports(ward_name);
CREATE INDEX IF NOT EXISTS idx_reports_assigned_team ON public.reports(assigned_team_id);
CREATE INDEX IF NOT EXISTS idx_reports_assigned_member ON public.reports(assigned_member_id);
CREATE INDEX IF NOT EXISTS idx_reports_city_ward ON public.reports(city, ward_name);
CREATE INDEX IF NOT EXISTS idx_reports_location_point ON public.reports USING GIST(location_point);

-- 8. REPORT STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.report_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    from_status report_status_enum,
    to_status report_status_enum NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_status_history_report ON public.report_status_history(report_id);

-- 9. REPORT PHOTOS TABLE (Supabase Storage references)
CREATE TABLE IF NOT EXISTS public.report_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    photo_type VARCHAR(50) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    file_hash VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_photos_report ON public.report_photos(report_id);

-- 10. TEAM ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.team_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.field_teams(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'assigned', -- 'assigned', 'in_progress', 'completed'
    notes TEXT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_team_assignments_report ON public.team_assignments(report_id);
CREATE INDEX IF NOT EXISTS idx_team_assignments_team ON public.team_assignments(team_id);

-- 11. AI ANALYSES TABLE
CREATE TABLE IF NOT EXISTS public.ai_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    issue_type issue_type_enum,
    severity priority_level_enum,
    confidence DOUBLE PRECISION NOT NULL,
    summary TEXT NOT NULL,
    recommendation TEXT,
    detected_features JSONB,
    model VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_report ON public.ai_analyses(report_id);

-- 12. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info', -- 'report_status', 'alert', 'notice', 'team_dispatch'
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- 13. WATER NOTICES TABLE
CREATE TABLE IF NOT EXISTS public.water_notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    time_window VARCHAR(100) NOT NULL,
    severity notice_severity_enum NOT NULL DEFAULT 'info',
    description TEXT NOT NULL,
    ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
    ward_name VARCHAR(100),
    published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- 15. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.system_settings (
    id VARCHAR(100) PRIMARY KEY,
    key_name VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. TRIGGERS & FUNCTIONS

-- Automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), NEW.email, 'CITIZEN')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

CREATE OR REPLACE TRIGGER update_profiles_timestamp
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE OR REPLACE TRIGGER update_reports_timestamp
    BEFORE UPDATE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE OR REPLACE TRIGGER update_field_teams_timestamp
    BEFORE UPDATE ON public.field_teams
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS update_wards_timestamp ON public.wards;
CREATE TRIGGER update_wards_timestamp
    BEFORE UPDATE ON public.wards
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();

DROP TRIGGER IF EXISTS update_team_members_timestamp ON public.team_members;
CREATE TRIGGER update_team_members_timestamp
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();

DROP TRIGGER IF EXISTS update_water_notices_timestamp ON public.water_notices;
CREATE TRIGGER update_water_notices_timestamp
    BEFORE UPDATE ON public.water_notices
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();

-- Automatically maintain location_point from latitude and longitude on reports
CREATE OR REPLACE FUNCTION public.sync_report_location_point()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location_point = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions;

CREATE OR REPLACE TRIGGER sync_report_location_trigger
    BEFORE INSERT OR UPDATE OF latitude, longitude ON public.reports
    FOR EACH ROW EXECUTE FUNCTION sync_report_location_point();

-- Automatically log status history on report status changes
CREATE OR REPLACE FUNCTION public.log_report_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.report_status_history (
            report_id,
            from_status,
            to_status,
            changed_by,
            reason
        ) VALUES (
            NEW.id,
            CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
            NEW.status,
            auth.uid(),
            'Status transitioned to ' || NEW.status
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER report_status_history_trigger
    AFTER INSERT OR UPDATE OF status ON public.reports
    FOR EACH ROW EXECUTE FUNCTION log_report_status_change();

-- 17. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'SUPERVISOR')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Profiles Policies
CREATE POLICY "Public profiles can be read by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = 'CITIZEN');

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id AND role = 'CITIZEN');

CREATE POLICY "Admins manage profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Reports Policies
-- Citizens can read their own reports; Admins can read all reports
CREATE POLICY "Read reports policy"
    ON public.reports FOR SELECT
    TO authenticated
    USING (
        citizen_id = auth.uid()
        OR public.is_admin()
        OR EXISTS (SELECT 1 FROM public.team_members WHERE profile_id = auth.uid() AND team_id = reports.assigned_team_id)
    );

-- Citizens can create reports
CREATE POLICY "Citizens can insert reports"
    ON public.reports FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND citizen_id = auth.uid()
        AND status = 'submitted'
    );

-- Admins and assigned field teams can update reports
CREATE POLICY "Admins and field teams can update reports"
    ON public.reports FOR UPDATE
    TO authenticated
    USING (
        public.is_admin()
        OR EXISTS (SELECT 1 FROM public.team_members WHERE profile_id = auth.uid() AND team_id = reports.assigned_team_id)
    );

-- Report Status History Policies
CREATE POLICY "Read status history"
    ON public.report_status_history FOR SELECT
    TO authenticated
        USING (
            public.is_admin()
            OR EXISTS (SELECT 1 FROM public.reports WHERE reports.id = report_status_history.report_id AND reports.citizen_id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.reports r JOIN public.team_members m ON m.team_id = r.assigned_team_id WHERE r.id = report_status_history.report_id AND m.profile_id = auth.uid())
        );

-- Report Photos Policies
CREATE POLICY "Read report photos"
    ON public.report_photos FOR SELECT
    TO authenticated
        USING (
            public.is_admin()
            OR EXISTS (SELECT 1 FROM public.reports WHERE reports.id = report_photos.report_id AND reports.citizen_id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.reports r JOIN public.team_members m ON m.team_id = r.assigned_team_id WHERE r.id = report_photos.report_id AND m.profile_id = auth.uid())
        );

CREATE POLICY "Insert report photos"
    ON public.report_photos FOR INSERT
    TO authenticated
        WITH CHECK (
            public.is_admin()
            OR EXISTS (SELECT 1 FROM public.reports WHERE reports.id = report_photos.report_id AND reports.citizen_id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.reports r JOIN public.team_members m ON m.team_id = r.assigned_team_id WHERE r.id = report_photos.report_id AND m.profile_id = auth.uid())
        );

-- Field Teams Policies
CREATE POLICY "Read field teams"
    ON public.field_teams FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins manage field teams"
    ON public.field_teams FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Notifications Policies
CREATE POLICY "Users read own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users update own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "System insert notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- Water Notices Policies
CREATE POLICY "Anyone can view active notices"
    ON public.water_notices FOR SELECT
    TO authenticated, anon
    USING ((is_active = true AND (expires_at IS NULL OR expires_at > NOW())) OR public.is_admin());

CREATE POLICY "Admins manage water notices"
    ON public.water_notices FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Wards Policies (Accessible to citizens and visitors for boundary matching)
CREATE POLICY "Wards are readable by everyone"
    ON public.wards FOR SELECT
    TO authenticated, anon
    USING (true);

-- AI Analyses Policies
CREATE POLICY "Read AI analyses"
    ON public.ai_analyses FOR SELECT
    TO authenticated
        USING (
            public.is_admin()
            OR EXISTS (SELECT 1 FROM public.reports WHERE reports.id = ai_analyses.report_id AND reports.citizen_id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.reports r JOIN public.team_members m ON m.team_id = r.assigned_team_id WHERE r.id = ai_analyses.report_id AND m.profile_id = auth.uid())
        );

CREATE POLICY "Insert AI analyses"
    ON public.ai_analyses FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- Audit Logs Policies
CREATE POLICY "Admins read audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "System insert audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- System Settings Policies
CREATE POLICY "Read system settings"
    ON public.system_settings FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins update system settings"
    ON public.system_settings FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 18. POSTGIS RPC FUNCTIONS & TRIGGERS FOR SPATIAL WARD DETERMINATION
CREATE OR REPLACE FUNCTION get_ward_by_coordinates(lat DOUBLE PRECISION, lon DOUBLE PRECISION)
RETURNS TABLE (
    ward_id UUID,
    ward_number VARCHAR,
    ward_name VARCHAR,
    city VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT w.id, w.ward_number, w.ward_name, w.city
    FROM public.wards w
    WHERE w.centroid IS NOT NULL
      AND ST_DWithin(
        w.centroid::geography,
        ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
        25000
      )
    ORDER BY ST_Distance(w.centroid::geography, ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography)
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.get_ward_centers()
RETURNS TABLE (
    id UUID,
    ward_number VARCHAR,
    ward_name VARCHAR,
    city VARCHAR,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
) AS $$
    SELECT w.id, w.ward_number, w.ward_name, w.city, ST_Y(w.centroid), ST_X(w.centroid)
    FROM public.wards AS w
    WHERE w.centroid IS NOT NULL
    ORDER BY w.city, w.ward_number;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions;

-- 19. SUPABASE REALTIME REPLICATION PUBLICATION
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'reports') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'field_teams') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.field_teams;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'team_members') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'water_notices') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.water_notices;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'report_status_history') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.report_status_history;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'team_assignments') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.team_assignments;
        END IF;
    END IF;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- 20. SUPABASE STORAGE BUCKET & RLS POLICIES FOR 'report-photos'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'report-photos',
    'report-photos',
    false,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read for report photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow photo upload to report-photos" ON storage.objects;
CREATE POLICY "Authenticated users read authorized report photos"
        ON storage.objects FOR SELECT TO authenticated
        USING (
            bucket_id = 'report-photos'
            AND CASE
                WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                    THEN EXISTS (
                        SELECT 1 FROM public.reports AS report
                        WHERE report.id = ((storage.foldername(name))[1])::UUID
                            AND (report.citizen_id = auth.uid() OR public.is_admin()
                                OR EXISTS (SELECT 1 FROM public.team_members AS member WHERE member.team_id = report.assigned_team_id AND member.profile_id = auth.uid()))
                    )
                ELSE false
            END
        );
CREATE POLICY "Authenticated users upload authorized report photos"
        ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (
            bucket_id = 'report-photos'
            AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            AND EXISTS (
                SELECT 1 FROM public.reports AS report
                WHERE report.id = ((storage.foldername(name))[1])::UUID
                    AND (report.citizen_id = auth.uid() OR public.is_admin()
                        OR EXISTS (SELECT 1 FROM public.team_members AS member WHERE member.team_id = report.assigned_team_id AND member.profile_id = auth.uid()))
            )
        );

-- No synthetic ward, team, notice, or settings records are inserted.
