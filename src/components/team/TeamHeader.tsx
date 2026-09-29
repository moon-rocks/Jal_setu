import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  HardHat,
  MapPin,
  LogOut,
  Menu,
  ExternalLink,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { JalSetuLogo } from '../ui/JalSetuLogo';
import { useAuth } from '../../context/AuthContext';
import { teamMemberService } from '../../services/teamMemberService';
import { TeamNotificationItem } from '../../types/teamMember';

export interface TeamHeaderProps {
  onOpenDrawer: () => void;
}

export const TeamHeader: React.FC<TeamHeaderProps> = ({ onOpenDrawer }) => {
  const { user, profile, teamMemberProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<TeamNotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    async function loadNotifs() {
      const list = await teamMemberService.getTeamNotifications(user?.id);
      setNotifications(list);
    }
    loadNotifs();
  }, [user?.id]);

  useEffect(() => {
    const updateTime = () => setCurrentDateTime(new Date().toLocaleDateString('en-US', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }));
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

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
    <header className="h-18 shrink-0 px-4 sm:px-6 bg-white border-b border-slate-200/90 flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
      {/* Left: Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        {onOpenDrawer && (
          <button
            type="button"
            onClick={onOpenDrawer}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open team navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="md:hidden">
          <JalSetuLogo size="sm" adminBadge={false} showTagline={false} />
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
            <HardHat className="h-4 w-4" />
          </span>
          <span>Team Member Panel</span>
        </div>
      </div>

      {/* Assignment context */}
      <div className="hidden lg:flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-sky-600" />
          <span>{displayArea}</span>
        </div>
      </div>

      {/* Right: Notifications & Profile Bar */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentDateTime}</span>
        </div>

        <NavLink
          to="/home"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold transition-all shadow-xs"
          title="Switch to Citizen Portal"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-sky-600" />
          <span>Citizen Portal</span>
        </NavLink>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[10px] flex items-center justify-center font-mono">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Field Notifications
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-sky-700 hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    No field notifications at this time.
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`pt-2 pb-1 text-xs space-y-1 ${
                        !n.isRead ? 'bg-sky-50 -mx-2 px-2 rounded-lg' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{n.title}</span>
                        <span className="text-[10px] text-slate-500">{n.createdAt}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                      {n.reportId && (
                        <NavLink
                          to={`/team/reports/${n.reportId}`}
                          onClick={() => setShowNotifDropdown(false)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:underline pt-0.5"
                        >
                          <span>Open Assignment</span>
                          <ExternalLink className="w-3 h-3" />
                        </NavLink>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-slate-100 pt-2 text-center">
                <NavLink
                  to="/team/notifications"
                  onClick={() => setShowNotifDropdown(false)}
                  className="text-xs font-bold text-slate-500 hover:text-sky-700 transition-colors"
                >
                  View All Notifications →
                </NavLink>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <NavLink
            to="/team/profile"
            className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 font-bold flex items-center justify-center text-xs">
              <HardHat className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left text-xs leading-tight">
              <p className="font-bold text-slate-800 truncate max-w-[130px]">{displayName}</p>
              <p className="text-[10px] text-slate-500 truncate max-w-[130px]">{displayRole}</p>
            </div>
          </NavLink>

          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate('/team/login');
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
