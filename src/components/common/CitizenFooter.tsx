import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Mail,
  ShieldCheck,
  MapPin,
  Check,
  Globe,
  ChevronDown,
  Sprout,
  PhoneCall,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { useLanguage, LANGUAGE_OPTIONS } from '../../context/LanguageContext';

export interface CitizenFooterProps {
  showSubscription?: boolean;
}

export const CitizenFooter: React.FC<CitizenFooterProps> = ({ showSubscription }) => {
  const location = useLocation();
  const isHomePage =
    showSubscription !== undefined
      ? showSubscription
      : (location.pathname === '/' || location.pathname === '/home');

  const { language, setLanguage, t } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [langToast, setLangToast] = useState<string | null>(null);

  const handleLanguageCycle = (e: React.MouseEvent) => {
    e.preventDefault();
    const currentIndex = LANGUAGE_OPTIONS.findIndex((opt) => opt.id === language);
    const nextIndex = (currentIndex + 1) % LANGUAGE_OPTIONS.length;
    const nextLang = LANGUAGE_OPTIONS[nextIndex];
    setLanguage(nextLang.id);
    setLangToast(nextLang.nativeName);
    setTimeout(() => setLangToast(null), 2400);
  };

  // Dedicated Bihar Water Conservation Newsletter State
  const [bulletinEmail, setBulletinEmail] = useState('');
  const [bulletinDistrict, setBulletinDistrict] = useState('Muzaffarpur');
  const [bulletinError, setBulletinError] = useState('');

  const activeLangOption = LANGUAGE_OPTIONS.find((opt) => opt.id === language) || LANGUAGE_OPTIONS[0];

  const handleBulletinSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setBulletinError('Newsletter subscriptions are not currently available.');
  };

  return (
    <footer className="w-full bg-white mt-6 sm:mt-8 overflow-hidden">
      {/* Top Wave Graphic Separator */}
      <div className="w-full leading-none overflow-hidden -mb-px">
        <svg
          viewBox="0 0 1440 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-5 sm:h-8 text-white fill-current block -mb-0.5"
          preserveAspectRatio="none"
        >
          <path d="M0,18 C280,36 440,6 720,20 C1000,34 1160,8 1440,18 L1440,48 L0,48 Z" />
        </svg>
      </div>

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isHomePage ? 'pt-5 sm:pt-6 pb-6 sm:pb-8' : 'pt-4 sm:pt-5 pb-5 sm:pb-6'}`}>
        {/* Bihar Water Conservation Newsletter Subscription Banner - Only rendered on Homepage (/) */}
        {isHomePage && (
          <div className="relative rounded-2xl bg-gradient-to-r from-sky-950 via-blue-900 to-indigo-950 text-white p-4 max-sm:p-3 sm:rounded-3xl sm:p-8 mb-5 sm:mb-8 shadow-xl border border-sky-600/30 overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-sky-400/20 blur-3xl pointer-events-none" />
            <div className="absolute left-1/4 -bottom-16 w-60 h-60 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 max-sm:gap-3 sm:gap-6 items-center">
              {/* Left Content Column */}
              <div className="lg:col-span-6 space-y-2 max-sm:space-y-1.5 sm:space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-400/15 border border-sky-400/30 text-sky-200 text-xs font-semibold backdrop-blur-xs max-sm:px-2 max-sm:py-0.5 max-sm:text-[10px]">
                  <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('footer.bulletinTag')}</span>
                </div>

                <h3 className="text-lg max-sm:text-base sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  {t('footer.bulletinTitle')}
                </h3>

                <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed max-w-xl max-sm:line-clamp-2">
                  {t('footer.bulletinDesc')}
                </p>

                {/* Topic Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1 text-xs max-sm:gap-1 max-sm:pt-0.5 sm:gap-2">
                  {['💧 Rainwater Catchment', '🌿 River Restoration', '⚡ Real-Time Ward Alerts', '🎯 Jal Sanrakshan Guides'].map((topic, index) => (
                    <span
                      key={topic}
                      className={`inline-flex items-center px-2 py-1 rounded-lg bg-white/10 border border-white/15 text-sky-100 text-[10px] font-medium sm:px-2.5 sm:text-[11px] ${index > 1 ? 'max-sm:hidden' : ''}`}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Form Column */}
              <div className="lg:col-span-6 w-full bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-3.5 max-sm:p-3 sm:rounded-2xl sm:p-6 shadow-inner">
                  <form onSubmit={handleBulletinSubscribe} noValidate className="w-full space-y-2.5 max-sm:space-y-2 sm:space-y-3.5">
                    <div className="grid w-full grid-cols-1 sm:grid-cols-12 gap-2 max-sm:gap-1.5 sm:gap-2.5">
                      {/* District Selector */}
                      <div className="sm:col-span-5 relative">
                        <select
                          value={bulletinDistrict}
                          onChange={(e) => setBulletinDistrict(e.target.value)}
                          aria-label="Select District"
                          className="w-full px-3 py-2 text-xs bg-slate-900/70 border border-white/25 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-400 font-medium appearance-none cursor-pointer"
                        >
                          <option value="Muzaffarpur" className="bg-slate-900 text-white">Muzaffarpur (Ward 12)</option>
                          <option value="Patna" className="bg-slate-900 text-white">Patna Metropolitan</option>
                          <option value="Gaya" className="bg-slate-900 text-white">Gaya District</option>
                          <option value="Bhagalpur" className="bg-slate-900 text-white">Bhagalpur District</option>
                          <option value="Darbhanga" className="bg-slate-900 text-white">Darbhanga District</option>
                          <option value="All Bihar" className="bg-slate-900 text-white">Statewide (All Bihar)</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-sky-300 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {/* Email Input */}
                      <div className="sm:col-span-7 relative">
                        <Mail className="w-4 h-4 text-sky-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          value={bulletinEmail}
                          onChange={(e) => {
                            setBulletinEmail(e.target.value);
                            if (bulletinError) setBulletinError('');
                          }}
                          placeholder="Enter your email address"
                          className={`w-full pl-9 pr-3 py-2 text-xs bg-slate-900/70 border rounded-xl text-white placeholder:text-sky-200/60 focus:outline-none focus:ring-2 font-medium ${
                            bulletinError
                              ? 'border-rose-400 focus:ring-rose-400'
                              : 'border-white/25 focus:ring-sky-400'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Validation Error Message */}
                    {bulletinError && (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
                        <span>{bulletinError}</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 max-sm:gap-1.5 sm:gap-3 pt-1">
                      <label className="flex items-start gap-2 text-[11px] text-sky-100 max-sm:text-[10px] max-sm:leading-relaxed sm:items-center">
                        <input type="checkbox" disabled className="rounded border-white/30 text-sky-500 bg-slate-900/50" />
                        <span>Receive weekly water conservation insights & alerts</span>
                      </label>

                      <button
                        type="submit"
                        className="w-full sm:w-auto px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 active:scale-95 text-slate-950 font-bold text-xs tracking-tight transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 shrink-0"
                      >
                        <span>{t('footer.subscribeNow')}</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-sky-200/70 pt-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{t('footer.noSpam')}</span>
                    </p>
                  </form>
              </div>
            </div>
          </div>
        )}

        {isHomePage && (
          <>
            {/* Bihar State 24x7 Water Emergency Helpline Ribbon */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50/60 to-emerald-50/60 border border-sky-200/80 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <PhoneCall className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    {t('footer.emergencyTitle')}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {t('footer.tollFreeActive')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {t('footer.emergencyDesc')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <a
                href="tel:18003456789"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-sky-300 text-sky-800 font-bold hover:bg-sky-50 transition-colors shadow-2xs"
              >
                <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                <span>{t('footer.tollFree')}</span>
              </a>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold shadow-2xs">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('footer.muzaffarpur')}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('footer.patna')}</span>
              </div>
            </div>
          </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Dark Copyright & Legal Bar */}
      <div className="w-full bg-slate-950 text-slate-400 text-xs pt-4 pb-28 md:pb-5 px-4 sm:px-6 lg:px-8 border-t border-slate-900 relative z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2 text-center md:text-left text-[11px] sm:text-xs">
            <span>{t('footer.copyright')}</span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="text-slate-500 font-medium">
              {t('footer.tagline')}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-3.5 sm:gap-x-6 gap-y-2 text-slate-400 text-[11px] sm:text-xs">
            <NavLink to="/help" className="hover:text-white transition-colors">
              {t('footer.privacy')}
            </NavLink>
            <span className="text-slate-800">|</span>
            <NavLink to="/help" className="hover:text-white transition-colors">
              {t('footer.terms')}
            </NavLink>
            <span className="text-slate-800">|</span>
            <NavLink to="/help" className="hover:text-white transition-colors">
              {t('footer.accessibility')}
            </NavLink>
            <span className="text-slate-800">|</span>
            <NavLink to="/services" className="hover:text-white transition-colors">
              {t('footer.sitemap')}
            </NavLink>

            {/* Language Switcher Selector */}
            <div className="relative inline-flex items-center">
              {langToast && (
                <div
                  role="status"
                  aria-live="polite"
                  className="absolute right-0 bottom-full mb-2.5 px-3 py-1.5 rounded-xl bg-sky-600 text-white font-bold text-xs shadow-xl shadow-sky-950/50 pointer-events-none whitespace-nowrap z-50 flex items-center gap-1.5 animate-bounce border border-sky-400"
                >
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>{langToast}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleLanguageCycle}
                title={`Current: ${activeLangOption.nativeName} — Click to switch language (${language === 'en' ? 'हिन्दी' : language === 'hi' ? 'भोजपुरी' : 'English'})`}
                aria-label={`Change language, currently ${activeLangOption.nativeName}. Click to cycle to next language.`}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-850 text-slate-200 hover:text-white border border-sky-500/40 hover:border-sky-400 active:scale-95 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-sky-950/50 text-[11px] sm:text-xs"
              >
                <Globe className="w-3.5 h-3.5 text-sky-400 group-hover:rotate-12 transition-transform duration-300" />
                <span className="font-bold text-white tracking-tight">{activeLangOption.nativeName}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-[10px] font-bold uppercase tracking-wider">
                  {language.toUpperCase()}
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-sky-300 transition-colors ml-0.5 font-bold">⇄</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLangOpen((prev) => !prev)}
                aria-expanded={isLangOpen}
                aria-label="Open language selection menu"
                title="Choose language from list"
                className="p-1.5 ml-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer transition-colors"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isLangOpen ? 'rotate-180 text-sky-400' : ''}`} />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 sm:right-0 bottom-full mb-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 w-36 max-w-[calc(100vw-32px)] z-50">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1">
                    भाषा / Language
                  </div>
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setLanguage(opt.id);
                        setLangToast(opt.nativeName);
                        setIsLangOpen(false);
                        setTimeout(() => setLangToast(null), 2200);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        language === opt.id
                          ? 'text-sky-400 font-bold bg-slate-850'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{opt.nativeName}</span>
                      {language === opt.id && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
