import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import {
  Users,
  HardHat,
  Phone,
  Mail,
  MapPin,
  Building,
  CheckCircle2,
  Clock,
  Activity,
  FileCheck2,
  Key,
  ShieldAlert,
  Calendar,
  XCircle,
  ExternalLink,
  ChevronRight,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import { teamMemberService } from '../../services/teamMemberService';
import { TeamMemberProfile, AssignedReportItem, WorkUpdateItem } from '../../types/teamMember';

export const AdminTeamMemberDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [member, setMember] = useState<TeamMemberProfile | null>(null);
  const [assignedReports, setAssignedReports] = useState<AssignedReportItem[]>([]);
  const [updates, setUpdates] = useState<WorkUpdateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setIsLoading(true);
      const data = await teamMemberService.getTeamMemberById(id);
      if (data) {
        setMember(data);
        const reports = await teamMemberService.getAssignedReports(data.id);
        setAssignedReports(reports);

        setUpdates(await teamMemberService.getRecentWorkUpdates(data.id, 100));
      }
      setIsLoading(false);
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400 text-xs">Loading team member record...</div>;
  }

  if (!member) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs space-y-3">
        <p className="text-sm font-bold text-slate-800">Team member not found</p>
        <button
          onClick={() => navigate('/admin/team-members')}
          className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold"
        >
          Return to Team Members
        </button>
      </div>
    );
  }

  const handleToggleStatus = async () => {
    const nextStatus = member.status === 'active' ? 'inactive' : 'active';
    await teamMemberService.toggleStatus(member.id, nextStatus);
    setMember({ ...member, status: nextStatus });
    setActionNotice(`Status changed to ${nextStatus}.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleResetPassword = async () => {
    const confirmed = window.confirm(`Generate new temporary credentials for ${member.email}?`);
    if (!confirmed) return;
    await teamMemberService.resetPassword(member.email, member.id);
    setActionNotice(`Password reset email requested for ${member.email}.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="space-y-6 select-none font-sans text-left">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                {member.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  member.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                ● {member.status.toUpperCase()}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              {member.name}
            </h1>
          </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetPassword}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-amber-600" />
            <span>Reset Password</span>
          </button>

          <button
            type="button"
            onClick={handleToggleStatus}
            className={`px-3.5 py-2 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              member.status === 'active'
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}
          >
            {member.status === 'active' ? (
              <>
                <XCircle className="w-3.5 h-3.5" />
                <span>Disable Member</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enable Member</span>
              </>
            )}
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* TOP PROFILE CARD */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Designation</span>
            <p className="font-bold text-slate-800 text-sm mt-0.5">{member.designation}</p>
            <p className="text-slate-400">{member.department}</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Info</span>
            <p className="font-mono text-slate-800 font-semibold mt-0.5">{member.phone}</p>
            <p className="text-slate-400 font-mono text-[11px]">{member.email}</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Sector</span>
            <p className="font-bold text-slate-800 mt-0.5">{member.assignedArea}</p>
            <p className="text-slate-400">{member.teamName}</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Account Status</span>
            <p className="font-bold text-emerald-600 text-sm mt-0.5 capitalize">{member.status}</p>
            <p className="text-slate-400">Created: {new Date(member.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
          <span className="font-bold text-slate-700">Responsibilities: </span>
          <span>{member.responsibilities}</span>
        </div>
      </div>

      {/* WORK STATISTICS: 6 KPI CARDS */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          Field Operations Performance Metrics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Assigned</span>
            <p className="text-2xl font-extrabold font-mono text-slate-900 mt-1">
              {member.assignedReportsCount}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Completed</span>
            <p className="text-2xl font-extrabold font-mono text-emerald-600 mt-1">
              {member.completedReportsCount}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">In Progress</span>
            <p className="text-2xl font-extrabold font-mono text-blue-600 mt-1">
              {member.inProgressCount || 0}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Pending</span>
            <p className="text-2xl font-extrabold font-mono text-amber-600 mt-1">
              {member.pendingCount || 0}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Verified</span>
            <p className="text-2xl font-extrabold font-mono text-purple-600 mt-1">
              {member.verifiedCount || 0}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Success Rate</span>
            <p className="text-2xl font-extrabold font-mono text-sky-600 mt-1">
              {member.assignedReportsCount > 0
                ? `${Math.round((member.completedReportsCount / member.assignedReportsCount) * 100)}%`
                : '100%'}
            </p>
          </div>
        </div>
      </div>

      {/* DUAL SECTION: Assigned Reports & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Assigned Reports */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Assigned Field Reports ({assignedReports.length})
          </h2>

          <div className="space-y-2.5">
            {assignedReports.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-400 text-xs">
                No active tasks assigned to this team member.
              </div>
            ) : (
              assignedReports.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                        {r.reportNumber}
                      </span>
                      <span className="font-bold text-slate-800">{r.title}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] truncate max-w-md">
                      {r.location.address || r.location.ward} · Deadline: {r.deadline || 'Today'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                      {r.status.replace('_', ' ')}
                    </span>
                    <NavLink
                      to={`/admin/reports/${r.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 transition-colors"
                      title="Inspect Report"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </NavLink>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Complete Activity Timeline */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Field Activity Audit
          </h2>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 text-xs">
            {updates.length === 0 ? (
              <p className="text-slate-400 text-center py-6">No recorded activity.</p>
            ) : (
              updates.map((u) => (
                <div key={u.id} className="border-b border-slate-100 pb-2.5 last:border-0 last:pb-0 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold text-slate-700">{u.updateType.replace('_', ' ').toUpperCase()}</span>
                    <span className="text-slate-400 font-mono">
                      {new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">{u.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
