import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, MapPin, Plus, FileText, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const CitizenBottomNav: React.FC = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { path: '/home', labelKey: 'nav.home', label: 'Home', icon: Home },
    { path: '/map', labelKey: 'nav.map', label: 'Map', icon: MapPin },
    { path: '/report', labelKey: 'nav.report', label: 'Report', icon: Plus, isAction: true },
    { path: '/my-reports', labelKey: 'nav.myReports', label: 'My Reports', icon: FileText },
    { path: '/profile', labelKey: 'nav.profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 z-40 px-3 py-2 pb-safe"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path === '/home' && location.pathname === '/');

          if (item.isAction) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                aria-label="Report a Water Problem"
                className="relative -top-5 flex flex-col items-center group cursor-pointer"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/35 border-3 border-white transition-transform group-hover:scale-105 active:scale-95">
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-bold text-sky-700 mt-1">
                  {t(item.labelKey)}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
                isActive
                  ? 'text-sky-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1 tracking-tight">{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
