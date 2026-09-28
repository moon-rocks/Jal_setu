import React from 'react';
import { EmptyState } from '../../components/ui/EmptyState';
import { BellRing, ShieldCheck } from 'lucide-react';

export const AdminAlertsPage: React.FC = () => {
  return (
    <div className="space-y-6 select-none max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BellRing className="w-6 h-6 text-sky-600" />
            <span>Operational Alerts & SCADA Feeds</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Automated sensor anomalies, chlorine variance warnings, and major main burst triggers.
          </p>
        </div>

      </div>

      <EmptyState
        icon={<ShieldCheck className="w-8 h-8 text-slate-400" />}
        title="No alert data available"
        description="Operational alerts will appear here when a connected alert source publishes records."
        className="my-10"
      />
    </div>
  );
};
