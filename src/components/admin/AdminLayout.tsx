import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { AdminSidebar, ADMIN_NAV_ITEMS } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { Drawer } from '../ui/Drawer';
import { JalSetuLogo } from '../ui/JalSetuLogo';
import { ArrowLeft, Droplet } from 'lucide-react';
import { RouteBackButton } from '../common/RouteBackButton';

export const AdminLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const location = useLocation();

  const handleCloseDrawer = () => {
    setIsMobileDrawerOpen(false);
  };

  return (
    <div className="flex h-dvh min-h-screen w-full min-w-0 bg-slate-100/70 overflow-hidden font-sans">
      {/* Desktop Left Sidebar */}
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Mobile Off-canvas Admin Drawer */}
      <Drawer
        isOpen={isMobileDrawerOpen}
        onClose={handleCloseDrawer}
        side="left"
        width="w-72"
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="mb-4 pb-3 border-b border-slate-100">
              <JalSetuLogo size="sm" adminBadge={true} showTagline={false} />
            </div>

            <nav className="space-y-1">
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

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
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <NavLink
              to="/home"
              onClick={handleCloseDrawer}
              className="flex items-center justify-between p-3 rounded-xl bg-sky-50 text-sky-800 border border-sky-100 text-xs font-semibold"
            >
              <span>Back to Citizen Portal</span>
              <ArrowLeft className="w-4 h-4 text-sky-600" />
            </NavLink>

            <div className="text-center text-xs text-slate-400">
              <p className="font-bold text-slate-700">JalSetu Municipal Engine</p>
              <p className="text-[11px] mt-0.5">Muzaffarpur Municipal Corp</p>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Admin Header */}
        <AdminHeader onOpenDrawer={() => setIsMobileDrawerOpen(true)} />

        {/* Viewport page outlet */}
        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto px-3 sm:px-5 xl:px-8 py-4 sm:py-6">
          <div className="w-full max-w-7xl min-w-0 mx-auto">
            <RouteBackButton fallbackPath="/admin" homePaths={['/admin', '/admin/']} />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
