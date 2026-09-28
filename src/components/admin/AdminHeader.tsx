import React, { useState, useEffect } from 'react';
import { Menu, Search, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import { JalSetuLogo } from '../ui/JalSetuLogo';
import { AdminNotificationMenu } from './AdminNotificationMenu';
import { AdminProfileMenu } from './AdminProfileMenu';
import { AdminSearchBar } from './AdminSearchBar';
import { NavLink } from 'react-router-dom';

export interface AdminHeaderProps {
  onOpenDrawer: () => void;
  selectedCity?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onOpenDrawer,
  selectedCity = 'Muzaffarpur',
}) => {
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Formatted date and time
      const formatted = now.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        weekday: 'short',
      });
      const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setCurrentDateTime(`${formatted}, ${time}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-18 px-4 sm:px-6 bg-white border-b border-slate-200/90 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left: Mobile hamburger or brand */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open admin navigation menu"
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="md:hidden">
          <JalSetuLogo size="sm" adminBadge={true} showTagline={false} />
        </div>

        {/* Admin Search Bar */}
        <div className="hidden md:flex items-center relative w-72 lg:w-96">
          <AdminSearchBar />
        </div>
      </div>

      {/* Right zone: Location, Date & Time, Citizen Switcher, Notifications, Admin Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* City Location */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-sky-600" />
          <span>{selectedCity}</span>
        </div>

        {/* Date Time */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentDateTime || '25 Sep 2026, Thu, 9:41 AM'}</span>
        </div>

        {/* Portal Switcher Button */}
        <NavLink
          to="/home"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold transition-all shadow-xs"
          title="Switch to Citizen Portal"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-sky-600" />
          <span>Citizen Portal</span>
        </NavLink>

        <AdminNotificationMenu />
        <AdminProfileMenu />
      </div>
    </header>
  );
};
