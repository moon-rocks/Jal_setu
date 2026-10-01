import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { CitizenSidebar, CITIZEN_NAV_ITEMS } from './CitizenSidebar';
import { CitizenHeader } from './CitizenHeader';
import { Drawer } from '../ui/Drawer';
import { JalSetuLogo } from '../ui/JalSetuLogo';
import { CitizenFooter } from '../common/CitizenFooter';
import { CitizenBottomNav } from './CitizenBottomNav';
import { RouteBackButton } from '../common/RouteBackButton';
import { Shield, Droplets, HardHat, ListChecks } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const CitizenLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();

  const handleCloseDrawer = () => {
    setIsMobileDrawerOpen(false);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50/70 font-sans flex flex-col md:flex-row relative">
      {/* Mobile Off-canvas Drawer on Right */}
      <Drawer
        isOpen={isMobileDrawerOpen}
        onClose={handleCloseDrawer}
        side="right"
        width="w-72"
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="mb-4 pb-3 border-b border-slate-100">
              <JalSetuLogo size="sm" showTagline={true} />
            </div>

            <nav className="space-y-1">
              {CITIZEN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path === '/home' && location.pathname === '/');

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleCloseDrawer}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-sky-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{t(item.labelKey)}</span>
                  </NavLink>
                );
              })}
              <NavLink
                to="/how-it-works"
                onClick={handleCloseDrawer}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  location.pathname === '/how-it-works'
                    ? 'bg-sky-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <ListChecks className={`w-5 h-5 shrink-0 ${location.pathname === '/how-it-works' ? 'text-white' : 'text-slate-500'}`} />
                <span>How JalSetu Works</span>
              </NavLink>
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <NavLink
              to="/team/login"
              onClick={handleCloseDrawer}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900 text-white text-xs font-semibold"
            >
              <div className="flex items-center gap-2">
                <HardHat className="w-4 h-4 text-amber-400" />
                <span>Team Member Login</span>
              </div>
            </NavLink>

            <NavLink
              to="/admin/login"
              onClick={handleCloseDrawer}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-850 text-slate-200 text-xs font-semibold"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-400" />
                <span>{t('nav.adminPortal')}</span>
              </div>
            </NavLink>
          </div>
        </div>
      </Drawer>

      {/* Main Content Region */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <CitizenHeader
          onOpenDrawer={() => setIsMobileDrawerOpen(true)}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Viewport page outlet with CitizenFooter */}
        <main className="flex-1 flex flex-col justify-between">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
            <RouteBackButton fallbackPath="/home" homePaths={['/', '/home']} />
            <Outlet />
          </div>
          <CitizenFooter />
        </main>
      </div>

      {/* Desktop Right Sidebar */}
      <CitizenSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Mobile Bottom Navigation */}
      <CitizenBottomNav />
    </div>
  );
};
