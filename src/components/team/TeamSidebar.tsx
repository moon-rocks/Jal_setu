import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck2,
  MapPin,
  Clock,
  CheckCircle2,
  Camera,
  Activity,
  Bell,
  User,
  HelpCircle,
  LogOut,
  HardHat,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Radio,
} from 'lucide-react';
import { JalSetuLogo } from '../ui/JalSetuLogo';
import { useAuth } from '../../context/AuthContext';
import { TEAM_NAV_ITEMS } from './teamNavItems';

export interface TeamSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
}

export const TeamSidebar: React.FC<TeamSidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  onCloseMobile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, teamMemberProfile } = useAuth();

  return (
    <aside
      className={`flex flex-col bg-[#071120] text-slate-200 border-r border-slate-800 transition-all duration-300 select-none z-20 shrink-0 h-full ${
        isCollapsed ? 'w-[74px]' : 'w-64 lg:w-68'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        <NavLink to="/team/dashboard" className="flex items-center overflow-hidden gap-2">
          {isCollapsed ? (
            <div className="mx-auto">
              <JalSetuLogo size="sm" variant="light" showTagline={false} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <JalSetuLogo size="sm" variant="light" showTagline={false} />
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] tracking-wider uppercase">
                Field
              </span>
            </div>
          )}
        </NavLink>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {TEAM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);

          return (
            <div key={item.path} className="relative group">
              <NavLink
                to={item.path}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon
                  className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
                    isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>

              {/* Hover Tooltip in collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-md shadow-lg border border-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Field Duty Status Box */}
      {!isCollapsed && (
        <div className="px-3 py-2">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs text-left">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                Unit Status
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>
            <p className="font-semibold text-white truncate">
              {teamMemberProfile?.teamName || 'No team assigned'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {teamMemberProfile?.assignedArea || 'No area assigned'}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Section: Help & Logout */}
      <div className="p-3 border-t border-slate-800/80 space-y-1">
        <NavLink
          to="/team/help"
          onClick={onCloseMobile}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Help & Protocols</span>}
        </NavLink>

        <button
          type="button"
          onClick={async () => {
            await signOut();
            navigate('/team/login');
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
