import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const DEFAULT_PORT = Number(process.env.PORT) || 3000;
const isPlaceholderValue = (value?: string) => !value || /example\.supabase\.co|your-project-id|placeholder|replace[-_ ]?me/i.test(value);
const supabaseUrl = [process.env.SUPABASE_URL, process.env.VITE_SUPABASE_URL].find((value) => !isPlaceholderValue(value));
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const candidateServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isServiceRoleKey = (key?: string) => {
  if (!key) return false;
  if (key.startsWith('sb_secret_')) return true;

  const payload = key.split('.')[1];
  if (!payload) return false;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).role === 'service_role';
  } catch {
    return false;
  }
};

const hasServiceRoleKey = isServiceRoleKey(candidateServiceRoleKey);
const supabaseKey = hasServiceRoleKey ? candidateServiceRoleKey! : supabaseAnonKey!;

if (!supabaseUrl || isPlaceholderValue(supabaseAnonKey)) {
  throw new Error('A valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be configured.');
}

const serverSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const createCallerClient = (accessToken: string) => createClient(supabaseUrl, supabaseAnonKey!, {
  global: { headers: { Authorization: `Bearer ${accessToken}` } },
  auth: { persistSession: false, autoRefreshToken: false },
});

const requireServiceRole = (res: Response, message: string) => {
  if (hasServiceRoleKey) return true;
  const keyHint = !candidateServiceRoleKey
    ? 'SUPABASE_SERVICE_ROLE_KEY is missing from the server environment.'
    : candidateServiceRoleKey.startsWith('sb_publishable_')
      ? 'The configured SUPABASE_SERVICE_ROLE_KEY is a publishable key, not a privileged server key. Use a Supabase secret key (sb_secret_...) or legacy service_role JWT.'
      : 'The configured SUPABASE_SERVICE_ROLE_KEY is not a valid privileged server key. Use a Supabase secret key (sb_secret_...) or legacy service_role JWT.';
  res.status(503).json({ success: false, error: `${message} ${keyHint} Restart the server after updating .env.` });
  return false;
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

async function listReportStoragePaths(client: SupabaseClient, reportId: string): Promise<string[]> {
  const directories = [reportId];
  const paths: string[] = [];

  while (directories.length > 0) {
    const directory = directories.pop()!;
    let offset = 0;

    while (true) {
      const { data, error } = await client.storage
        .from('report-photos')
        .list(directory, { limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } });

      if (error) throw error;
      const entries = data || [];

      for (const entry of entries) {
        const path = `${directory}/${entry.name}`;
        if (entry.id === null && entry.metadata === null) {
          directories.push(path);
        } else {
          paths.push(path);
        }
      }

      if (entries.length < 1000) break;
      offset += entries.length;
    }
  }

  return paths;
}

const getReportPhotoStoragePath = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const path = value.trim();
  const storageUrlMatch = path.match(/\/storage\/v1\/object\/(?:sign|public|authenticated)\/report-photos\/([^?#]+)/i);
  if (storageUrlMatch) return decodeURIComponent(storageUrlMatch[1]);
  if (/^https?:\/\//i.test(path)) return null;
  return path;
};

async function getAllReportStoragePaths(client: SupabaseClient, reportId: string): Promise<string[]> {
  const [folderPaths, reportResult, photoResult, updateResult] = await Promise.all([
    listReportStoragePaths(client, reportId),
    client.from('reports')
      .select('photo_url, before_photo_url, during_photo_url, after_photo_url')
      .eq('id', reportId)
      .maybeSingle(),
    client.from('report_photos').select('storage_path').eq('report_id', reportId),
    client.from('report_work_updates').select('photo_url').eq('report_id', reportId),
  ]);

  if (reportResult.error) throw reportResult.error;
  if (photoResult.error) throw photoResult.error;
  if (updateResult.error) throw updateResult.error;

  const reportPhotoPaths = Object.values(reportResult.data || {})
    .map(getReportPhotoStoragePath)
    .filter((path): path is string => Boolean(path));
  const linkedPhotoPaths = (photoResult.data || [])
    .map((photo) => getReportPhotoStoragePath(photo.storage_path))
    .filter((path): path is string => Boolean(path));
  const updatePhotoPaths = (updateResult.data || [])
    .map((update) => getReportPhotoStoragePath(update.photo_url))
    .filter((path): path is string => Boolean(path));

  return Array.from(new Set([...folderPaths, ...reportPhotoPaths, ...linkedPhotoPaths, ...updatePhotoPaths]));
}

async function removeReportStoragePaths(client: SupabaseClient, paths: string[]) {
  for (let index = 0; index < paths.length; index += 100) {
    const { error } = await client.storage
      .from('report-photos')
      .remove(paths.slice(index, index + 100));
    if (error) throw error;
  }
}

// Helper: verify admin credentials from bearer token
async function verifyAdminCaller(req: Request): Promise<{ isAdmin: boolean; userId?: string; email?: string }> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAdmin: false };
  }

  const token = authHeader.split(' ')[1];
  try {
    const callerSupabase = createCallerClient(token);
    const { data: { user }, error } = await callerSupabase.auth.getUser(token);
    if (error || !user) {
      return { isAdmin: false };
    }

    const { data: profile } = await callerSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = (profile?.role || '').toString().toUpperCase();
    const isAdmin =
      role === 'SUPER_ADMIN' ||
      role === 'MUNICIPAL_ADMIN' ||
      role === 'SUPERVISOR' ||
      role === 'ADMIN';

    return { isAdmin, userId: user.id, email: user.email };
  } catch (err) {
    console.error('Admin token verification error:', err);
    return { isAdmin: false };
  }
}

// -------------------------------------------------------------
// PERMANENTLY DELETE A REPORT AND ITS EVIDENCE
// -------------------------------------------------------------
app.post(['/api/admin/reject-report', '/api/admin/delete-report'], async (req: Request, res: Response) => {
  try {
    const { isAdmin, userId: adminUserId } = await verifyAdminCaller(req);
    if (!isAdmin) return res.status(403).json({ success: false, error: 'Unauthorized.' });
    const accessToken = req.headers.authorization!.slice('Bearer '.length);
    const callerSupabase = createCallerClient(accessToken);

    const reportKey = typeof req.body?.reportId === 'string' ? req.body.reportId.trim() : '';
    const deletionReason = req.body?.reason === 'admin_rejection' ? 'admin_rejection' : 'admin_delete';
    if (!reportKey || reportKey.length > 100) {
      return res.status(400).json({ success: false, error: 'A valid report ID is required.' });
    }

    let reportQuery = callerSupabase.from('reports').select('id, report_number');
    reportQuery = isUuid(reportKey)
      ? reportQuery.eq('id', reportKey)
      : reportQuery.eq('report_number', reportKey);
    const { data: report, error: reportLookupError } = await reportQuery.maybeSingle();
    if (reportLookupError) return res.status(500).json({ success: false, error: reportLookupError.message });

    // Permit retries after a report row has been removed, so any leftover files can still be cleaned up.
    const reportId = report?.id || (isUuid(reportKey) ? reportKey : null);
    if (!reportId) return res.status(404).json({ success: false, error: 'Report not found.' });

    const paths = await getAllReportStoragePaths(callerSupabase, reportId);
    await removeReportStoragePaths(callerSupabase, paths);

    if (report) {
      const { error: notificationError } = await callerSupabase
        .from('notifications')
        .delete()
        .eq('report_id', reportId);
      if (notificationError) {
        return res.status(500).json({ success: false, error: `Unable to remove report notifications: ${notificationError.message}` });
      }

      const { error: deleteError } = await callerSupabase
        .from('reports')
        .delete()
        .eq('id', reportId);
      if (deleteError) return res.status(500).json({ success: false, error: deleteError.message });

      const { error: auditError } = await callerSupabase
        .from('audit_logs')
        .delete()
        .eq('entity_type', 'REPORT')
        .in('entity_id', [reportId, report.report_number]);
      if (auditError) {
        return res.status(500).json({ success: false, error: `Report deleted, but report audit details could not be removed: ${auditError.message}` });
      }

      const remainingPaths = await listReportStoragePaths(callerSupabase, reportId);
      if (remainingPaths.length > 0) {
        try {
          await removeReportStoragePaths(callerSupabase, remainingPaths);
        } catch (cleanupError) {
          const message = cleanupError instanceof Error ? cleanupError.message : 'Unknown storage error.';
          return res.status(500).json({ success: false, error: `Report deleted, but remaining evidence cleanup failed: ${message}` });
        }
      }
    }

    const { error: logError } = await callerSupabase.from('audit_logs').insert({
      user_id: adminUserId,
      action: 'DELETE_REPORT',
      entity_type: 'REPORT',
      metadata: { reason: deletionReason },
    });
    if (logError) console.error('Report deletion audit logging failed:', logError);

    return res.json({ success: true });
  } catch (error) {
    console.error('Permanent report deletion failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'Unable to permanently delete the report and its evidence.',
    });
  }
});

// -------------------------------------------------------------
// EDIT REPORT DETAILS (ADMIN ONLY)
// -------------------------------------------------------------
app.patch('/api/admin/reports/:reportId', async (req: Request, res: Response) => {
  try {
    const { isAdmin, userId: adminUserId } = await verifyAdminCaller(req);
    if (!isAdmin) return res.status(403).json({ success: false, error: 'Unauthorized.' });
    const accessToken = req.headers.authorization!.slice('Bearer '.length);
    const callerSupabase = createCallerClient(accessToken);

    const reportKey = req.params.reportId.trim();
    if (!reportKey || reportKey.length > 100) {
      return res.status(400).json({ success: false, error: 'A valid report ID is required.' });
    }

    const { issueType, title, description, priority, ward, city, address, latitude, longitude, accuracy } = req.body || {};
    const issueTypes = ['pipeline_leakage', 'low_pressure', 'dirty_water', 'no_water', 'broken_tap', 'other'];
    const priorities = ['low', 'medium', 'high', 'critical'];
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 255) {
      return res.status(400).json({ success: false, error: 'Title is required and must be at most 255 characters.' });
    }
    if (!issueTypes.includes(issueType) || !priorities.includes(priority)) {
      return res.status(400).json({ success: false, error: 'Select a valid issue type and priority.' });
    }
    if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90
      || typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({ success: false, error: 'Enter valid GPS coordinates.' });
    }
    if (accuracy !== null && accuracy !== undefined && (typeof accuracy !== 'number' || !Number.isFinite(accuracy) || accuracy < 0)) {
      return res.status(400).json({ success: false, error: 'GPS accuracy must be a non-negative number.' });
    }
    const optionalTextFields: Array<[string, unknown, number]> = [
      ['Description', description, 10000],
      ['Ward', ward, 100],
      ['City', city, 100],
      ['Address', address, 2000],
    ];
    for (const [label, value, maxLength] of optionalTextFields) {
      if (value !== null && value !== undefined && (typeof value !== 'string' || value.length > maxLength)) {
        return res.status(400).json({ success: false, error: `${label} must be at most ${maxLength} characters.` });
      }
    }

    let reportQuery = callerSupabase.from('reports').select('id, report_number');
    reportQuery = isUuid(reportKey)
      ? reportQuery.eq('id', reportKey)
      : reportQuery.eq('report_number', reportKey);
    const { data: report, error: lookupError } = await reportQuery.maybeSingle();
    if (lookupError) return res.status(500).json({ success: false, error: lookupError.message });
    if (!report) return res.status(404).json({ success: false, error: 'Report not found.' });

    const { error: updateError } = await callerSupabase
      .from('reports')
      .update({
        issue_type: issueType,
        title: title.trim(),
        description: typeof description === 'string' && description.trim() ? description.trim() : null,
        priority,
        ward_name: typeof ward === 'string' && ward.trim() ? ward.trim() : null,
        city: typeof city === 'string' && city.trim() ? city.trim() : null,
        address: typeof address === 'string' && address.trim() ? address.trim() : null,
        latitude,
        longitude,
        accuracy: accuracy ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', report.id);
    if (updateError) return res.status(500).json({ success: false, error: updateError.message });

    const { error: auditError } = await callerSupabase.from('audit_logs').insert({
      user_id: adminUserId,
      action: 'UPDATE_REPORT_DETAILS',
      entity_type: 'REPORT',
      entity_id: report.id,
      metadata: { report_number: report.report_number },
    });
    if (auditError) console.error('Report edit audit logging failed:', auditError);

    return res.json({ success: true });
  } catch (error) {
    console.error('Report update failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unable to update report details.',
    });
  }
});

// -------------------------------------------------------------
// SECURE ADMIN TEAM MEMBER CREATION ENDPOINT
// -------------------------------------------------------------
app.post('/api/admin/create-team-member', async (req: Request, res: Response) => {
  try {
    const { isAdmin, userId: adminUserId, email: adminEmail } = await verifyAdminCaller(req);
    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Only Municipal Administrators can create Team Members.' });
    }
    if (!requireServiceRole(res, 'Team-member account creation requires SUPABASE_SERVICE_ROLE_KEY on the server. Add it to the server environment (never a VITE_ variable) and restart the server.')) return;

    const {
      fullName,
      email,
      phone,
      designation,
      department,
      assignedArea,
      ward,
      teamName,
      responsibilities,
      password,
      avatarUrl,
    } = req.body || {};

    const fields: Array<[string, unknown, number]> = [
      ['Full name', fullName, 255],
      ['Email', email, 320],
      ['Phone', phone, 50],
      ['Designation', designation, 100],
      ['Department', department, 100],
      ['Assigned area', assignedArea, 150],
      ['Ward', ward, 100],
      ['Team name', teamName, 150],
    ];
    for (const [label, value, maxLength] of fields) {
      if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
        return res.status(400).json({ success: false, error: `${label} is required and must be at most ${maxLength} characters.` });
      }
    }
    if (typeof password !== 'string' || password.length < 6 || password.length > 72) {
      return res.status(400).json({ success: false, error: 'Password must be between 6 and 72 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
    }
    if (responsibilities !== undefined && (typeof responsibilities !== 'string' || responsibilities.length > 2000)) {
      return res.status(400).json({ success: false, error: 'Responsibilities must be at most 2000 characters.' });
    }
    if (avatarUrl !== undefined && (typeof avatarUrl !== 'string' || avatarUrl.length > 2048)) {
      return res.status(400).json({ success: false, error: 'Avatar URL must be at most 2048 characters.' });
    }

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanDesignation = designation.trim();
    const cleanDepartment = department.trim();
    const cleanAssignedArea = assignedArea.trim();
    const cleanTeamName = teamName.trim();

    const { data: team, error: teamError } = await serverSupabase
      .from('field_teams')
      .select('id, name')
      .eq('name', cleanTeamName)
      .maybeSingle();
    if (teamError) {
      return res.status(500).json({ success: false, error: `Unable to verify field team: ${teamError.message}` });
    }
    if (!team) {
      return res.status(400).json({ success: false, error: 'Select an existing field team.' });
    }
    const { data: wardRecord, error: wardError } = await serverSupabase
      .from('wards')
      .select('id, ward_number, ward_name, city')
      .eq('ward_number', ward.trim())
      .maybeSingle();
    if (wardError) {
      return res.status(500).json({ success: false, error: `Unable to verify municipal ward: ${wardError.message}` });
    }
    if (!wardRecord) {
      return res.status(400).json({ success: false, error: 'Select an existing municipal ward.' });
    }

    // Never accept a role from the browser; team accounts are always FIELD_TEAM.
    const targetRole = 'FIELD_TEAM';

    const { data: existingProfile, error: profileLookupError } = await serverSupabase
      .from('profiles')
      .select('id, email')
      .eq('email', cleanEmail)
      .maybeSingle();
    if (profileLookupError) {
      return res.status(500).json({ success: false, error: `Unable to verify account email: ${profileLookupError.message}` });
    }
    if (existingProfile) {
      return res.status(409).json({ success: false, error: 'A user account with this email address already exists.' });
    }

    // Supabase Admin Auth is invoked only on the server with SUPABASE_SERVICE_ROLE_KEY.
    const { data: adminAuthData, error: adminAuthErr } = await serverSupabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        role: targetRole,
        department: cleanDepartment,
        designation: cleanDesignation,
      },
    });
    if (adminAuthErr) {
      return res.status(adminAuthErr.message.toLowerCase().includes('already') ? 409 : 400)
        .json({ success: false, error: adminAuthErr.message });
    }
    const createdUserId = adminAuthData.user?.id;
    if (!createdUserId) {
      return res.status(500).json({ success: false, error: 'Supabase Auth did not return a user ID.' });
    }

    const rollbackAuthUser = async () => {
      const { error } = await serverSupabase.auth.admin.deleteUser(createdUserId);
      if (error) {
        console.error('Failed to roll back newly created team auth user:', error);
        return error.message;
      }
      return null;
    };

    // 2. Create the profile with a hard-coded non-admin role.
    const { error: profileError } = await serverSupabase.from('profiles').insert({
      id: createdUserId,
      email: cleanEmail,
      full_name: cleanName,
      phone: cleanPhone,
      role: targetRole,
      ward_id: wardRecord.id,
      ward_name: wardRecord.ward_name,
      city: wardRecord.city,
      avatar_url: typeof avatarUrl === 'string' && avatarUrl.trim() ? avatarUrl.trim() : null,
    });
    if (profileError) {
      const rollbackError = await rollbackAuthUser();
      return res.status(500).json({
        success: false,
        error: `Unable to create team member profile: ${profileError.message}${rollbackError ? ` Account cleanup also failed: ${rollbackError}` : ''}`,
      });
    }

    // 3. Link the profile to the selected field team.
    const teamMemberRecord = {
      team_id: team.id,
      user_id: createdUserId,
      profile_id: createdUserId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      role: cleanDesignation,
      designation: cleanDesignation,
      department: cleanDepartment,
      assigned_area: cleanAssignedArea,
      ward: wardRecord.ward_number,
      team_name: team.name,
      responsibilities: typeof responsibilities === 'string' ? responsibilities.trim() || null : null,
      status: 'active',
      avatar_url: typeof avatarUrl === 'string' && avatarUrl.trim() ? avatarUrl.trim() : null,
    };

    const { data: insertedMember, error: insertErr } = await serverSupabase
      .from('team_members')
      .insert(teamMemberRecord)
      .select()
      .maybeSingle();
    if (insertErr || !insertedMember) {
      const rollbackError = await rollbackAuthUser();
      return res.status(500).json({
        success: false,
        error: `Unable to create team member: ${insertErr?.message || 'Database returned no team member record.'}${rollbackError ? ` Account cleanup also failed: ${rollbackError}` : ''}`,
      });
    }

    // 4. Log in audit_logs
    try {
      await serverSupabase.from('audit_logs').insert({
        user_id: adminUserId || null,
        action: 'CREATE_TEAM_MEMBER',
        entity_type: 'TEAM_MEMBER',
        entity_id: createdUserId,
        metadata: {
          name: cleanName,
          email: cleanEmail,
          designation: cleanDesignation,
          department: cleanDepartment,
          assignedArea: cleanAssignedArea,
          assignedBy: adminEmail || 'Admin',
        },
      });
    } catch (auditErr) {
      console.warn('Audit log write error:', auditErr);
    }

    return res.json({
      success: true,
      teamMember: insertedMember,
      message: 'Team member account created successfully.',
    });
  } catch (err) {
    console.error('Error creating team member:', err);
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Internal server error while creating team member.',
    });
  }
});

// -------------------------------------------------------------
// UPDATE TEAM MEMBER STATUS / DETAILS
// -------------------------------------------------------------
app.post('/api/admin/update-team-member', async (req: Request, res: Response) => {
  try {
    const { isAdmin, userId: adminUserId } = await verifyAdminCaller(req);
    if (!isAdmin) return res.status(403).json({ success: false, error: 'Unauthorized.' });
    if (!requireServiceRole(res, 'Team-member updates require a valid server-side Supabase service-role key.')) return;

    const { id, updates } = req.body;
    if (!id || !updates) {
      return res.status(400).json({ success: false, error: 'Member ID and updates required' });
    }

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.fullName) payload.name = updates.fullName;
    if (updates.phone) payload.phone = updates.phone;
    if (updates.designation) {
      payload.designation = updates.designation;
      payload.role = updates.designation;
    }
    if (updates.department) payload.department = updates.department;
    if (updates.assignedArea) payload.assigned_area = updates.assignedArea;
    if (updates.ward) payload.ward = updates.ward;
    if (updates.teamName) payload.team_name = updates.teamName;
    if (updates.responsibilities) payload.responsibilities = updates.responsibilities;
    if (updates.status) payload.status = updates.status;

    const { error: updateError } = await serverSupabase
      .from('team_members')
      .update(payload)
      .eq('id', id);
    if (updateError) return res.status(400).json({ success: false, error: updateError.message });

    // Also sync profiles if user_id is linked
    if (updates.fullName || updates.phone) {
      const { data: member } = await serverSupabase
        .from('team_members')
        .select('user_id')
        .eq('id', id)
        .maybeSingle();

      if (member?.user_id) {
        const profileUpdates: Record<string, any> = {};
        if (updates.fullName) profileUpdates.full_name = updates.fullName;
        if (updates.phone) profileUpdates.phone = updates.phone;
        const { error: profileUpdateError } = await serverSupabase.from('profiles').update(profileUpdates).eq('id', member.user_id);
        if (profileUpdateError) return res.status(400).json({ success: false, error: profileUpdateError.message });
      }
    }

    // Audit log
    await serverSupabase.from('audit_logs').insert({
      user_id: adminUserId,
      action: 'UPDATE_TEAM_MEMBER',
      entity_type: 'TEAM_MEMBER',
      entity_id: id,
      metadata: updates,
    });

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// TOGGLE STATUS (ACTIVATE / DEACTIVATE)
// -------------------------------------------------------------
app.post('/api/admin/toggle-team-status', async (req: Request, res: Response) => {
  try {
    const { isAdmin, userId: adminUserId } = await verifyAdminCaller(req);
    if (!isAdmin) return res.status(403).json({ success: false, error: 'Unauthorized.' });
    if (!requireServiceRole(res, 'Team status changes require a valid server-side Supabase service-role key.')) return;

    const { id, status } = req.body;
    if (!id || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Member ID and target status required' });
    }

    const { error: updateError } = await serverSupabase
      .from('team_members')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (updateError) return res.status(400).json({ success: false, error: updateError.message });

    await serverSupabase.from('audit_logs').insert({
      user_id: adminUserId,
      action: status === 'active' ? 'ENABLE_TEAM_MEMBER' : 'DISABLE_TEAM_MEMBER',
      entity_type: 'TEAM_MEMBER',
      entity_id: id,
      metadata: { newStatus: status },
    });

    return res.json({ success: true, status });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// RESET PASSWORD FOR TEAM MEMBER
// -------------------------------------------------------------
app.post('/api/admin/reset-team-password', async (req: Request, res: Response) => {
  try {
    const { isAdmin } = await verifyAdminCaller(req);
    if (!isAdmin) return res.status(403).json({ success: false, error: 'Unauthorized.' });
    if (!requireServiceRole(res, 'Password administration requires a valid server-side Supabase service-role key.')) return;
    const { email, memberId } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required.' });
    const { error: resetError } = await serverSupabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (resetError) return res.status(400).json({ success: false, error: resetError.message });

    await serverSupabase.from('audit_logs').insert({
      action: 'RESET_PASSWORD',
      entity_type: 'TEAM_MEMBER',
      entity_id: memberId || email,
      metadata: { email },
    });

    return res.json({ success: true, message: 'Password reset email requested.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// MOUNT VITE MIDDLEWARE (DEV) OR STATIC ASSETS (PROD)
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const listenOnPort = (port: number): Promise<number> =>
    new Promise((resolve, reject) => {
      const server = app.listen(port, '0.0.0.0', () => {
        const address = server.address();
        const actualPort = typeof address === 'object' && address ? address.port : port;
        console.log(`JalSetu server running on http://0.0.0.0:${actualPort}`);
        resolve(actualPort);
      });

      server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`Port ${port} is already in use. Retrying on ${port + 1}...`);
          resolve(listenOnPort(port + 1));
          return;
        }

        reject(err);
      });
    });

  const port = await listenOnPort(DEFAULT_PORT);
  console.log(`Using active port: ${port}`);
}

startServer();
