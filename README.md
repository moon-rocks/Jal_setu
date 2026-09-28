# JalSetu — Water Intelligence & Issue Reporting Platform
> "Har Boond, Behtar Bihar."

Civic-tech water management, leak detection, and municipal dispatch platform for the State of Bihar, connecting citizens with municipal engineers and field repair units.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Swiper.js, Motion
- **Backend & Database**: Supabase PostgreSQL with PostGIS geometry extensions
- **Storage**: Private Supabase Storage bucket (`report-photos`) with signed URLs
- **Realtime**: Supabase Realtime subscriptions for reports, teams, notices, notifications, and field updates
- **AI Engine**: Gemini 2.5 Flash via Supabase Edge Function (`analyze-report`)

---

## 🚀 Setup & Deployment Guide

### 1. Create a Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com) and create a new project.
2. Note your **Project URL** and **Anon / Public Key** from `Project Settings > API`.

### 2. Apply Database Migrations
Install the [Supabase CLI](https://supabase.com/docs/guides/cli), authenticate, link the project, and apply every migration in order:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

The migrations create the schema, Auth profile trigger, PostGIS RPCs, private evidence bucket, indexes, timestamps/status-history triggers, Realtime publication entries, and role/ownership-scoped RLS. They do **not** insert sample wards, teams, notices, reports, members, or settings.

`wards` supports city-scoped ward numbers so Muzaffarpur and Patna can both contain a `Ward 1`. Import verified municipal records (including centroids/boundaries) into `public.wards` before enabling manual ward selection or GIS ward lookup. The repository intentionally contains no invented ward records or coordinates.

### 3. Configure Storage
The migrations create the private `report-photos` bucket and policies. Files are stored under their report UUID; clients receive expiring signed URLs only when RLS confirms access to the report. Do not make this bucket public.

### 4. Deploy Supabase Edge Functions (Gemini AI Analysis)
1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```
2. Set the Gemini secret in Supabase:
   ```bash
   supabase secrets set GEMINI_API_KEY=<your-gemini-api-key>
   ```
4. Deploy the analysis function:
   ```bash
   supabase functions deploy analyze-report
   ```

### 5. Configure Environment Variables
Set the browser keys and server-only credentials in `.env`:
```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-publishable-or-anon-key>
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>
```

Never expose the service-role key to browser code or prefix it with `VITE_`. It is required for server-side field-member Auth provisioning; normal browser access uses the publishable/anon key and RLS.

### 6. Run the Application
```bash
npm install
npm run dev
```

---

## 🔒 Security & Architecture Summary

1. **Row Level Security (RLS)**:
   - Citizens can view and edit only their own profiles and reported issues.
   - Administrative roles (`SUPER_ADMIN`, `MUNICIPAL_ADMIN`, `SUPERVISOR`) are provisioned by an administrator and have operational access.
   - Team members can read assigned reports and their own profile; self-service cannot change role, team, status, or assignment fields.
   - Citizens can read their own reports; evidence files are private and report-scoped.
   - Audit logs are readable only by administrators.
2. **PostGIS**:
   - Every report calculates and stores an EPSG:4326 PostGIS geometry point `location_point` computed automatically from verified device GPS coordinates.
3. **Realtime Subscriptions**:
   - `reports` and `field_teams` updates trigger instant UI reflection without polling.
