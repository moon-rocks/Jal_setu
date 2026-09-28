import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Shield,
  HardHat,
  Lock,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teamMemberService } from '../../services/teamMemberService';
import { EmptyState } from '../../components/ui/EmptyState';

export const TeamProfilePage: React.FC = () => {
  const { teamMemberProfile } = useAuth();

  const [phone, setPhone] = useState(teamMemberProfile?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const member = teamMemberProfile;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    if (!teamMemberProfile?.id) {
      setIsSaving(false);
      return;
    }
    const success = await teamMemberService.updateTeamMember(teamMemberProfile.id, { phone });
    setIsSaving(false);
    setSavedSuccess(success);
    if (success) setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (!member) {
    return <EmptyState title="Team profile unavailable" description="No team member profile is associated with this signed-in account." />;
  }

  return (
    <div className="space-y-6 select-none font-sans text-left max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <HardHat className="w-6 h-6 text-amber-400" />
          <span>Team Member Profile & Field Credentials</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Official municipal authorization card and field communications contact details.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Contact information updated successfully.</span>
        </div>
      )}

      {/* ID Badge Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0E1A30] via-[#0D182E] to-[#0A1424] border border-slate-800 space-y-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-2xl shrink-0">
            <HardHat className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                ● Active Municipal Personnel
              </span>
              <span className="font-mono text-xs text-slate-400">
                ID: {member.id}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {member.name}
            </h2>
            <p className="text-xs text-amber-300 font-semibold">
              {member.designation} · {member.department}
            </p>
          </div>
        </div>

        {/* Readonly Municipal Allocation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Unit Assigned</span>
            <span className="font-semibold text-white">{member.teamName}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Service Area</span>
            <span className="font-semibold text-white">{member.assignedArea}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Commissioned Date</span>
            <span className="font-mono text-slate-300">
              {new Date(member.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Responsibilities */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Scope of Field Responsibilities:
          </span>
          <p className="text-slate-300 leading-relaxed">{member.responsibilities}</p>
        </div>
      </div>

      {/* Editable Contact Information Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1A30] border border-slate-800 space-y-5 shadow-xl text-left">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">
          Field Communications & Dispatch Phone
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Update the active mobile phone number used for SMS dispatch notices and on-site citizen coordination.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Duty Mobile Number *</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full bg-[#081224] text-white text-xs rounded-xl border border-slate-700 py-3 px-3.5 focus:outline-none focus:border-amber-500"
              />
            </div>

          </div>

          {/* Locked Fields Indicator */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              Official Email, Municipal Designation, Service Ward, and Role permissions are centrally locked and managed by Admin.
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Contact Information'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
