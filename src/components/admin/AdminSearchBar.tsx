import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import { teamService } from '../../services/teamService';
import {
  Search,
  X,
  FileCheck2,
  MapPin,
  Users2,
  BellRing,
  BarChart3,
  Settings,
  ArrowRight,
} from 'lucide-react';

interface AdminSearchItem {
  id: string;
  title: string;
  category: 'report' | 'page' | 'team' | 'ward';
  description: string;
  path: string;
  badge?: string;
  icon: React.ElementType;
}

const ADMIN_SEARCH_DATABASE: AdminSearchItem[] = [
  // Admin Navigation
  {
    id: 'adm-dashboard',
    title: 'Command Center Dashboard',
    category: 'page',
    description: 'Real-time telemetry, KPI metrics, and AI verification queue',
    path: '/admin',
    icon: BarChart3,
  },
  {
    id: 'adm-reports',
    title: 'Grievance Ledger & Reports',
    category: 'page',
    description: 'Audit incoming citizen complaints and verify GPS locations',
    path: '/admin/reports',
    badge: 'Reports',
    icon: FileCheck2,
  },
  {
    id: 'adm-map',
    title: 'Municipal GIS Incident Map',
    category: 'page',
    description: 'Muzaffarpur hydrology layer and spatial leak distribution',
    path: '/admin/map',
    badge: 'GIS',
    icon: MapPin,
  },
  {
    id: 'adm-teams',
    title: 'Field Response Teams & Units',
    category: 'page',
    description: 'Manage rapid-response repair crews, rosters, and vehicle status',
    path: '/admin/teams',
    badge: 'Teams',
    icon: Users2,
  },
  {
    id: 'adm-alerts',
    title: 'Operational Alerts & SCADA Feeds',
    category: 'page',
    description: 'Sensor anomalies, chlorine variance, and burst triggers',
    path: '/admin/alerts',
    badge: 'SCADA',
    icon: BellRing,
  },
  {
    id: 'adm-analytics',
    title: 'Water Infrastructure Analytics',
    category: 'page',
    description: 'Resolution SLA compliance and mean time to repair',
    path: '/admin/analytics',
    icon: BarChart3,
  },
  {
    id: 'adm-settings',
    title: 'Municipal System Settings',
    category: 'page',
    description: 'Administrative profiles, RBAC roles, and AI thresholds',
    path: '/admin/settings',
    icon: Settings,
  },

];

export const AdminSearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [records, setRecords] = useState<AdminSearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    Promise.all([reportService.getReports(), teamService.getTeams()])
      .then(([reports, teams]) => {
        if (!active) return;
        setRecords([
          ...reports.map((report) => ({
            id: report.id,
            title: `${report.id}: ${report.issueTitle}`,
            category: 'report' as const,
            description: `${report.location.ward} · ${report.status.replaceAll('_', ' ')}`,
            path: `/admin/reports/${report.id}`,
            badge: report.priority,
            icon: FileCheck2,
          })),
          ...teams.map((team) => ({
            id: team.id,
            title: team.name,
            category: 'team' as const,
            description: `${team.assignedWards.join(', ')} · ${team.status}`,
            path: '/admin/teams',
            badge: team.status,
            icon: Users2,
          })),
        ]);
      })
      .catch(() => {
        if (active) setRecords([]);
      });
    return () => { active = false; };
  }, []);

  // Filter items
  const trimmed = query.trim().toLowerCase();
  const searchItems = [...ADMIN_SEARCH_DATABASE, ...records];
  const filtered = trimmed
    ? searchItems.filter(
        (item) =>
          item.title.toLowerCase().includes(trimmed) ||
          item.description.toLowerCase().includes(trimmed) ||
          item.badge?.toLowerCase().includes(trimmed)
      )
    : ADMIN_SEARCH_DATABASE.slice(0, 5);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: AdminSearchItem) => {
    setIsOpen(false);
    setQuery('');
    navigate(item.path);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = query.trim();
    if (!clean) {
      inputRef.current?.focus();
      return;
    }

    if (filtered.length > 0 && selectedIndex >= 0 && selectedIndex < filtered.length) {
      handleSelect(filtered[selectedIndex]);
      return;
    }

    setIsOpen(false);
    navigate(`/admin/reports?q=${encodeURIComponent(clean)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && filtered.length > 0) setIsOpen(true);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
        <button
          type="submit"
          title="Search"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-sky-600 focus:outline-none transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search reports, wards, teams, or issue ID..."
          className="w-full bg-slate-50 select-text border border-slate-200/90 rounded-xl pl-9.5 pr-8 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-2xs"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 max-h-[380px] overflow-y-auto text-left"
        >
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-xs">
              <p className="font-semibold text-slate-700">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Try searching by report ID (e.g. JS-20481) or ward.</p>
              <div className="mt-2">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                    navigate(`/admin/reports?q=${encodeURIComponent(query.trim())}`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold hover:bg-sky-100 transition-colors cursor-pointer"
                >
                  Search in Grievance Ledger →
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {trimmed ? 'Matching Admin Records' : 'Quick Admin Shortcuts'}
              </div>

              <div className="divide-y divide-slate-100/70">
                {filtered.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(item);
                      }}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between p-3 text-left transition-colors cursor-pointer ${
                        isSelected ? 'bg-sky-50/80 text-sky-950' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold truncate">{item.title}</p>
                            {item.badge && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{item.description}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
