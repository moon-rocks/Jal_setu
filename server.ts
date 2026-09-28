import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { createServer as createViteServer } from 'vite';
import path from 'path';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const DEFAULT_PORT = Number(process.env.PORT) || 3000;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and a Supabase API key must be configured in the server environment.');
}

const serverSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Helper: verify admin credentials from bearer token
async function verifyAdminCaller(req: Request): Promise<{ isAdmin: boolean; userId?: string; email?: string }> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAdmin: false };
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await serverSupabase.auth.getUser(token);
    if (error || !user) {
      return { isAdmin: false };
    }

    const { data: profile } = await serverSupabase
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
// SECURE ADMIN TEAM MEMBER CREATION ENDPOINT
// -------------------------------------------------------------
app.post('/api/admin/create-team-member', async (req: Request, res: Response) => {
  try {
    const { isAdmin, userId: adminUserId, email: adminEmail } = await verifyAdminCaller(req);
    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Only Municipal Administrators can create Team Members.' });
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(503).json({ success: false, error: 'Team-member provisioning requires the server-side Supabase service role configuration.' });
    }

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
      status,
      avatarUrl,
    } = req.body;

    if (!fullName || !email || !password || !phone || !designation || !department || !assignedArea || !ward || !teamName) {
      return res.status(400).json({ success: false, error: 'Complete the required team member and assignment fields.' });
    }

    const { data: team, error: teamError } = await serverSupabase
      .from('field_teams')
      .select('id, name')
      .eq('name', teamName)
      .maybeSingle();
    if (teamError || !team) {
      return res.status(400).json({ success: false, error: teamError?.message || 'Select an existing field team.' });
    }
    const { data: wardRecord, error: wardError } = await serverSupabase
      .from('wards')
      .select('id, ward_number, ward_name, city')
      .eq('ward_number', ward)
      .maybeSingle();
    if (wardError || !wardRecord) {
      return res.status(400).json({ success: false, error: wardError?.message || 'Select an existing municipal ward.' });
    }

    // STRICT CHECK: Ensure role is exclusively team_member (FIELD_TEAM)
    const targetRole = 'FIELD_TEAM';

    // 1. Create account in Supabase Auth via detached client
    let createdUserId: string | null = null;

    // Check if user already exists
    const { data: existingProfiles } = await serverSupabase
      .from('profiles')
      .select('id, email')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (existingProfiles) {
      return res.status(409).json({ success: false, error: 'A user account with this email address already exists.' });
    }

    const { data: adminAuthData, error: adminAuthErr } = await (serverSupabase.auth.admin as any).createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: targetRole,
        department,
        designation,
      },
    });
    if (adminAuthErr) {
      return res.status(400).json({ success: false, error: adminAuthErr.message });
    }
    createdUserId = adminAuthData.user.id;

    if (!createdUserId) return res.status(500).json({ success: false, error: 'Supabase Auth did not return a user ID.' });

    // 2. Insert or update record in profiles table
    const { error: profileError } = await serverSupabase.from('profiles').upsert({
      id: createdUserId,
      email: email.trim().toLowerCase(),
      full_name: fullName,
      phone: phone || null,
      role: targetRole,
      ward_id: wardRecord?.id || null,
      ward_name: wardRecord?.ward_name || ward,
      city: wardRecord?.city || null,
      avatar_url: avatarUrl || null,
      created_at: new Date().toISOString(),
    });
    if (profileError) {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        await (serverSupabase.auth.admin as any).deleteUser(createdUserId);
      }
      return res.status(500).json({ success: false, error: profileError.message });
    }

    // 3. Insert into team_members table
    const teamMemberRecord = {
      team_id: team.id,
      user_id: createdUserId,
      profile_id: createdUserId,
      name: fullName,
      email: email.trim().toLowerCase(),
      phone: phone || '',
      role: designation,
      designation,
      department,
      assigned_area: assignedArea,
      ward,
      team_name: teamName,
      responsibilities,
      status: status || 'active',
      avatar_url: avatarUrl || null,
      created_at: new Date().toISOString(),
    };

    const { data: insertedMember, error: insertErr } = await serverSupabase
      .from('team_members')
      .insert(teamMemberRecord)
      .select()
      .maybeSingle();
    if (insertErr || !insertedMember) {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        await (serverSupabase.auth.admin as any).deleteUser(createdUserId);
      }
      return res.status(500).json({ success: false, error: insertErr?.message || 'Unable to create team member.' });
    }

    // 4. Log in audit_logs
    try {
      await serverSupabase.from('audit_logs').insert({
        user_id: adminUserId || null,
        action: 'CREATE_TEAM_MEMBER',
        entity_type: 'TEAM_MEMBER',
        entity_id: createdUserId,
        metadata: {
          name: fullName,
          email: email.trim().toLowerCase(),
          designation,
          department,
          assignedArea,
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
  } catch (err: any) {
    console.error('Error creating team member:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// -------------------------------------------------------------
// UPDATE TEAM MEMBER STATUS / DETAILS
// -------------------------------------------------------------
app.post('/api/admin/update-team-member', async (req: Request, res: Response) => {
  try {
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

    await serverSupabase
      .from('team_members')
      .update(payload)
      .eq('id', id);

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
        await serverSupabase.from('profiles').update(profileUpdates).eq('id', member.user_id);
      }
    }

    // Audit log
    await serverSupabase.from('audit_logs').insert({
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
    const { id, status } = req.body;
    if (!id || !status) {
      return res.status(400).json({ success: false, error: 'Member ID and target status required' });
    }

    await serverSupabase
      .from('team_members')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    await serverSupabase.from('audit_logs').insert({
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
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(503).json({ success: false, error: 'Password administration requires server-side Supabase service role configuration.' });
    }
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
