import React, { useState, useEffect } from 'react';
import { MapContainer } from '../../components/common/MapContainer';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Filter, Layers, Compass, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { useRealtimeSubscription } from '../../hooks/useRealtime';
import { ReportMapPoint } from '../../types';

export const AdminLiveMapPage: React.FC = () => {
  const [selectedWard, setSelectedWard] = useState('all');
  const [selectedIssue, setSelectedIssue] = useState('all');
  const [reports, setReports] = useState<ReportMapPoint[]>([]);

  const fetchReports = async () => {
    const data = await reportService.getMapLocations();
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
  const wardOptions = Array.from(new Set(reports.map((report) => report.location.ward).filter(Boolean))).sort();
  const mappedCount = filteredReports.filter((report) =>
    typeof report.location.latitude === 'number' && typeof report.location.longitude === 'number'
  ).length;

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Municipal Complaint Location Map
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {mappedCount} complaint locations plotted across Muzaffarpur.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium cursor-pointer focus:outline-none"
          >
            <option value="all">All wards</option>
            {wardOptions.map((ward) => <option key={ward} value={ward.toLowerCase()}>{ward}</option>)}
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
        title="Complaint Locations"
        subtitle={`Muzaffarpur · ${mappedCount} locations mapped`}
        complaints={filteredReports}
        emptyMessage={filteredReports.length === 0 ? 'No complaints match the selected filters.' : 'Matching complaints have no valid coordinates.'}
        heightClass="h-[520px] sm:h-[600px]"
      />

      {/* Footer Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="default" padding="sm">
          <p className="text-[10px] uppercase font-bold text-slate-400">GIS Coordinate System</p>
          <p className="text-xs font-bold text-slate-800 mt-0.5">WGS 84 geographic coordinates</p>
        </Card>
        <Card variant="default" padding="sm">
          <p className="text-[10px] uppercase font-bold text-slate-400">Telemetry Feed Status</p>
          <p className="text-xs font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {reports.length} complaints synchronized
          </p>
        </Card>
        <Card variant="default" padding="sm">
          <p className="text-[10px] uppercase font-bold text-slate-400">Resolution SLA Buffer</p>
          <p className="text-xs font-bold text-slate-800 mt-0.5">{mappedCount} complaint locations visible</p>
        </Card>
      </div>
    </div>
  );
};
