import React, { useState, useEffect } from 'react';
import { Menu, Search, MapPin, ChevronDown, X } from 'lucide-react';
import { JalSetuLogo } from '../ui/JalSetuLogo';
import { CitizenNotificationMenu } from './CitizenNotificationMenu';
import { CitizenSearchBar } from './CitizenSearchBar';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useLocationContext } from '../../context/LocationContext';
import { locationService } from '../../services/locationService';

export interface CitizenHeaderProps {
  onOpenDrawer: () => void;
  selectedWard?: string;
  onSelectWard?: (ward: string) => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const CitizenHeader: React.FC<CitizenHeaderProps> = ({
  onOpenDrawer,
  selectedWard: initialWard,
  onSelectWard,
  onToggleSidebar,
  isSidebarCollapsed = false,
}) => {
  const { t } = useLanguage();
  const { location, selectManualWard } = useLocationContext();

  const detectedWardLabel = location
    ? `${location.wardNumber || location.ward}, ${location.city}`
    : 'Select Municipal Ward';

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [currentWard, setCurrentWard] = useState(initialWard || detectedWardLabel);
  const [isWardDropdownOpen, setIsWardDropdownOpen] = useState(false);
  const [wardOptions, setWardOptions] = useState<{ id: string; wardNumber: string; name: string; city: string }[]>([]);

  useEffect(() => {
    let active = true;
    locationService.getWards().then((wards) => {
      if (active) setWardOptions(wards);
    }).catch(() => {
      if (active) setWardOptions([]);
    });
    return () => { active = false; };
  }, []);

  // Sync with detected location if initialWard not explicitly set
  useEffect(() => {
    if (location && !initialWard) {
      setCurrentWard(`${location.wardNumber || location.ward}, ${location.city}`);
    }
  }, [location, initialWard]);

  const handleSelectWard = (ward: (typeof wardOptions)[number]) => {
    setCurrentWard(`${ward.wardNumber}, ${ward.city}`);
    setIsWardDropdownOpen(false);
    selectManualWard(ward.wardNumber);
    onSelectWard?.(ward.wardNumber);
  };

  return (
    <header className="h-18 px-3 sm:px-6 bg-white border-b border-slate-200/90 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30">
      {/* Left: Brand Logo & Ward Selector */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <NavLink to="/home" className="flex items-center">
          <JalSetuLogo size="sm" showTagline={false} />
        </NavLink>

        {/* Ward Selector Button (Visible on large screens) */}
        <div className="relative hidden lg:block">
          <button
            type="button"
            onClick={() => setIsWardDropdownOpen((prev) => !prev)}
            aria-expanded={isWardDropdownOpen}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200/80 hover:border-sky-300 text-xs font-semibold text-slate-800 transition-colors shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="truncate max-w-[130px]">{currentWard}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isWardDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isWardDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                {t('header.selectWard')}
              </div>
              {wardOptions.map((ward) => (
                <button
                  key={ward.id}
                  type="button"
                  onClick={() => handleSelectWard(ward)}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between hover:bg-sky-50 hover:text-sky-700 cursor-pointer ${
                    currentWard === `${ward.wardNumber}, ${ward.city}` ? 'bg-sky-50/70 text-sky-700 font-bold' : 'text-slate-700'
                  }`}
                >
                  <span>{ward.name}</span>
                  {currentWard === `${ward.wardNumber}, ${ward.city}` && <span className="text-[10px] text-sky-600 font-bold">{t('header.active')}</span>}
                </button>
              ))}
              {wardOptions.length === 0 && <p className="px-3 py-2 text-xs text-slate-400">No municipal wards available.</p>}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Interactive Search bar (Visible on sm, md, lg, xl) */}
      <div className="hidden sm:flex items-center gap-4 flex-1 max-w-sm md:max-w-md lg:max-w-xl mx-2 sm:mx-4">
        <CitizenSearchBar />
      </div>

      {/* Right zone: Mobile Search Toggle, Notifications & Menu Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Mobile Search Button (visible only on xs < 640px) */}
        <button
          type="button"
          onClick={() => setIsMobileSearchOpen((prev) => !prev)}
          aria-label={isMobileSearchOpen ? 'Close search' : 'Search water reports & services'}
          title="Search"
          className="sm:hidden p-2 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200/80 text-slate-600 hover:text-sky-600 transition-colors cursor-pointer"
        >
          {isMobileSearchOpen ? <X className="w-5 h-5 text-slate-700" /> : <Search className="w-5 h-5" />}
        </button>

        <CitizenNotificationMenu />

        {/* Desktop Menu Button (opens right sidebar) */}
        {isSidebarCollapsed && onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Open sidebar menu"
            title="Open Menu"
            className="group hidden md:flex items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200/90 hover:border-sky-300 text-slate-700 hover:text-sky-600 shadow-2xs hover:shadow-sm active:scale-95 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <Menu className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6" />
          </button>
        )}

        {/* Mobile Hamburger (opens right drawer) */}
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open navigation menu"
          className="group md:hidden p-2 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200/80 hover:border-sky-300 text-slate-700 hover:text-sky-600 shadow-2xs hover:shadow-sm active:scale-90 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          <Menu className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6" />
        </button>
      </div>

      {/* Mobile Search Overlay Panel */}
      {isMobileSearchOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 p-3 bg-white border-b border-slate-200 shadow-xl z-40">
          <CitizenSearchBar
            isMobileModal={true}
            onItemSelect={() => setIsMobileSearchOpen(false)}
          />
        </div>
      )}
    </header>
  );
};
