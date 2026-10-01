import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TeamSidebar } from './TeamSidebar';
import { TeamHeader } from './TeamHeader';
import { Drawer } from '../ui/Drawer';
import { RouteBackButton } from '../common/RouteBackButton';

export const TeamLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100/70 font-sans">
      <div className="hidden h-full md:block">
        <TeamSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((previous) => !previous)}
        />
      </div>

      <Drawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        side="left"
        width="w-72"
      >
        <div className="flex h-full flex-col justify-between">
          <TeamSidebar onCloseMobile={() => setIsMobileDrawerOpen(false)} />
        </div>
      </Drawer>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <TeamHeader onOpenDrawer={() => setIsMobileDrawerOpen(true)} />
        <main className="team-panel-content flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <RouteBackButton fallbackPath="/team/dashboard" homePaths={['/team/dashboard']} />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
