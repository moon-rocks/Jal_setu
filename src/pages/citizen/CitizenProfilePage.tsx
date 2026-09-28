import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Bell,
  Shield,
  Globe2,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  Droplets,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const CitizenProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'Name not provided';
  const displayEmail = profile?.email || user?.email || 'Email not provided';
  const displayPhone = profile?.phone || 'Phone not provided';
  const displayWard = profile?.wardName || 'Ward not assigned';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U';

  return (
    <div className="max-w-3xl mx-auto space-y-6 select-none">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-18 h-18 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center text-2xl font-extrabold shadow-inner shrink-0">
            {initials}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {displayName}
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-400 text-slate-900">
                Verified Citizen
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-sky-100">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {displayEmail}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {displayPhone}
              </span>
              <span className="flex items-center gap-1 font-semibold text-white">
                <MapPin className="w-3.5 h-3.5 text-sky-300" />
                {displayWard}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="space-y-4">
        {/* Core Activities */}
        <Card variant="default" padding="none" className="overflow-hidden divide-y divide-slate-100">
          <button
            type="button"
            onClick={() => navigate('/my-reports')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">My Reports</p>
                <p className="text-xs text-slate-500">Track and monitor your submitted water issues</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Notifications</p>
                <p className="text-xs text-slate-500">SMS alerts, water outage reminders, supply timings</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/map')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Privacy & Location</p>
                <p className="text-xs text-slate-500">Manage device GPS permissions and data storage</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Language / भाषा</p>
                <p className="text-xs text-slate-500">Hindi (हिंदी), English, or Bhojpuri (भोजपुरी)</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </Card>

        {/* Support & About */}
        <Card variant="default" padding="none" className="overflow-hidden divide-y divide-slate-100">
          <button
            type="button"
            onClick={() => navigate('/help')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Help & Support</p>
                <p className="text-xs text-slate-500">Emergency leak helpline & FAQs</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">About JalSetu</p>
                <p className="text-xs text-slate-500">Har Boond, Behtar Bihar · Version 1.0 (Stage 0 UI)</p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-400">Muzaffarpur</span>
          </div>
        </Card>

        {/* Logout Button */}
        <Button
          variant="outline"
          size="md"
          onClick={handleSignOut}
          leftIcon={<LogOut className="w-4 h-4 text-rose-600" />}
          className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
        >
          Sign Out of Account
        </Button>
      </div>
    </div>
  );
};
