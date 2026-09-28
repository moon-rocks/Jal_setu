import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Droplet,
  FileText,
  MapPin,
  Megaphone,
  Truck,
  HelpCircle,
  Shield,
  ArrowRight,
  BookOpen,
  PhoneCall,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { IssueType } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { reportService } from '../../services/reportService';
import { noticeService } from '../../services/noticeService';

interface SearchResultItem {
  id: string;
  title: string;
  category: 'issue' | 'service' | 'page' | 'notice' | 'report' | 'contact';
  description: string;
  path: string;
  state?: Record<string, unknown>;
  badge?: string;
  keywords?: string[];
  icon: React.ElementType;
}

const SEARCH_DATABASE: SearchResultItem[] = [
  // Issue reporting
  {
    id: 'issue-pipeline',
    title: 'Report Pipeline Leakage',
    category: 'issue',
    description: 'Cracked, burst or leaking municipal water pipe',
    path: '/report',
    state: { selectedIssue: 'pipeline_leakage' },
    badge: 'Urgent',
    keywords: ['leak', 'leaking', 'burst', 'crack', 'pipe', 'pipeline', 'puncture', 'gushing', 'road leak', 'main line', 'water loss'],
    icon: Droplet,
  },
  {
    id: 'issue-dirty-water',
    title: 'Report Dirty Water',
    category: 'issue',
    description: 'Contaminated, brownish, muddy or foul-smelling tap water',
    path: '/report',
    state: { selectedIssue: 'dirty_water' },
    badge: 'Health',
    keywords: ['dirty', 'dirty water', 'brown', 'muddy', 'smell', 'odor', 'foul', 'contaminat', 'sewage', 'yellow', 'turbid', 'unsafe', 'drinking'],
    icon: Droplet,
  },
  {
    id: 'issue-low-pressure',
    title: 'Report Low Water Pressure',
    category: 'issue',
    description: 'Weak water flow or insufficient header pressure',
    path: '/report',
    state: { selectedIssue: 'low_pressure' },
    badge: 'Supply',
    keywords: ['low pressure', 'weak', 'slow', 'pressure', 'flow', 'drip', 'trickle', 'upper floor', 'not reaching'],
    icon: Droplet,
  },
  {
    id: 'issue-no-water',
    title: 'Report No Water Supply',
    category: 'issue',
    description: 'Complete water outage or scheduled delivery disruption',
    path: '/report',
    state: { selectedIssue: 'no_water' },
    badge: 'Outage',
    keywords: ['no water', 'cut', 'dry tap', 'outage', 'shutoff', 'disruption', 'no supply', 'empty tank'],
    icon: Droplet,
  },
  {
    id: 'issue-broken-tap',
    title: 'Report Broken Tap / Standpost',
    category: 'issue',
    description: 'Damaged public standpost, valve or municipal tap',
    path: '/report',
    state: { selectedIssue: 'broken_tap' },
    badge: 'Civic',
    keywords: ['broken tap', 'tap', 'standpost', 'valve', 'public tap', 'faucet', 'nal', 'nal jal', 'damaged', 'leaking tap'],
    icon: Droplet,
  },
  {
    id: 'issue-other',
    title: 'Report Other Water Problem',
    category: 'issue',
    description: 'Drainage overflow, billing query, or other water issue',
    path: '/report',
    state: { selectedIssue: 'other' },
    badge: 'General',
    keywords: ['other', 'drain', 'overflow', 'drainage', 'bill', 'billing', 'meter', 'illegal connection', 'general'],
    icon: Droplet,
  },

  // Main Pages & Portals
  {
    id: 'page-home',
    title: 'Citizen Dashboard Overview',
    category: 'page',
    description: 'Return to JalSetu citizen home overview & live telemetry',
    path: '/home',
    keywords: ['home', 'dashboard', 'main', 'start', 'overview', 'jalsetu'],
    icon: Sparkles,
  },
  {
    id: 'page-my-reports',
    title: 'My Reports & Grievance History',
    category: 'page',
    description: 'Track progress and live status of your reported water issues',
    path: '/my-reports',
    badge: 'Tracker',
    keywords: ['my reports', 'reports', 'grievances', 'complaints', 'track', 'status', 'history', 'submissions', 'tickets'],
    icon: FileText,
  },
  {
    id: 'page-map',
    title: 'My Location & Ward GIS Map',
    category: 'page',
    description: 'View verified geographic coordinates, GIS pipeline grid and ward boundaries',
    path: '/map',
    badge: 'GIS',
    keywords: ['map', 'location', 'gps', 'gis', 'ward', 'coordinates', 'muzaffarpur', 'where am i'],
    icon: MapPin,
  },
  {
    id: 'page-notices',
    title: 'Municipal Water Notices & Outages',
    category: 'notice',
    description: 'Scheduled maintenance, low-pressure advisories and testing',
    path: '/notices',
    badge: 'Live',
    keywords: ['notices', 'notice', 'announcement', 'maintenance', 'outage', 'schedule', 'advisory', 'timing', 'supply hours'],
    icon: Megaphone,
  },
  {
    id: 'page-services',
    title: 'Municipal Water Services',
    category: 'service',
    description: 'Emergency tankers, water quality lab test, and new pipeline connection',
    path: '/services',
    keywords: ['services', 'service', 'tanker', 'lab test', 'testing', 'new connection', 'water tanker', 'facilities'],
    icon: Truck,
  },
  {
    id: 'page-awareness',
    title: 'Water Conservation & Awareness',
    category: 'page',
    description: 'Bihar rainwater harvesting, tap leak prevention, and groundwater safety',
    path: '/awareness',
    keywords: ['awareness', 'conservation', 'rainwater', 'harvesting', 'save water', 'bihar', 'tips', 'guide', 'groundwater'],
    icon: BookOpen,
  },
  {
    id: 'page-help',
    title: 'Help & 24x7 Emergency Helpline',
    category: 'contact',
    description: 'Toll-free emergency contacts, office addresses, and FAQs',
    path: '/help',
    badge: '1800-3456-789',
    keywords: ['help', 'helpline', 'contact', 'call', 'toll free', 'phone', 'support', 'number', 'emergency', 'faq', 'complaint cell'],
    icon: PhoneCall,
  },
  {
    id: 'page-profile',
    title: 'Citizen Profile & Ward Settings',
    category: 'page',
    description: 'Update your registered name, phone, email, and municipal ward',
    path: '/profile',
    keywords: ['profile', 'settings', 'account', 'ward', 'phone', 'name', 'user'],
    icon: Shield,
  },

  // Specific Services & Notices
  {
    id: 'srv-tanker',
    title: 'Emergency Water Tanker Dispatch',
    category: 'service',
    description: 'Request a municipal tanker for drinking water supply outage',
    path: '/services',
    badge: 'Service',
    keywords: ['tanker', 'water tanker', 'emergency tanker', 'drinking water truck', 'water supply tanker'],
    icon: Truck,
  },
  {
    id: 'srv-testing',
    title: 'Water Quality & Potability Lab Test',
    category: 'service',
    description: 'Request chlorine, chemical and turbidity lab check',
    path: '/services',
    badge: 'Service',
    keywords: ['testing', 'lab test', 'water quality test', 'chlorine check', 'potable', 'lab', 'sample'],
    icon: Droplet,
  },
  {
    id: 'admin-switch',
    title: 'Switch to Municipal Admin Portal',
    category: 'page',
    description: 'Access SCADA command center, grievance queue and field dispatch',
    path: '/admin',
    badge: 'Admin',
    keywords: ['admin', 'portal', 'command center', 'scada', 'official', 'officer', 'staff'],
    icon: Shield,
  },
];

export interface CitizenSearchBarProps {
  onItemSelect?: () => void;
  className?: string;
  isMobileModal?: boolean;
}

export const CitizenSearchBar: React.FC<CitizenSearchBarProps> = ({
  onItemSelect,
  className = '',
  isMobileModal = false,
}) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [records, setRecords] = useState<SearchResultItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    Promise.all([
      reportService.getReports({ citizenOnly: true }),
      noticeService.getNotices(),
    ]).then(([reports, notices]) => {
      if (!active) return;
      setRecords([
        ...reports.map((report) => ({
          id: report.id,
          title: `Report ${report.id}: ${report.issueTitle}`,
          category: 'report' as const,
          description: `${report.location.ward} · ${report.status.replaceAll('_', ' ')}`,
          path: `/reports/${report.id}`,
          badge: report.id,
          keywords: [report.id, report.issueTitle, report.location.ward],
          icon: FileText,
        })),
        ...notices.map((notice) => ({
          id: notice.id,
          title: notice.title,
          category: 'notice' as const,
          description: notice.description,
          path: '/notices',
          badge: notice.ward,
          keywords: [notice.ward || '', notice.title],
          icon: Megaphone,
        })),
      ]);
    }).catch(() => {
      if (active) setRecords([]);
    });
    return () => { active = false; };
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter items based on query & keywords
  const trimmedQuery = query.trim().toLowerCase();
  const searchItems = [...SEARCH_DATABASE, ...records];
  const filteredResults = trimmedQuery
    ? searchItems.filter((item) => {
        const inTitle = item.title.toLowerCase().includes(trimmedQuery);
        const inDesc = item.description.toLowerCase().includes(trimmedQuery);
        const inBadge = item.badge?.toLowerCase().includes(trimmedQuery) || false;
        const inCategory = item.category.toLowerCase().includes(trimmedQuery);
        const inKeywords = item.keywords?.some((k) => k.toLowerCase().includes(trimmedQuery)) || false;
        return inTitle || inDesc || inBadge || inCategory || inKeywords;
      })
    : SEARCH_DATABASE.slice(0, 6); // default suggestions

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelect = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery('');
    if (onItemSelect) onItemSelect();
    navigate(item.path, { state: item.state });
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      inputRef.current?.focus();
      setIsOpen(true);
      return;
    }

    // If an item is explicitly highlighted, navigate to it
    if (filteredResults.length > 0 && selectedIndex >= 0 && selectedIndex < filteredResults.length) {
      handleSelect(filteredResults[selectedIndex]);
      return;
    }

    // Direct match for report ID like JS-10481
    const reportMatch = searchItems.find(
      (item) => item.category === 'report' && item.title.toLowerCase().includes(cleanQuery.toLowerCase())
    );
    if (reportMatch) {
      handleSelect(reportMatch);
      return;
    }

    // General fallback: navigate to my-reports passing query param
    setIsOpen(false);
    if (onItemSelect) onItemSelect();
    navigate(`/my-reports?q=${encodeURIComponent(cleanQuery)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (filteredResults.length > 0 || trimmedQuery)) {
      setIsOpen(true);
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredResults.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredResults.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
        {/* Search button / icon */}
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
          placeholder={t('header.searchPlaceholder') || "Search reports, services, or water notices... (Ctrl+K)"}
          className="w-full bg-slate-50 select-text border border-slate-200/90 hover:border-slate-300 focus:bg-white rounded-xl pl-9.5 pr-20 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-2xs"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : !isMobileModal ? (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
              ⌘K
            </kbd>
          ) : null}

          {/* Quick Search Action Pill */}
          {query && (
            <button
              type="submit"
              className="px-2 py-0.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              Search
            </button>
          )}
        </div>
      </form>

      {/* Instant Dropdown Results */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200/95 shadow-2xl py-2 z-50 max-h-[440px] overflow-y-auto text-left"
        >
          {filteredResults.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-800">
                No direct matches found for &ldquo;{query}&rdquo;
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                Try searching for &quot;leak&quot;, &quot;dirty water&quot;, &quot;tanker&quot;, &quot;Ward 12&quot;, or &quot;help&quot;.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                    if (onItemSelect) onItemSelect();
                    navigate(`/my-reports?q=${encodeURIComponent(query)}`);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors cursor-pointer shadow-xs"
                >
                  Search in All Reports →
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                    if (onItemSelect) onItemSelect();
                    navigate('/report');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  File a New Report
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>{trimmedQuery ? 'Suggested Matches' : 'Quick Actions & Services'}</span>
                <span className="font-normal font-mono">{filteredResults.length} found</span>
              </div>

              <div className="divide-y divide-slate-100/70">
                {filteredResults.map((item, idx) => {
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
                        isSelected ? 'bg-sky-50/90 text-sky-950' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            item.category === 'issue'
                              ? 'bg-rose-50 text-rose-600'
                              : item.category === 'service'
                              ? 'bg-sky-50 text-sky-600'
                              : item.category === 'notice'
                              ? 'bg-amber-50 text-amber-700'
                              : item.category === 'contact'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold truncate">{item.title}</p>
                            {item.badge && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate leading-snug">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                  );
                })}
              </div>

              {/* Action Footer for deeper queries */}
              {trimmedQuery && (
                <div className="p-2 border-t border-slate-100 bg-slate-50/80 rounded-b-2xl">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSearchSubmit();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search all reports for &ldquo;{trimmedQuery}&rdquo;</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {!trimmedQuery && (
                <div className="px-3.5 py-2 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl flex items-center justify-between text-[11px] text-slate-400">
                  <span>Use ↑ and ↓ to navigate, Enter to select</span>
                  <span>ESC to close</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
