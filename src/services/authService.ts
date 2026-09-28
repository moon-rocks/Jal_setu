import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

export interface AuthProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'CITIZEN' | 'SUPER_ADMIN' | 'MUNICIPAL_ADMIN' | 'SUPERVISOR' | 'FIELD_TEAM' | 'ANALYST' | 'team_member';
  wardId?: string;
  wardName?: string;
  address?: string;
  city?: string;
  status?: string;
}

export const authService = {
  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getProfile(userId: string): Promise<AuthProfile | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        // Also check team_members table if not found in profiles
        const { data: tm } = await supabase
          .from('team_members')
          .select('*')
          .or(`user_id.eq.${userId},profile_id.eq.${userId}`)
          .maybeSingle();

        if (tm) {
          return {
            id: tm.user_id || tm.id,
            email: tm.email,
            fullName: tm.name,
            phone: tm.phone,
            role: 'FIELD_TEAM',
            wardName: tm.ward,
            city: 'Muzaffarpur',
            status: tm.status,
          };
        }
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        phone: data.phone,
        role: data.role,
        wardId: data.ward_id,
        wardName: data.ward_name,
        address: data.address,
        city: data.city,
        status: data.status,
      };
    } catch (e) {
      console.warn('Failed to fetch profile:', e);
      return null;
    }
  },

  async updateProfile(userId: string, updates: Partial<AuthProfile>): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    try {
      const payload: Record<string, any> = {};
      if (updates.fullName !== undefined) payload.full_name = updates.fullName;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.wardName !== undefined) payload.ward_name = updates.wardName;
      if (updates.address !== undefined) payload.address = updates.address;
      if (updates.city !== undefined) payload.city = updates.city;

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId);

      return !error;
    } catch (e) {
      console.error('Error updating profile:', e);
      return false;
    }
  },

  async signInWithOtp(email: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Database service is not configured.' };
    }
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
        },
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to send OTP' };
    }
  },

  async verifyOtp(email: string, token: string): Promise<{ success: boolean; session?: Session | null; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Database service is not configured.' };
    }
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        type: 'email',
      });
      if (error) {
        return { success: false, error: error.message };
      }

      // Check if profile exists, if not create citizen profile
      if (data.user) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!existingProfile) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            email: data.user.email || email,
            full_name: '',
            role: 'CITIZEN',
          });
        }
      }

      return { success: true, session: data.session };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Verification failed' };
    }
  },

  async signInWithPassword(
    email: string,
    password: string,
    requiredRole?: 'team_member' | 'admin'
  ): Promise<{ success: boolean; user?: User | null; role?: string; profile?: AuthProfile | null; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Authentication service unavailable.' };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { success: false, error: error.message || 'Invalid credentials.' };
      }

      if (!data.user) {
        return { success: false, error: 'Authentication failed. User not found.' };
      }

      // Fetch user profile and verify role
      const profile = await this.getProfile(data.user.id);
      const roleStr = (profile?.role || '').toString().toLowerCase();

      const isTeam = roleStr === 'field_team' || roleStr === 'team_member';
      const isAdmin = roleStr === 'super_admin' || roleStr === 'municipal_admin' || roleStr === 'supervisor' || roleStr === 'admin';

      if (requiredRole === 'team_member') {
        if (!isTeam) {
          // If a non-team member tries to log in through the team portal
          await supabase.auth.signOut();
          return {
            success: false,
            error: 'Unauthorized: This portal is exclusively for Municipal Team Members and Field Personnel. Citizens should use the Citizen Portal.',
          };
        }

        // Check if account is disabled
        if (profile?.status === 'inactive') {
          await supabase.auth.signOut();
          return {
            success: false,
            error: 'Account Disabled: Your team member account has been deactivated. Please contact your Municipal Administrator.',
          };
        }
      } else if (requiredRole === 'admin') {
        if (!isAdmin) {
          await supabase.auth.signOut();
          return {
            success: false,
            error: 'Unauthorized: Access restricted to authorized Municipal Administrators.',
          };
        }
      }

      return { success: true, user: data.user, role: profile?.role || 'CITIZEN', profile };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Sign in failed' };
    }
  },

  async setPassword(password: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Database service is not configured.' };
    }
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to update password' };
    }
  },

  async signOut(): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  },
};

