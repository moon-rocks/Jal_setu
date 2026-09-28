import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { JalSetuLogo } from '../ui/JalSetuLogo';
import {
  LayoutDashboard,
  FileCheck2,
  MapPin,
  Users2,
  HardHat,
  BellRing,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Droplet,
} from 'lucide-react';

export interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const ADMIN_NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/reports', label: 'Reports', icon: FileCheck2 },
  { path: '/admin/map', label: 'Live Map', icon: MapPin },
  { path: '/admin/team-members', label: 'Team Members', icon: HardHat },
  { path: '/admin/teams', label: 'Field Units', icon: Users2 },
  { path: '/admin/alerts', label: 'Alerts', icon: BellRing },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const location = useLocation();

  return (
    <aside
      className={`hidden md:flex flex-col bg-[#0B1527] text-slate-200 border-r border-slate-800 transition-all duration-300 select-none z-20 shrink-0 ${
        isCollapsed ? 'w-[76px]' : 'w-64 lg:w-70'
      }`}
    >
      {/* Brand Header */}
      <div className="h-18 flex items-center justify-between px-4 border-b border-slate-800/80">
        <NavLink to="/admin" className="flex items-center overflow-hidden">
          {isCollapsed ? (
            <div className="mx-auto">
              <JalSetuLogo size="sm" variant="light" adminBadge={false} showTagline={false} />
            </div>
          ) : (
            <JalSetuLogo size="sm" variant="light" adminBadge={true} showTagline={false} />
          )}
        </NavLink>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ${
            isCollapsed ? 'mx-auto mt-2' : ''
          }`}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);

          return (
            <div key={item.path} className="relative group">
              <NavLink
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-sky-600 text-white font-semibold shadow-sm shadow-sky-600/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>

              {/* Hover Tooltip in collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg border border-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Municipal Civic Banner matching Reference 1 */}
      <div className="p-3 border-t border-slate-800/80">
        {!isCollapsed ? (
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-sky-950/40 to-slate-900 border border-sky-900/30 text-left">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold mb-1">
              <Droplet className="w-3.5 h-3.5" />
              <span>Municipal Dispatch</span>
            </div>
            <p className="text-xs font-bold text-white tracking-tight">
              Clean Water · Stronger Communities
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              A Better Bihar.
            </p>
          </div>
        ) : (
          <div className="flex justify-center p-2 text-sky-400" title="Clean Water. A Better Bihar.">
            <Droplet className="w-5 h-5" />
          </div>
        )}
      </div>
    </aside>
  );
};
