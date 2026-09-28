import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Bell, Globe2, Shield, Eye, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const CitizenSettingsPage: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [highAccuracyGps, setHighAccuracyGps] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 select-none">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Settings & Preferences
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Customize your language, notifications, and location accuracy.
        </p>
      </div>

      <div className="space-y-4">
        {/* Language Selection */}
        <Card variant="default" padding="md" className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Globe2 className="w-4 h-4 text-sky-600" />
            <span>Application Language / भाषा</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'en', label: 'English', sub: 'Standard' },
              { id: 'hi', label: 'हिन्दी', sub: 'Hindi' },
              { id: 'bho', label: 'भोजपुरी', sub: 'Bhojpuri' },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setLanguage(lang.id as 'en' | 'hi' | 'bho')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  language === lang.id
                    ? 'border-sky-600 bg-sky-50/70 text-sky-900 font-bold ring-2 ring-sky-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <p className="text-sm font-bold">{lang.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{lang.sub}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Notifications Preferences */}
        <Card variant="default" padding="md" className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Bell className="w-4 h-4 text-sky-600" />
            <span>Notification Channels</span>
          </div>

          <div className="space-y-3 divide-y divide-slate-100 text-xs">
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-bold text-slate-900">SMS Outage & Repair Alerts</p>
                <p className="text-slate-500">Receive text notifications when your report status advances</p>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="font-bold text-slate-900">Push Notifications</p>
                <p className="text-slate-500">Scheduled supply announcements and ward maintenance warnings</p>
              </div>
              <input
                type="checkbox"
                checked={pushAlerts}
                onChange={(e) => setPushAlerts(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </Card>

        {/* Location & Privacy */}
        <Card variant="default" padding="md" className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Shield className="w-4 h-4 text-sky-600" />
            <span>Location & GIS Precision</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-900">High-Precision GPS Mode</p>
              <p className="text-slate-500">Ensures reported leaks are tagged to within ±5-10 meters</p>
            </div>
            <input
              type="checkbox"
              checked={highAccuracyGps}
              onChange={(e) => setHighAccuracyGps(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded cursor-pointer"
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            variant="civic"
            size="md"
            onClick={handleSave}
            rightIcon={saved ? <Check className="w-4 h-4" /> : undefined}
          >
            {saved ? 'Preferences Saved' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};
