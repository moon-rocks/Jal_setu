import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Loader2, Wrench, ArrowRight, LogOut } from 'lucide-react';

export const TeamProtectedRoute: React.FC = () => {
  const { user, profile, teamMemberProfile, loading, isTeamMember, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-3 p-4">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        <p className="text-xs tracking-wider uppercase font-semibold text-slate-400">
          Verifying Field Personnel Credentials...
        </p>
      </div>
    );
  }

  // Not authenticated -> redirect to Team Login
  if (!user) {
    return <Navigate to="/team/login" state={{ from: location }} replace />;
  }

  // Check if account is disabled/inactive
  if (teamMemberProfile && teamMemberProfile.status === 'inactive') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Account Deactivated</h2>
        <p className="text-sm text-slate-400 max-w-md mt-2">
          Your Team Member field account has been deactivated by the Municipal Water Division. You cannot access assigned tasks or submit field updates.
        </p>
        <p className="text-xs text-slate-500 mt-2 font-mono">
          Contact: municipal.dispatch@muzaffarpur.gov.in
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => signOut()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Role check: must be team_member / FIELD_TEAM
  if (!isTeamMember) {
    return (
      <div className="min-h-screen bg-[#080E1A] flex flex-col items-center justify-center p-6 text-white text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
          <Wrench className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Access Restricted to Team Members</h2>
        <p className="text-sm text-slate-400 max-w-md mt-2 leading-relaxed">
          The Field Operations Terminal is restricted to authorized field engineers, technicians, and repair personnel. Your account ({profile?.email || user.email}) is registered with role:{' '}
          <span className="font-mono text-sky-400 font-semibold">{profile?.role || 'CITIZEN'}</span>.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/home"
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold transition-colors inline-flex items-center gap-2"
          >
            <span>Go to Citizen Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => signOut()}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Switch Account</span>
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
