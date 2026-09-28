import React, { useState, useEffect } from 'react';
import { MapContainer } from '../../components/common/MapContainer';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Filter, Layers, Compass, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { useRealtimeSubscription } from '../../hooks/useRealtime';
import { ReportItem } from '../../types';

export const AdminLiveMapPage: React.FC = () => {
  const [selectedWard, setSelectedWard] = useState('all');
  const [selectedIssue, setSelectedIssue] = useState('all');
  const [reports, setReports] = useState<ReportItem[]>([]);

  const fetchReports = async () => {
    const data = await reportService.getReports();
    setReports(data);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useRealtimeSubscription('reports', () => {
    fetchReports();
  });

  const filteredReports = reports.filter((r) => {
    if (selectedWard !== 'all' && !r.location.ward.toLowerCase().includes(selectedWard.toLowerCase())) {
      return false;
    }
    if (selectedIssue !== 'all' && r.issueType !== selectedIssue) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Municipal GIS Live Incident Map
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time geospatial tracking of citizen water issue telemetry across Muzaffarpur ({filteredReports.length} incidents plotted).
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium cursor-pointer focus:outline-none"
          >
            <option value="all">All 15 Wards</option>
            <option value="ward 8">Ward 8</option>
            <option value="ward 9">Ward 9</option>
            <option value="ward 11">Ward 11</option>
            <option value="ward 12">Ward 12</option>
            <option value="ward 14">Ward 14</option>
          </select>

          <select
            value={selectedIssue}
            onChange={(e) => setSelectedIssue(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium cursor-pointer focus:outline-none"
          >
            <option value="all">All Incident Types</option>
            <option value="pipeline_leakage">Pipeline Leakage</option>
            <option value="dirty_water">Dirty Water</option>
            <option value="low_pressure">Low Pressure</option>
            <option value="no_water">No Water Supply</option>
          </select>
        </div>
      </div>

      {/* Map Viewport Container */}
      <MapContainer
        mode="admin"
        title="Muzaffarpur Municipal Water Network"
        subtitle={`Hydrology Layer: Burhi Gandak River Basin · ${filteredReports.length} Active Feeds`}
        emptyMessage={filteredReports.length === 0 ? 'No active reports match the selected filters.' : undefined}
        heightClass="h-[520px] sm:h-[600px]"
      />

      {/* Footer Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="default" padding="sm">
          <p className="text-[10px] uppercase font-bold text-slate-400">GIS Coordinate System</p>
          <p className="text-xs font-bold text-slate-800 mt-0.5">WGS 84 / UTM Zone 45N (Bihar)</p>
        </Card>
        <Card variant="default" padding="sm">
          <p className="text-[10px] uppercase font-bold text-slate-400">Telemetry Feed Status</p>
          <p className="text-xs font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Connected to Muzaffarpur SCADA ({reports.length} Reports Synchronized)
          </p>
        </Card>
        <Card variant="default" padding="sm">
          <p className="text-[10px] uppercase font-bold text-slate-400">Resolution SLA Buffer</p>
          <p className="text-xs font-bold text-slate-800 mt-0.5">Rapid Leakage Target: ≤ 4.0 Hours</p>
        </Card>
      </div>
    </div>
  );
};
