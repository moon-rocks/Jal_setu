import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from '../ui/Dropdown';
import { useLocationContext } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  FileText,
  Bell,
  Shield,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  Home,
  PlusCircle,
  Droplets,
  Megaphone,
  BookOpen,
  MapPin,
  CheckCircle2,
  ExternalLink,
  HardHat,
} from 'lucide-react';

export const CitizenProfileMenu: React.FC = () => {
  const navigate = useNavigate();
  const { location } = useLocationContext();
  const { user, profile } = useAuth();
  const displayName = profile?.fullName || user?.email || 'Citizen';
  const displayWard = profile?.wardName || (location ? `${location.wardNumber || location.ward}, ${location.city}` : 'Ward not assigned');

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <Dropdown
      width="w-72 sm:w-80"
      trigger={
        <div
          role="button"
          tabIndex={0}
          aria-label="User Account Menu"
          className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100/90 active:scale-95 transition-all cursor-pointer select-none group border border-transparent hover:border-slate-200/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="hidden xl:block text-left text-xs leading-tight pr-0.5">
            <p className="font-bold text-slate-800 group-hover:text-sky-700 transition-colors">
              {displayName}
            </p>
            <p className="text-slate-400 text-[10px]">{displayWard}</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
        </div>
      }
    >
      {/* User Header Profile Card */}
      <div className="p-3.5 bg-gradient-to-br from-sky-50/70 via-white to-blue-50/50 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white text-sm font-bold shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900 tracking-tight">{displayName}</p>
              <p className="text-[11px] text-slate-500 font-mono truncate">{profile?.email || user?.email || 'Email not provided'}</p>
            </div>
          </div>
            {user && <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
              Signed in
            </span>}
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
          <span className="flex items-center gap-1 truncate max-w-[170px]" title={displayWard}>
            <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="truncate">{displayWard}</span>
          </span>
          <span className="text-[10px] font-medium text-emerald-600 shrink-0 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {location ? 'GPS Verified' : 'GPS Ready'}
          </span>
        </div>
      </div>

      {/* Primary Navigation Links */}
      <div className="py-1.5 border-b border-slate-100">
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Civic Navigation
        </div>

        <button
          type="button"
          onClick={() => handleNavigate('/home')}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Home className="w-4 h-4 text-slate-400" />
            <span>Dashboard</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleNavigate('/report')}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-4 h-4 text-sky-600" />
            <span>Report Water Issue</span>
          </div>
          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full bg-sky-600 text-white">
            Action
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleNavigate('/my-reports')}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>My Reports & Complaints</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleNavigate('/services')}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Droplets className="w-4 h-4 text-slate-400" />
            <span>Water Services</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleNavigate('/notices')}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Megaphone className="w-4 h-4 text-slate-400" />
            <span>Notices & Updates</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleNavigate('/awareness')}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span>Water Awareness</span>
          </div>
        </button>
      </div>

      {/* Account & Help */}
      <div className="py-1.5 border-b border-slate-100">
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Account & Settings
        </div>

        <button
          type="button"
          onClick={() => handleNavigate('/profile')}
          className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <User className="w-4 h-4 text-slate-400" />
          <span>My Profile Details</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavigate('/settings')}
          className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Notification & Privacy</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavigate('/help')}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Help & Support</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">1800-3456-789</span>
        </button>
      </div>

      {/* Authorized Administration & Field Portals */}
      <div className="p-2 border-b border-slate-100 bg-slate-50/50 space-y-1.5">
        <button
          type="button"
          onClick={() => handleNavigate('/team/login')}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all shadow-xs cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <HardHat className="w-4 h-4 text-amber-400" />
            <span>Team Member Login</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
        </button>

        <button
          type="button"
          onClick={() => handleNavigate('/admin/login')}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-white text-xs font-medium transition-all shadow-xs cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <span>Municipal Admin Portal</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400 transition-colors" />
        </button>
      </div>

      {/* Logout */}
      <div className="p-1">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50/80 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </Dropdown>
  );
};
