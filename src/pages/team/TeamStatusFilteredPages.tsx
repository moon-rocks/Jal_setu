import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Flame,
  AlertTriangle,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teamMemberService } from '../../services/teamMemberService';
import { AssignedReportItem } from '../../types/teamMember';

export const TeamInProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, teamMemberProfile } = useAuth();
  const memberId = teamMemberProfile?.id || user?.id || '';
  const [reports, setReports] = useState<AssignedReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const all = await teamMemberService.getAssignedReports(memberId, { status: 'in_progress' });
      setReports(all);
      setIsLoading(false);
    }
    load();
  }, [memberId]);

  return (
    <div className="space-y-6 select-none font-sans text-left max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Clock className="w-6 h-6 text-blue-400" />
          <span>Work in Progress Tasks ({reports.length})</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Active field repairs currently underway by your patrol unit.
        </p>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading active tasks...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#0E1A30] border border-slate-800 text-center text-slate-400 text-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">No Tasks In Progress</p>
            <p>Accept an assignment from your queue to begin field work.</p>
            <button
              onClick={() => navigate('/team/reports')}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Go to Assigned Queue
            </button>
          </div>
        ) : (
          reports.map((r) => (
            <div
              key={r.id}
              className="p-5 rounded-2xl bg-[#0E1A30] border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                  {r.reportNumber}
                </span>
                <span className="text-xs text-blue-300 bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-bold">
                  ● In Progress
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{r.title}</h3>
                <p className="text-xs text-slate-300 mt-1">{r.description}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{r.location.address || r.location.ward}</span>
                </div>

                <button
                  onClick={() => navigate(`/team/reports/${r.id}`)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                >
                  <span>Submit Evidence & Complete</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const TeamCompletedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, teamMemberProfile } = useAuth();
  const memberId = teamMemberProfile?.id || user?.id || '';
  const [reports, setReports] = useState<AssignedReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const all = await teamMemberService.getAssignedReports(memberId);
      const comp = all.filter((r) => r.status === 'completed' || r.status === 'admin_verified');
      setReports(comp);
      setIsLoading(false);
    }
    load();
  }, [memberId]);

  return (
    <div className="space-y-6 select-none font-sans text-left max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <span>Completed Field Repairs ({reports.length})</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Tasks where field repair is finished and photographic evidence has been submitted for municipal verification.
        </p>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading completed work...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#0E1A30] border border-slate-800 text-center text-slate-400 text-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-white">No Completed Tasks Yet</p>
            <p>Completed field jobs with submitted evidence will appear here.</p>
          </div>
        ) : (
          reports.map((r) => (
            <div
              key={r.id}
              className="p-5 rounded-2xl bg-[#0E1A30] border border-slate-800 space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                  {r.reportNumber}
                </span>
                {r.status === 'admin_verified' ? (
                  <span className="text-xs text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin Verified & Closed
                  </span>
                ) : (
                  <span className="text-xs text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Awaiting Admin Sign-off
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{r.title}</h3>
                <p className="text-xs text-slate-300 mt-1">{r.description}</p>
              </div>

              {r.completionNotes && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <span className="font-bold text-emerald-400 text-[10px] uppercase block">
                    Completion Notes:
                  </span>
                  <p className="text-slate-400 text-[11px] mt-0.5">{r.completionNotes}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{r.location.address || r.location.ward}</span>
                </div>

                <button
                  onClick={() => navigate(`/team/reports/${r.id}`)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
