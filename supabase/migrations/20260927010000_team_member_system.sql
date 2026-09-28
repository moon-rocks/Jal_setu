-- ==============================================================================
-- JALSETU — TEAM MEMBER SYSTEM SCHEMA & RLS POLICIES MIGRATION
-- Adds team_members columns, work_updates table, report assignment tracking,
-- and strict Row Level Security (RLS) policies for Team Members and Admins.
-- ==============================================================================

-- 1. Ensure public.team_members has all required fields
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS assigned_area VARCHAR(150);
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS ward VARCHAR(100);
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS team_name VARCHAR(150);
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS responsibilities TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'active';
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS assigned_reports_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS completed_reports_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON public.team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);

-- 2. Ensure reports table has assignment fields for individual team members
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS assigned_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS assigned_member_name VARCHAR(150);
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS assignment_deadline TIMESTAMPTZ;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS assignment_instructions TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS assigned_by_name VARCHAR(255);
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS before_photo_url TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS during_photo_url TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS after_photo_url TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS completion_notes TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS admin_verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS admin_verification_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_reports_assigned_member ON public.reports(assigned_member_id);

-- 3. WORK UPDATES TABLE (Field progress notes & evidence)
CREATE TABLE IF NOT EXISTS public.report_work_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
    team_member_name VARCHAR(150) NOT NULL,
    update_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_updates_report_id ON public.report_work_updates(report_id);
CREATE INDEX IF NOT EXISTS idx_work_updates_team_member ON public.report_work_updates(team_member_id);

-- 4. ROW LEVEL SECURITY (RLS) FOR WORK UPDATES & TEAM MEMBERS
ALTER TABLE public.report_work_updates ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is team member
CREATE OR REPLACE FUNCTION public.is_team_member()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (role = 'FIELD_TEAM' OR role::text ILIKE 'team_member')
    ) OR EXISTS (
        SELECT 1 FROM public.team_members
        WHERE user_id = auth.uid() OR profile_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Work Updates RLS
DROP POLICY IF EXISTS "Read work updates policy" ON public.report_work_updates;
DROP POLICY IF EXISTS "Team members and Admins insert work updates" ON public.report_work_updates;
CREATE POLICY "Read work updates policy"
    ON public.report_work_updates FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.reports
            WHERE reports.id = report_work_updates.report_id
                            AND (
                                reports.citizen_id = auth.uid()
                                OR EXISTS (
                                    SELECT 1 FROM public.team_members
                                    WHERE team_members.team_id = reports.assigned_team_id
                                        AND (team_members.user_id = auth.uid() OR team_members.profile_id = auth.uid())
                                )
                                OR EXISTS (
                                    SELECT 1 FROM public.team_members
                                    WHERE team_members.id = reports.assigned_member_id
                                        AND (team_members.user_id = auth.uid() OR team_members.profile_id = auth.uid())
                                )
                            )
        )
    );

CREATE POLICY "Team members and Admins insert work updates"
    ON public.report_work_updates FOR INSERT
    TO authenticated
    WITH CHECK (
                public.is_admin()
                OR EXISTS (
                    SELECT 1 FROM public.reports
                    JOIN public.team_members ON team_members.id = reports.assigned_member_id
                    WHERE reports.id = report_work_updates.report_id
                        AND team_members.id = report_work_updates.team_member_id
                        AND (team_members.user_id = auth.uid() OR team_members.profile_id = auth.uid())
                )
    );

-- Team Members RLS: Admins have full access; team members can read their own row
DROP POLICY IF EXISTS "Admins full access to team members" ON public.team_members;
DROP POLICY IF EXISTS "Team members read own profile" ON public.team_members;
DROP POLICY IF EXISTS "Team members update permitted profile info" ON public.team_members;
CREATE POLICY "Admins full access to team members"
    ON public.team_members FOR ALL
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Team members read own profile"
    ON public.team_members FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR profile_id = auth.uid()
        OR public.is_admin()
    );

CREATE POLICY "Team members update permitted profile info"
    ON public.team_members FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR profile_id = auth.uid())
    WITH CHECK (user_id = auth.uid() OR profile_id = auth.uid());
