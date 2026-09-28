import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Loader2, ArrowRight, LogOut, Wrench } from 'lucide-react';

export const AdminProtectedRoute: React.FC = () => {
  const { user, profile, loading, isAdmin, isTeamMember, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080E1A] flex flex-col items-center justify-center text-white space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        <p className="text-xs tracking-wider uppercase font-semibold text-slate-400">
          Verifying Municipal Authorization...
        </p>
      </div>
    );
  }

  // If user is not logged in
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // If user is logged in as Team Member, deny access to Admin Panel
  if (!isAdmin && isTeamMember) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
          <Wrench className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Administrative Access Required</h2>
        <p className="text-sm text-slate-400 max-w-md mt-2">
          Your account is registered as a Field Team Member. Access to the Municipal Admin Operations Center is reserved for executive authorities and supervisors.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/team/dashboard"
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold transition-colors inline-flex items-center gap-2"
          >
            <span>Open Team Member Dashboard</span>
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

  // If user is logged in as Citizen, deny access
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Access Restricted</h2>
        <p className="text-sm text-slate-400 max-w-md mt-2">
          Your account is registered as a Citizen. Access to the Municipal Admin Operations Center is restricted to verified municipal authorities and field personnel.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/home"
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold transition-colors inline-flex items-center gap-2"
          >
            <span>Return to Citizen Home</span>
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
