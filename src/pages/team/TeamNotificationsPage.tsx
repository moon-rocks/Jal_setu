import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileCheck2,
  ExternalLink,
  ShieldCheck,
  Clock,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teamMemberService } from '../../services/teamMemberService';
import { TeamNotificationItem } from '../../types/teamMember';

export const TeamNotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<TeamNotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    async function load() {
      const list = await teamMemberService.getTeamNotifications(user?.id);
      setNotifications(list);
    }
    load();
  }, [user?.id]);

  const handleMarkAsRead = async (id: string) => {
    await teamMemberService.markNotificationRead(id);
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAll = async () => {
    for (const n of notifications) {
      if (!n.isRead) await teamMemberService.markNotificationRead(n.id);
    }
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const filtered = notifications.filter((n) => (filter === 'unread' ? !n.isRead : true));

  return (
    <div className="space-y-6 select-none font-sans text-left max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-400" />
            <span>Field Notifications</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Dispatch alerts, supervisory approvals, and priority change updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMarkAll}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer border border-slate-700 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filter === 'unread'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Unread ({notifications.filter((n) => !n.isRead).length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#0E1A30] border border-slate-800 text-center text-slate-400 text-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">All Caught Up</p>
            <p>You have no unread field notifications.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all text-left space-y-2 ${
                !item.isRead
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-[#0E1A30] border-slate-800'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm tracking-tight">
                    {item.title}
                  </span>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {item.createdAt}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {item.message}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                {item.reportId ? (
                  <NavLink
                    to={`/team/reports/${item.reportId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:underline"
                  >
                    <span>Open Task {item.reportId}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </NavLink>
                ) : (
                  <span />
                )}

                {!item.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(item.id)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
