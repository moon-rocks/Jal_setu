import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { IssueCard, WATER_ISSUES } from '../../components/common/IssueCard';
import { MapContainer } from '../../components/common/MapContainer';
import { NoticeCard } from '../../components/common/NoticeCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState, LoadingState } from '../../components/ui/LoadingState';
import { IssueType, CivicNotice } from '../../types';
import civicWaterBannerImg from '../../assets/images/civic_water_banner_1790354885908.jpg';
import biharWaterHeritageImg from '../../assets/images/bihar_water_heritage_1790354708323.jpg';
import riverCleanGhatImg from '../../assets/images/river_clean_ghat_1790429347104.jpg';
import rainwaterHarvestingImg from '../../assets/images/rainwater_harvesting_1790429372305.jpg';
import cleanDrinkingTapImg from '../../assets/images/clean_drinking_tap_1790429332378.jpg';
import { useLanguage } from '../../context/LanguageContext';
import { useLocationContext } from '../../context/LocationContext';
import { noticeService } from '../../services/noticeService';
import { useRealtimeSubscription } from '../../hooks/useRealtime';
import { JalSetuProcessSection } from '../../components/common/JalSetuProcessSection';

// Swiper.js for smooth background carousel
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import {
  Camera,
  MapPin,
  ChevronRight,
  ChevronDown,
  Droplet,
  Droplets,
  Megaphone,
  Lightbulb,
  Compass,
  ArrowRight,
  Bell,
  History,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const CitizenHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    location,
    isLocating,
    requestLocation,
    getFreshLocation,
    selectManualWard,
    updateVerifiedLocation,
    error,
    permissionStatus,
    openDeniedModal,
  } = useLocationContext();

  const [noticesList, setNoticesList] = useState<CivicNotice[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);
  const [noticesError, setNoticesError] = useState('');

  const fetchNotices = async () => {
    setNoticesLoading(true);
    setNoticesError('');
    try {
      setNoticesList(await noticeService.getNotices());
    } catch (error) {
      setNoticesError(error instanceof Error ? error.message : 'Unable to load notices.');
    } finally {
      setNoticesLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  useRealtimeSubscription('water_notices', () => {
    fetchNotices();
  });

  const [isAllNoticesExpanded, setIsAllNoticesExpanded] = useState(false);

  const latestNotices = noticesList.slice(0, 2);
  const olderNotices = noticesList.slice(2);

  const handleSelectIssue = (issueId: IssueType) => {
    navigate('/report', { state: { selectedIssue: issueId } });
  };

  // Background slides: Keep existing first background image and add remaining heritage images
  const heroBackgroundSlides = [
    {
      src: civicWaterBannerImg,
      alt: 'Civic water infrastructure map and reservoir in Bihar',
    },
    {
      src: biharWaterHeritageImg,
      alt: 'Darbhanga Raj Palace and Bihar Water Heritage',
    },
    {
      src: riverCleanGhatImg,
      alt: 'River Ghats and Sacred Water Conservation in Bihar',
    },
    {
      src: rainwaterHarvestingImg,
      alt: 'Rainwater Harvesting Lotus Reservoir and Wetland',
    },
    {
      src: cleanDrinkingTapImg,
      alt: '24x7 Clean Potable Water Distribution Across Municipal Wards',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Welcome Bar & Civic Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6 bg-slate-900 rounded-3xl p-5 sm:p-6 lg:p-11 xl:p-14 text-white shadow-xl shadow-sky-950/25 relative overflow-hidden border border-sky-500/25 lg:min-h-[230px] xl:min-h-[260px]">
        {/* Background Swiper.js Slider: Autoplay, smooth fade transition, loop mode (4.5s delay) */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
          <Swiper
            modules={[Autoplay, EffectFade]}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            loop={true}
            autoplay={{
              delay: 4500,
              disableOnInteraction: false,
              pauseOnMouseEnter: false,
            }}
            speed={1200}
            allowTouchMove={false}
            className="w-full h-full [&_.swiper-slide]:!h-full [&_.swiper-wrapper]:!h-full [&_.swiper-slide]:!w-full"
          >
            {heroBackgroundSlides.map((slide, index) => (
              <SwiperSlide key={index} className="w-full h-full overflow-hidden">
                <img
                  src={slide.src}
                  alt={slide.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Transparent atmospheric overlay so background images remain clearly visible */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/50 to-sky-950/60 pointer-events-none z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-black/30 pointer-events-none z-[1]" />

        {/* Civic Water GIS Map Grid & Pipeline Topology Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen z-[1]"
          style={{
            backgroundImage: `radial-gradient(circle at 18% 35%, rgba(56, 189, 248, 0.35) 0%, transparent 45%), radial-gradient(circle at 82% 55%, rgba(14, 165, 233, 0.3) 0%, transparent 45%), linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)`,
            backgroundSize: '100% 100%, 100% 100%, 32px 32px, 32px 32px',
          }}
        />

        {/* Subtle decorative atmospheric glow */}
        <div className="absolute -top-10 -right-10 w-80 h-80 bg-sky-400/25 rounded-full blur-3xl pointer-events-none z-[1]" />
        <div className="absolute -bottom-10 left-1/3 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none z-[1]" />

        <div className="relative z-10 space-y-2 sm:space-y-3 lg:space-y-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
              {t('home.greeting')}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm lg:text-base text-sky-50 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
            <span className="inline-flex items-center gap-1.5 font-semibold bg-slate-950/60 px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl backdrop-blur-md border border-white/25 shadow-sm text-xs sm:text-sm lg:text-base">
              <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-sky-400 shrink-0" />
              {location ? `${location.ward}, ${location.city}` : 'Location not available'}
            </span>
            <span className="hidden sm:inline font-bold text-sky-300 text-sm lg:text-base" aria-hidden="true">·</span>
            <span className="font-semibold tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              {t('home.everyDrop')}
            </span>
          </div>
        </div>

        {/* Civic Quote Pill with enhanced backdrop protection */}
        <div className="relative z-10 max-w-sm sm:max-w-md lg:max-w-lg bg-slate-950/60 backdrop-blur-md border border-white/25 p-4 sm:p-5 lg:p-6 rounded-2xl lg:rounded-3xl text-left shadow-xl shrink-0">
          <p className="text-xs sm:text-sm lg:text-base italic text-white font-medium leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
            {t('home.civicQuote')}
          </p>
          <p className="text-xs lg:text-sm text-sky-300 font-bold mt-1.5 lg:mt-2 tracking-wide">{t('home.civicInitiative')}</p>
        </div>
      </div>

      {/* Main Grid: My Location Card + Report Action Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Personal Location Map Card (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-600" />
                {t('home.myLocation')}
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {location ? `GPS ±${location.accuracy}m` : t('home.gpsLive')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={openDeniedModal}
                title="How to Enable Location"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-sky-700 bg-slate-100 hover:bg-sky-50 px-2 sm:px-2.5 py-1 rounded-lg border border-slate-200/90 transition-colors cursor-pointer shadow-2xs"
              >
                <HelpCircle className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="hidden sm:inline">How to Enable Location</span>
                <span className="sm:hidden">Location Guide</span>
              </button>
              <button
                type="button"
                onClick={() => getFreshLocation()}
                disabled={isLocating}
                title="Recalibrate Real Device GPS"
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 p-1.5 rounded-lg hover:bg-sky-50 transition-colors cursor-pointer"
              >
                <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Acquiring GPS...' : t('home.recenter')}</span>
              </button>
            </div>
          </div>

          <MapContainer
            mode="citizen"
            detectedLocation={
              location
                ? {
                    ward: location.ward,
                    city: location.city,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracy: location.accuracy,
                    address: location.address,
                  }
                : undefined
            }
            onDetectLocation={() => requestLocation(true, true)}
            onLocationChange={updateVerifiedLocation}
            isDetectingLocation={isLocating}
            locationError={error}
            permissionStatus={permissionStatus}
            onOpenTroubleshooting={openDeniedModal}
            onSelectManualWard={selectManualWard}
            heightClass="h-[320px] sm:h-[350px] lg:h-[360px]"
          />
        </div>

        {/* Right: Report a Water Problem Big CTA & Awareness Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
          {/* Big Action Card */}
          <div
            onClick={() => navigate('/report')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate('/report'); }}
            className="group relative p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-sky-600 via-sky-700 to-blue-700 text-white shadow-md shadow-sky-600/20 cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between"
          >
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
                <Camera className="w-7 h-7" />
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:translate-x-1 group-hover:bg-white group-hover:text-sky-700 transition-all">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>

            <div className="relative z-10 mt-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-200">
                {t('home.civicAction')}
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5">
                {t('home.reportWaterProblem')}
              </h3>
              <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-sm leading-relaxed">
                {t('home.reportProblemDesc')}
              </p>
            </div>
          </div>

          {/* Every Drop Matters Awareness Card */}
          <Card variant="subtle" padding="md" className="border-sky-100/80 bg-gradient-to-r from-sky-50/60 to-emerald-50/40">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Droplet className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  {t('home.everyDropMatters')}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {t('home.everyDropMattersDesc')}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Report a Water Issue: 6 Categories Grid (3-column X 2-row layout) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200/70">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {t('home.reportIssueCategories')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {t('home.selectCategoryDesc')}
            </p>
          </div>
          <NavLink
            to="/report"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100/90 px-3 py-1.5 rounded-xl border border-sky-200/80 transition-all self-start sm:self-auto shadow-2xs"
          >
            <span>Custom / Other Issue</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        {/* 3-column x 2-row grid on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 xl:gap-7">
          {WATER_ISSUES.map((issue) => (
            <IssueCard
              key={issue.id}
              id={issue.id}
              title={issue.title}
              description={issue.description}
              onClick={() => handleSelectIssue(issue.id)}
            />
          ))}
        </div>
      </div>

      {/* Important Notices Section */}
      <div className="bg-white/80 backdrop-blur-xs rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Important Notices
                  </h3>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Live civic alerts & scheduled maintenance
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAllNoticesExpanded((prev) => !prev)}
              aria-expanded={isAllNoticesExpanded}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100/90 px-3 py-1.5 rounded-xl border border-sky-200/80 transition-all cursor-pointer shadow-2xs"
            >
              <span>{isAllNoticesExpanded ? 'Show Less' : `See All (${noticesList.length})`}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isAllNoticesExpanded ? 'rotate-180 text-sky-700' : 'text-sky-600'
                }`}
              />
            </button>
          </div>

          {/* Latest Notices in a 2 X 1 Grid on Medium & Large Desktop */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Latest Notices
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Showing {latestNotices.length} most recent
              </span>
            </div>

            {noticesLoading ? (
              <LoadingState message="Loading municipal notices..." />
            ) : noticesError ? (
              <ErrorState message={noticesError} onRetry={() => void fetchNotices()} />
            ) : noticesList.length === 0 ? (
              <EmptyState
                icon={<Megaphone className="w-8 h-8 text-sky-600" />}
                title="No active notices"
                description="Municipal notices will appear here when published."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {latestNotices.map((notice) => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    onClick={() => navigate('/notices')}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Older Notices: Moved Below, Revealed when 'See All' is clicked */}
          {isAllNoticesExpanded && (
            <div className="space-y-2 pt-3 border-t border-slate-100 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  Older Notices & Advisories
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {olderNotices.length} previous updates
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {olderNotices.map((notice) => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    onClick={() => navigate('/notices')}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Broadcast Subscription Strip */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <Bell className="w-3.5 h-3.5 text-sky-600" />
            <span>
              {noticesLoading ? 'Loading notices...' : noticesError ? 'Notices unavailable' : `${noticesList.length} active notices`}
            </span>
          </span>
          <NavLink
            to="/notices"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline"
          >
            <span>Notice Board Full Archive →</span>
          </NavLink>
        </div>
      </div>

      <div className="hidden md:block">
        <JalSetuProcessSection />
      </div>

      {/* Motivational Water Conservation Banner (1x2 Layout) */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-sky-950 via-blue-900 to-indigo-950 text-white p-6 sm:p-8 lg:p-9 shadow-xl shadow-sky-950/20 border border-sky-600/30">
        {/* Subtle decorative atmospheric water glows */}
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-sky-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-56 h-56 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />

        {/* 1×2 Grid Layout */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left Side: Motivational Quote & Message (8 cols) */}
          <div className="lg:col-span-8 flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-sky-400/20 to-blue-500/30 border border-sky-300/30 flex items-center justify-center shrink-0 shadow-inner text-sky-300">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-sky-300" />
            </div>

            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-400/15 border border-sky-300/30 text-sky-200 text-[11px] font-semibold tracking-wide backdrop-blur-xs">
                <Droplets className="w-3.5 h-3.5 text-sky-300" />
                <span>{t('home.motivationalBadge')}</span>
              </div>

              <blockquote className="text-base sm:text-lg lg:text-xl font-extrabold text-white tracking-tight leading-snug sm:leading-relaxed">
                {t('home.motivationalQuote')}
              </blockquote>

              <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed max-w-2xl">
                {t('home.motivationalSubtext')}
              </p>
            </div>
          </div>

          {/* Right Side: 'Learn More Conservation Tips' button/link (4 cols) */}
          <div className="lg:col-span-4 flex lg:justify-end items-center">
            <NavLink
              to="/awareness"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl bg-white hover:bg-sky-50 text-slate-900 hover:text-sky-950 font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shrink-0 border border-sky-100 group"
            >
              <span>{t('home.learnMoreTips')}</span>
              <ArrowRight className="w-4 h-4 text-sky-600 group-hover:translate-x-1 transition-transform" />
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};
