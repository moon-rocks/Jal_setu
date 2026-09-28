import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService, AuthProfile } from '../services/authService';
import { teamMemberService } from '../services/teamMemberService';
import { TeamMemberProfile } from '../types/teamMember';
import { User, Session } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  profile: AuthProfile | null;
  teamMemberProfile: TeamMemberProfile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isTeamMember: boolean;
  isCitizen: boolean;
  signInWithPassword: (
    email: string,
    pass: string,
    portal?: 'admin' | 'team'
  ) => Promise<{ success: boolean; user?: User | null; role?: string; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  teamMemberProfile: null,
  session: null,
  loading: true,
  isAdmin: false,
  isTeamMember: false,
  isCitizen: false,
  signInWithPassword: async () => ({ success: false }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [teamMemberProfile, setTeamMemberProfile] = useState<TeamMemberProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndTeam = async (userId: string, email?: string) => {
    const p = await authService.getProfile(userId);
    setProfile(p);

    const roleLower = (p?.role || '').toLowerCase();
    if (roleLower === 'field_team' || roleLower === 'team_member') {
      const tm = await teamMemberService.getTeamMemberById(userId);
      if (tm) {
        setTeamMemberProfile(tm);
      } else if (email) {
        const byEmail = (await teamMemberService.getTeamMembers()).find(
          (m) => m.email.toLowerCase() === email.toLowerCase()
        );
        if (byEmail) setTeamMemberProfile(byEmail);
      }
    } else {
      setTeamMemberProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (!isSupabaseConfigured) return;
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (currentUser) {
      await fetchProfileAndTeam(currentUser.id, currentUser.email);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.user) {
            await fetchProfileAndTeam(initialSession.user.id, initialSession.user.email);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchProfileAndTeam(newSession.user.id, newSession.user.email);
        } else {
          setProfile(null);
          setTeamMemberProfile(null);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const roleUpper = (profile?.role || '').toUpperCase();
  const isAdmin =
    roleUpper === 'SUPER_ADMIN' ||
    roleUpper === 'MUNICIPAL_ADMIN' ||
    roleUpper === 'SUPERVISOR' ||
    roleUpper === 'ADMIN';

  const isTeamMember =
    roleUpper === 'FIELD_TEAM' ||
    roleUpper === 'TEAM_MEMBER' ||
    Boolean(teamMemberProfile);

  const isCitizen = !isAdmin && !isTeamMember && (roleUpper === 'CITIZEN' || Boolean(user));

  const signInWithPassword = async (
    email: string,
    pass: string,
    portal?: 'admin' | 'team'
  ) => {
    const targetRole = portal === 'team' ? 'team_member' : portal === 'admin' ? 'admin' : undefined;
    const res = await authService.signInWithPassword(email, pass, targetRole);
    if (res.success && res.user) {
      setUser(res.user);
      if (res.profile) {
        setProfile(res.profile);
      }
      await fetchProfileAndTeam(res.user.id, res.user.email);
    }
    return res;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
    setTeamMemberProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        teamMemberProfile,
        session,
        loading,
        isAdmin,
        isTeamMember,
        isCitizen,
        signInWithPassword,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
