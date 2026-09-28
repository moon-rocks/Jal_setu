import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  ShieldCheck,
  UserCheck,
  Bell,
  Sliders,
  Sparkles,
  Lock,
  Building2,
  Check,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { auditService } from '../../services/auditService';

export const AdminSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'roles' | 'preferences' | 'ai'>('profile');
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState(85);
  const [autoEscalateHighPriority, setAutoEscalateHighPriority] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      if (!isSupabaseConfigured) return;
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('value')
          .eq('id', 'ai_verification')
          .maybeSingle();

        if (data?.value) {
          if (data.value.confidence_threshold !== undefined) {
            setAiConfidenceThreshold(data.value.confidence_threshold);
          }
          if (data.value.auto_escalate !== undefined) {
            setAutoEscalateHighPriority(data.value.auto_escalate);
          }
        }
      } catch (err) {
        console.warn('Failed to load system settings:', err);
      }
    }

    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaved(true);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('system_settings').upsert({
          id: 'ai_verification',
          key_name: 'ai_verification_config',
          value: {
            confidence_threshold: aiConfidenceThreshold,
            auto_escalate: autoEscalateHighPriority,
            model: 'gemini-2.5-flash',
          },
          description: 'AI verification threshold and escalation settings',
          updated_at: new Date().toISOString(),
        });

        await auditService.logAction('UPDATE_SETTINGS', 'SYSTEM_SETTINGS', 'ai_verification', {
          aiConfidenceThreshold,
          autoEscalateHighPriority,
        });
      } catch (err) {
        console.warn('Settings upsert fallback:', err);
      }
    }

    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 select-none max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Municipal System Administration
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure administrative profiles, field dispatch permissions, and AI computer vision parameters.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-2xs">
        {[
          { id: 'profile', label: 'Admin Profile', icon: UserCheck },
          { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
          { id: 'ai', label: 'AI Verification Settings', icon: Sparkles },
          { id: 'notifications', label: 'Alert Channels', icon: Bell },
          { id: 'preferences', label: 'System Preferences', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'profile' && (
        <Card variant="default" padding="lg" className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">Municipal Administrator Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Officer Name" defaultValue="Admin Officer (Superintendent Engineer)" />
            <Input label="Officer ID" defaultValue="MMC-ADMIN-94" disabled />
            <Input label="Department" defaultValue="Muzaffarpur Municipal Water Works" />
            <Input label="Official Email" defaultValue="admin.water@muzaffarpur.gov.in" />
          </div>
        </Card>
      )}

      {activeTab === 'roles' && (
        <Card variant="default" padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Role-Based Access Control (RBAC)</h3>
            <span className="text-xs text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg font-semibold">
              Ready for Stage 1 Backend
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Super Administrator</p>
                <p className="text-slate-500">Full system access, team allocation, and notice broadcasting</p>
              </div>
              <span className="text-slate-700 font-mono font-semibold">3 Active Accounts</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Desk Engineer / Dispatcher</p>
                <p className="text-slate-500">Reviews incoming reports, audits GPS accuracy, assigns field units</p>
              </div>
              <span className="text-slate-700 font-mono font-semibold">8 Active Accounts</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Field Technician / Team Lead</p>
                <p className="text-slate-500">Updates on-site status, uploads completion repair photos</p>
              </div>
              <span className="text-slate-700 font-mono font-semibold">24 Active Accounts</span>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'ai' && (
        <Card variant="default" padding="lg" className="space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-600" />
              <span>AI Automated Verification Thresholds</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Set automated confidence scoring rules for incoming citizen leak photographs.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-800">
                  Minimum Confidence for Auto-Approval ({aiConfidenceThreshold}%)
                </label>
                <span className="font-mono font-bold text-sky-700">{aiConfidenceThreshold}%</span>
              </div>
              <input
                type="range"
                min={70}
                max={99}
                value={aiConfidenceThreshold}
                onChange={(e) => setAiConfidenceThreshold(Number(e.target.value))}
                className="w-full cursor-pointer accent-sky-600"
              />
              <p className="text-[11px] text-slate-400">
                Photos with confidence score equal to or above this percentage are flagged as High Confidence for immediate dispatch.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
              <div>
                <p className="font-bold text-slate-900">Auto-Escalate Critical Main Leaks</p>
                <p className="text-slate-500">Automatically trigger SMS alert to Rapid Repair Lead if confidence exceeds 90%</p>
              </div>
              <input
                type="checkbox"
                checked={autoEscalateHighPriority}
                onChange={(e) => setAutoEscalateHighPriority(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card variant="default" padding="lg" className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">Municipal Alert Notification Routing</h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
              <div>
                <p className="font-bold text-slate-900">Emergency SCADA Telemetry SMS</p>
                <p className="text-slate-500">Critical pressure drop warnings dispatched to mobile +91 98765 43200</p>
              </div>
              <span className="text-emerald-600 font-semibold font-mono">Enabled</span>
            </div>

            <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
              <div>
                <p className="font-bold text-slate-900">Daily SLA Summary Digest</p>
                <p className="text-slate-500">Delivered daily at 8:00 AM to municipal department heads</p>
              </div>
              <span className="text-emerald-600 font-semibold font-mono">Enabled</span>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'preferences' && (
        <Card variant="default" padding="lg" className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">System Preferences</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <Input label="Default Municipal Jurisdiction" defaultValue="Muzaffarpur (All Wards)" disabled />
            <Input label="Max Team Response Radius (km)" defaultValue="12 km" />
            <Input label="Target Resolution SLA (Hours)" defaultValue="4.0 Hours" />
            <Input label="GIS Basemap Server" defaultValue="OpenStreetMap Standard (Free / No API Key)" disabled />
          </div>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          variant="civic"
          size="md"
          onClick={handleSave}
          rightIcon={saved ? <Check className="w-4 h-4" /> : undefined}
        >
          {saved ? 'Settings Saved' : 'Save System Settings'}
        </Button>
      </div>
    </div>
  );
};
