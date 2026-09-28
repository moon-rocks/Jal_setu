import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { JalSetuLogo } from '../ui/JalSetuLogo';
import { useLanguage } from '../../context/LanguageContext';
import { noticeService } from '../../services/noticeService';
import {
  Home,
  MapPin,
  PlusCircle,
  FileText,
  Bell,
  Droplets,
  Megaphone,
  BookOpen,
  HelpCircle,
  Settings,
  User,
  PanelRightClose,
  PanelRightOpen,
  Shield,
  ArrowRight,
  HardHat,
} from 'lucide-react';

export interface CitizenSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export interface CitizenNavItem {
  path: string;
  labelKey: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  section?: 'main' | 'services' | 'account';
  badge?: string;
}

export const CITIZEN_NAV_ITEMS: CitizenNavItem[] = [
  { path: '/home', labelKey: 'nav.home', label: 'Home', icon: Home, section: 'main' },
  { path: '/map', labelKey: 'nav.map', label: 'Water Map', icon: MapPin, section: 'main' },
  { path: '/report', labelKey: 'nav.report', label: 'Report Issue', icon: PlusCircle, highlight: true, section: 'main', badge: 'Action' },
  { path: '/my-reports', labelKey: 'nav.myReports', label: 'My Reports', icon: FileText, section: 'main' },
  { path: '/services', labelKey: 'nav.services', label: 'Water Services', icon: Droplets, section: 'services' },
  { path: '/notices', labelKey: 'nav.notices', label: 'Notices', icon: Megaphone, section: 'services' },
  { path: '/awareness', labelKey: 'nav.awareness', label: 'Awareness', icon: BookOpen, section: 'services' },
  { path: '/help', labelKey: 'nav.help', label: 'Help & Support', icon: HelpCircle, section: 'account' },
  { path: '/settings', labelKey: 'nav.settings', label: 'Settings', icon: Settings, section: 'account' },
  { path: '/profile', labelKey: 'nav.profile', label: 'Profile', icon: User, section: 'account' },
];

const SECTIONS = [
  { id: 'main', label: 'Overview' },
  { id: 'services', label: 'Water Services' },
  { id: 'account', label: 'Preferences' },
] as const;

export const CitizenSidebar: React.FC<CitizenSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const { t } = useLanguage();
  const [noticeCount, setNoticeCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchNoticeCount = async () => {
      try {
        const notices = await noticeService.getNotices();
        if (isMounted) {
          setNoticeCount(notices.length);
        }
      } catch {
        if (isMounted) {
          setNoticeCount(0);
        }
      }
    };

    void fetchNoticeCount();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <aside
      className={`hidden md:flex flex-col border-l border-slate-200/90 bg-white select-none z-20 shrink-0 sticky top-0 h-screen transition-all duration-250 ease-out ${
        isCollapsed
          ? 'w-0 overflow-hidden border-none opacity-0 pointer-events-none'
          : 'w-64 lg:w-68 opacity-100 shadow-sm'
      }`}
    >
      {/* Brand Header */}
      <div
        className={`h-18 flex items-center border-b border-slate-200/80 px-4 bg-gradient-to-b from-slate-50/75 via-white to-white select-none transition-all duration-200 ease-out ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="group p-2 rounded-xl text-slate-500 hover:text-sky-600 bg-slate-50/80 hover:bg-sky-50 border border-slate-200/70 hover:border-sky-200/90 shadow-2xs active:scale-95 transition-all duration-200 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          {isCollapsed ? (
            <PanelRightOpen className="w-5 h-5 transition-transform duration-200 ease-out group-hover:scale-110" />
          ) : (
            <PanelRightClose className="w-5 h-5 transition-transform duration-200 ease-out group-hover:scale-110 group-hover:translate-x-0.5" />
          )}
        </button>

        {!isCollapsed && (
          <NavLink
            to="/home"
            className="flex items-center overflow-hidden transition-opacity duration-200 ease-out hover:opacity-90"
          >
            <JalSetuLogo size="sm" showTagline={true} />
          </NavLink>
        )}
      </div>

      {/* Navigation List */}
      <nav
        className={`flex-1 overflow-y-auto px-3.5 py-3.5 space-y-4 transition-all duration-200 ease-out ${
          isCollapsed ? 'hidden' : ''
        }`}
      >
        {SECTIONS.map((sec, secIdx) => {
          const sectionItems = CITIZEN_NAV_ITEMS.filter((item) => item.section === sec.id);
          if (sectionItems.length === 0) return null;

          return (
            <div key={sec.id} className="space-y-1.5">
              {/* Section Header or Divider */}
              {!isCollapsed ? (
                <div
                  className={`px-3 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none ${
                    secIdx === 0 ? '' : 'mt-2'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span>{sec.label}</span>
                  </span>
                </div>
              ) : secIdx > 0 ? (
                <div className="h-px bg-slate-100 my-2 mx-2" aria-hidden="true" />
              ) : null}

              {/* Items in Section */}
              {sectionItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path === '/home' && location.pathname === '/');
                const badgeText = item.path === '/notices' ? (noticeCount > 0 ? String(noticeCount) : undefined) : item.badge;

                return (
                  <div key={item.path} className="relative group">
                    <NavLink
                      to={item.path}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ease-out active:scale-[0.98] ${
                        isActive
                          ? 'bg-gradient-to-r from-sky-600 via-sky-600 to-blue-600 text-white shadow-sm shadow-sky-600/30 font-semibold translate-x-0.5'
                          : item.highlight
                          ? 'bg-gradient-to-r from-sky-50 via-blue-50/70 to-sky-100/60 border border-sky-300/80 text-sky-800 hover:from-sky-100 hover:to-blue-100 hover:border-sky-400 hover:translate-x-1 font-semibold shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 hover:translate-x-1'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 transition-transform duration-200 ease-out group-hover:scale-110 ${
                          isActive
                            ? 'text-white'
                            : item.highlight
                            ? 'text-sky-600 group-hover:rotate-6'
                            : 'text-slate-500 group-hover:text-slate-700'
                        }`}
                      />

                      {!isCollapsed && (
                        <>
                          <span className="truncate flex-1 tracking-tight">{t(item.labelKey)}</span>
                          {badgeText && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 tracking-wide transition-all duration-200 ease-out group-hover:scale-105 ${
                                isActive
                                  ? 'bg-white/25 text-white backdrop-blur-xs shadow-2xs'
                                  : item.highlight
                                  ? 'bg-sky-600 text-white shadow-2xs'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {badgeText}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>

                    {/* Tooltip in collapsed mode */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl border border-slate-700/60 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 ease-out whitespace-nowrap z-50 flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {badgeText && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-sky-500 text-white">
                            {badgeText}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer Banner & Portal Switchers */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-100 space-y-1.5">
          <NavLink
            to="/team/login"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all duration-200 group cursor-pointer"
            title="Team Member Field Operations Login"
          >
            <div className="flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-400" />
              <span>Team Member Login</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400 transition-transform duration-200 group-hover:translate-x-1" />
          </NavLink>

          <NavLink
            to="/admin/login"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all duration-200 group cursor-pointer"
            title="Switch to Municipal Admin Portal"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-400" />
              <span>Admin Portal</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-sky-400 transition-transform duration-200 group-hover:translate-x-1" />
          </NavLink>
        </div>
      )}
    </aside>
  );
};
