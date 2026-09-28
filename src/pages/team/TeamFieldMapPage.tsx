import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Navigation,
  ExternalLink,
  Layers,
  Flame,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  ArrowRight,
  Crosshair,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teamMemberService } from '../../services/teamMemberService';
import { AssignedReportItem } from '../../types/teamMember';
import { MapContainer } from '../../components/common/MapContainer';

export const TeamFieldMapPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, teamMemberProfile } = useAuth();
  const memberId = teamMemberProfile?.id || user?.id || '';

  const [reports, setReports] = useState<AssignedReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<AssignedReportItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userGps, setUserGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsRequested, setGpsRequested] = useState(false);

  useEffect(() => {
    async function loadData() {
      const data = await teamMemberService.getAssignedReports(memberId);
      setReports(data);
      if (data.length > 0) setSelectedReport(data[0]);
    }
    loadData();
  }, [memberId]);

  // Request current geolocation when user taps locate button
  const handleRequestLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setGpsRequested(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserGps({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn('Geolocation high-accuracy failed, trying standard accuracy:', err);
          navigator.geolocation.getCurrentPosition(
            (fallbackPos) => {
              setUserGps({
                lat: fallbackPos.coords.latitude,
                lng: fallbackPos.coords.longitude,
              });
            },
            (fallbackErr) => {
              console.warn('Geolocation unavailable:', fallbackErr);
            },
            { enableHighAccuracy: false, timeout: 10000 }
          );
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    }
  };

  const filteredReports = reports.filter((r) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return r.status === 'assigned' || r.status === 'accepted' || r.status === 'in_progress';
    if (statusFilter === 'completed') return r.status === 'completed' || r.status === 'admin_verified';
    return r.status === statusFilter;
  });

  return (
    <div className="space-y-4 select-none font-sans text-left">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0E1A30] p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-400" />
            <span>Field Operations GIS Map</span>
          </h1>
          <p className="text-xs text-slate-400">
            Interactive map displaying all active assignments and reported leak sites in your sector.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* GPS request */}
          <button
            type="button"
            onClick={handleRequestLocation}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 hover:text-amber-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Crosshair className="w-4 h-4" />
            <span>{userGps ? 'GPS Acquired' : 'Locate My Unit'}</span>
          </button>

          {/* Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#081224] text-white text-xs rounded-xl border border-slate-700 py-2 px-3 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">All Assignments ({reports.length})</option>
            <option value="active">Active Tasks Only</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* MAP & SIDE INSPECTOR SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Map: 2 cols */}
        <div className="lg:col-span-2 relative h-[520px] rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
          <MapContainer
            mode="admin"
            heightClass="h-[520px]"
            detectedLocation={
              selectedReport
                ? {
                    ward: selectedReport.location.ward,
                    city: selectedReport.location.city,
                    latitude: selectedReport.location.latitude,
                    longitude: selectedReport.location.longitude,
                    accuracy: selectedReport.location.accuracy || 6,
                  }
                : undefined
            }
          />

          {/* Map bottom floating counter */}
          <div className="absolute bottom-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs text-white shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-bold">{filteredReports.length}</span>
            <span className="text-slate-400">tasks plotted</span>
          </div>
        </div>

        {/* Selected Task Inspector Card: 1 col */}
        <div className="space-y-4">
          {selectedReport ? (
            <div className="p-5 rounded-2xl bg-[#0E1A30] border border-slate-800 space-y-4 shadow-lg text-left">
              {/* Task Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-mono text-xs font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                  {selectedReport.reportNumber}
                </span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {selectedReport.status.replace('_', ' ')}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {selectedReport.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-3 leading-relaxed">
                  {selectedReport.description}
                </p>
              </div>

              {/* Location & GPS */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{selectedReport.location.address || selectedReport.location.ward}</span>
                </div>
                <p className="text-[10px] font-mono text-slate-500">
                  Lat: {selectedReport.location.latitude.toFixed(5)}, Lng: {selectedReport.location.longitude.toFixed(5)}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedReport.location.latitude},${selectedReport.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Get Turn-by-Turn Directions</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                <button
                  type="button"
                  onClick={() => navigate(`/team/reports/${selectedReport.id}`)}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Open Task Details & Update</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#0E1A30] border border-slate-800 text-center text-slate-400 text-xs">
              Tap any task pin on the map to inspect details.
            </div>
          )}

          {/* Quick Tasks List */}
          <div className="p-4 rounded-2xl bg-[#0E1A30] border border-slate-800 space-y-2 text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Active Map Pins
            </span>
            <div className="max-h-56 overflow-y-auto space-y-1.5 divide-y divide-slate-800/60">
              {filteredReports.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedReport(r)}
                  className={`w-full text-left p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    selectedReport?.id === r.id ? 'bg-amber-500/10 text-white' : 'hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-400">{r.reportNumber}</span>
                    <span className="text-[10px] text-slate-500">{r.priority.toUpperCase()}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{r.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
