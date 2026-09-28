import React, { useState, useEffect } from 'react';
import {
  Activity,
  Plus,
  Clock,
  CheckCircle2,
  FileCheck2,
  AlertTriangle,
  Send,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teamMemberService } from '../../services/teamMemberService';
import { AssignedReportItem, WorkUpdateItem, WorkUpdateType } from '../../types/teamMember';

export const TeamWorkUpdatesPage: React.FC = () => {
  const { user, teamMemberProfile } = useAuth();
  const memberId = teamMemberProfile?.id || user?.id || '';

  const [reports, setReports] = useState<AssignedReportItem[]>([]);
  const [updates, setUpdates] = useState<WorkUpdateItem[]>([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [updateType, setUpdateType] = useState<WorkUpdateType>('work_started');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  useEffect(() => {
    async function loadData() {
      const repList = await teamMemberService.getAssignedReports(memberId);
      setReports(repList);
      if (repList.length > 0 && !selectedReportId) {
        setSelectedReportId(repList[0].id);
      }
      setUpdates(await teamMemberService.getRecentWorkUpdates(memberId, 100));
    }
    loadData();
  }, [memberId, selectedReportId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportId || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await teamMemberService.addWorkUpdate(selectedReportId, {
      teamMemberId: memberId,
      teamMemberName: teamMemberProfile?.name || '',
      updateType,
      message: message.trim(),
      });
    } catch {
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setMessage('');
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 3000);

    setUpdates(await teamMemberService.getRecentWorkUpdates(memberId, 100));
  };

  return (
    <div className="space-y-6 select-none font-sans text-left max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-400" />
          <span>Field Work Updates & Audit Log</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Log ongoing field actions, part installations, site access observations, and escalation alerts in real time.
        </p>
      </div>

      {/* COMPOSER BOX */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#0E1A30] border border-slate-800 space-y-4 shadow-xl">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Post New Field Update</span>
        </h2>

        {successNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Progress update recorded and synchronized to operations desk.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Task selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Assignment *</label>
              <select
                value={selectedReportId}
                onChange={(e) => setSelectedReportId(e.target.value)}
                required
                className="w-full bg-[#081224] text-white text-xs rounded-xl border border-slate-700 py-2.5 px-3 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    [{r.reportNumber}] {r.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Action Type *</label>
              <select
                value={updateType}
                onChange={(e) => setUpdateType(e.target.value as any)}
                required
                className="w-full bg-[#081224] text-white text-xs rounded-xl border border-slate-700 py-2.5 px-3 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="work_started">Work Started on Site</option>
                <option value="inspection_completed">Inspection Completed</option>
                <option value="repair_started">Repair / Joint Welding Started</option>
                <option value="materials_required">Materials / Parts Required</option>
                <option value="repair_completed">Repair Completed (Pressure Testing)</option>
                <option value="access_issue">Unable to Access Site / Obstruction</option>
                <option value="escalated">Issue Requires Secondary Escalation</option>
                <option value="general_note">General Operational Note</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Progress Message *</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              placeholder="e.g. Completed excavation of 150mm ductile iron trunk line. Identified 10cm longitudinal crack. Ready to mount mechanical clamp."
              className="w-full bg-[#081224] text-white text-xs rounded-xl border border-slate-700 p-3 focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Posting...' : 'Post Progress Update'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* TIMELINE VIEW */}
      <div className="p-6 rounded-3xl bg-[#0E1A30] border border-slate-800 space-y-4 shadow-xl">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Recent Field Timeline ({updates.length})
        </h2>

        <div className="space-y-4">
          {updates.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              No field updates posted yet.
            </p>
          ) : (
            updates.map((item, idx) => (
              <div key={item.id || idx} className="relative flex gap-4 text-xs border-b border-slate-800/60 pb-4 last:border-0 last:pb-0">
                <div className="w-3 h-3 rounded-full bg-blue-400 mt-1 shrink-0 ring-4 ring-blue-500/20" />
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-bold text-amber-300">
                      {item.teamMemberName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(item.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <span className="inline-block px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
                    Task: {item.reportId} · {item.updateType.replace('_', ' ').toUpperCase()}
                  </span>

                  <p className="text-slate-300 leading-relaxed pt-1">
                    {item.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
