import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck2,
  MapPin,
  Camera,
  User,
} from 'lucide-react';

export const TeamMobileNav: React.FC = () => {
  const items = [
    { to: '/team/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/team/reports', label: 'Tasks', icon: FileCheck2 },
    { to: '/team/map', label: 'Field Map', icon: MapPin },
    { to: '/team/evidence', label: 'Evidence', icon: Camera },
    { to: '/team/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      aria-label="Field navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#071120] border-t border-slate-800 flex items-center justify-around px-2 z-40 select-none shadow-2xl"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 py-1 rounded-xl text-[10px] font-semibold transition-all ${
                isActive
                  ? 'text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`p-1 rounded-lg transition-colors ${
                    isActive ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="mt-0.5">{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};
