import React, { useState, useEffect } from 'react';
import { Dropdown } from '../ui/Dropdown';
import { Bell, CheckCheck, ShieldAlert } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { notificationService, AppNotification } from '../../services/notificationService';
import { useRealtimeSubscription } from '../../hooks/useRealtime';

export const AdminNotificationMenu: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [markedAllRead, setMarkedAllRead] = useState(false);

  const fetchNotifications = async () => {
    const data = await notificationService.getNotifications();
    setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useRealtimeSubscription('notifications', () => {
    fetchNotifications();
  });

  const unreadCount = markedAllRead ? 0 : notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    setMarkedAllRead(true);
    await notificationService.markAllRead();
    fetchNotifications();
  };

  return (
    <Dropdown
      width="w-80 sm:w-88"
      trigger={
        <button
          type="button"
          aria-label="View admin alerts and notifications"
          className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
          )}
        </button>
      }
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Operational Alerts
          </h4>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {unreadCount} Active
          </span>
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          className="text-[11px] font-medium text-slate-400 hover:text-sky-600 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <CheckCheck className={`w-3.5 h-3.5 ${unreadCount === 0 ? 'text-emerald-500' : ''}`} />
          <span>{unreadCount === 0 ? 'All caught up' : 'Clear all'}</span>
        </button>
      </div>

      <div className="p-3 max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <EmptyState
            icon={<ShieldAlert className="w-6 h-6 text-slate-300" />}
            title="No new notifications"
            description="High-priority leak telemetry, contamination alerts, and urgent field team dispatches will appear here."
            className="p-6 border-0 bg-transparent"
          />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-left text-xs">
                <p className="font-bold text-slate-900">{n.title}</p>
                <p className="text-slate-600 text-[11px] mt-0.5">{n.message}</p>
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                  {new Date(n.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-2 border-t border-slate-100 text-center bg-slate-50/50 rounded-b-2xl">
        <span className="text-[11px] text-slate-400 font-medium">
          All Municipal SCADA feeds connected
        </span>
      </div>
    </Dropdown>
  );
};
