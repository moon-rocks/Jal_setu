import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from '../ui/Dropdown';
import {
  UserCheck,
  Bell,
  Sliders,
  HelpCircle,
  LogOut,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminProfileMenu: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const adminName = profile?.fullName || 'Municipal Officer';
  const adminRole = profile?.role ? profile.role.replace(/_/g, ' ') : 'Municipal Admin';
  const initial = adminName.charAt(0).toUpperCase() || 'A';

  return (
    <Dropdown
      width="w-64"
      trigger={
        <div className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors select-none cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            {initial}
          </div>
          <div className="hidden lg:block text-left text-xs leading-tight">
            <p className="font-bold text-slate-900 truncate max-w-[130px]">{adminName}</p>
            <p className="text-slate-500 text-[11px] truncate max-w-[130px]">{adminRole}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      }
    >
      <div className="p-3 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-sky-600" />
          <span className="text-xs font-bold text-slate-900 truncate">
            {adminName}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">{profile?.email || 'admin.water@muzaffarpur.gov.in'}</p>
        <span className="inline-block mt-1.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-mono">
          {adminRole}
        </span>
      </div>

      <div className="py-1">
        <button
          type="button"
          onClick={() => navigate('/admin/settings')}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <UserCheck className="w-4 h-4 text-slate-400" />
          <span>Admin Profile</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/alerts')}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4 text-slate-400" />
          <span>Notifications</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/settings')}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Sliders className="w-4 h-4 text-slate-400" />
          <span>System Settings</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/settings')}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>Help & Support</span>
        </button>
      </div>

      <div className="pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </Dropdown>
  );
};
