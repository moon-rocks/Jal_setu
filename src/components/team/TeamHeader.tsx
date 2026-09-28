import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  HardHat,
  MapPin,
  LogOut,
  Radio,
  Menu,
  X,
  Phone,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { JalSetuLogo } from '../ui/JalSetuLogo';
import { useAuth } from '../../context/AuthContext';
import { teamMemberService } from '../../services/teamMemberService';
import { TeamNotificationItem } from '../../types/teamMember';

export interface TeamHeaderProps {
  onToggleMobileMenu?: () => void;
}

export const TeamHeader: React.FC<TeamHeaderProps> = ({ onToggleMobileMenu }) => {
  const { user, profile, teamMemberProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<TeamNotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    async function loadNotifs() {
      const list = await teamMemberService.getTeamNotifications(user?.id);
      setNotifications(list);
    }
    loadNotifs();
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    for (const n of notifications) {
      if (!n.isRead) {
        await teamMemberService.markNotificationRead(n.id);
      }
    }
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
  };

  const displayName = teamMemberProfile?.name || profile?.fullName || 'Field Engineer';
  const displayRole = teamMemberProfile?.designation || 'Role unassigned';
  const displayArea = teamMemberProfile?.assignedArea || 'Area unassigned';

  return (
    <header className="h-16 bg-[#0B1527] border-b border-slate-800 text-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 select-none">
      {/* Left: Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <NavLink to="/team/dashboard" className="flex items-center gap-2">
          <JalSetuLogo size="sm" variant="light" showTagline={false} />
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-300 tracking-wide uppercase">
            Field Force
          </span>
        </NavLink>
      </div>

      {/* Center: Real-time Dispatch Badge / Assigned Area */}
      <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <Radio className="w-3.5 h-3.5" />
          <span>Active Patrol</span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="flex items-center gap-1.5 text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>{displayArea}</span>
        </div>
      </div>

      {/* Right: Notifications & Profile Bar */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center font-mono">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0E1A30] border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Field Notifications
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-amber-400 hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    No field notifications at this time.
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`pt-2 pb-1 text-xs space-y-1 ${
                        !n.isRead ? 'bg-amber-500/5 -mx-2 px-2 rounded-lg' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{n.title}</span>
                        <span className="text-[10px] text-slate-500">{n.createdAt}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{n.message}</p>
                      {n.reportId && (
                        <NavLink
                          to={`/team/reports/${n.reportId}`}
                          onClick={() => setShowNotifDropdown(false)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:underline pt-0.5"
                        >
                          <span>Open Assignment</span>
                          <ExternalLink className="w-3 h-3" />
                        </NavLink>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-slate-800 pt-2 text-center">
                <NavLink
                  to="/team/notifications"
                  onClick={() => setShowNotifDropdown(false)}
                  className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors"
                >
                  View All Notifications →
                </NavLink>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <NavLink
            to="/team/profile"
            className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center text-xs">
              <HardHat className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left text-xs leading-tight">
              <p className="font-bold text-white truncate max-w-[130px]">{displayName}</p>
              <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{displayRole}</p>
            </div>
          </NavLink>

          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate('/team/login');
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Log Out"
            aria-label="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
