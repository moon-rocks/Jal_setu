import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Calendar,
  AlertTriangle,
  Flame,
  CheckCircle2,
  HardHat,
  Camera,
  Activity,
  Navigation,
  FileCheck2,
  ShieldCheck,
  Send,
  Upload,
  User,
  Phone,
  Building,
  Info,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teamMemberService } from '../../services/teamMemberService';
import { AssignedReportItem, WorkStatus, WorkUpdateItem } from '../../types/teamMember';
import { MapContainer } from '../../components/common/MapContainer';

export const TeamReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, teamMemberProfile } = useAuth();
  const memberId = teamMemberProfile?.id || user?.id || '';

  const [report, setReport] = useState<AssignedReportItem | null>(null);
  const [updates, setUpdates] = useState<WorkUpdateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Quick update modal / form state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateType, setUpdateType] = useState('repair_started');
  const [updateMessage, setUpdateMessage] = useState('');

  // Completion submission modal
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionPhotoUrl, setCompletionPhotoUrl] = useState('');

  useEffect(() => {
    async function loadReport() {
      if (!id) return;
      setIsLoading(true);
      setErrorMsg(null);
      const data = await teamMemberService.getAssignedReportById(id, memberId);
      if (data) {
        setReport(data);
        const wUpdates = await teamMemberService.getWorkUpdates(data.id);
        setUpdates(wUpdates);
      } else {
        setErrorMsg('Report not found or not assigned to your account.');
      }
      setIsLoading(false);
    }
    loadReport();
  }, [id, memberId]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs font-sans">
        Loading task details...
      </div>
    );
  }

  if (errorMsg || !report) {
    return (
      <div className="p-12 rounded-2xl bg-[#0E1A30] border border-slate-800 text-center space-y-3 font-sans text-left">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white text-center">Unable to Open Task</h2>
        <p className="text-xs text-slate-400 text-center max-w-md mx-auto">
          {errorMsg || 'You do not have permission to view this task, or it is assigned to another team member.'}
        </p>
        <div className="text-center pt-2">
          <button
            onClick={() => navigate('/team/reports')}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
          >
            Return to Queue
          </button>
        </div>
      </div>
    );
  }

  // Handle work status transitions
  const handleTransition = async (newStatus: WorkStatus) => {
    setActionLoading(true);
    const res = await teamMemberService.updateWorkStatus(report.id, memberId, newStatus);
    setActionLoading(false);

    if (res.success) {
      setReport({ ...report, status: newStatus });
      const refreshed = await teamMemberService.getWorkUpdates(report.id);
      setUpdates(refreshed);
    } else {
      alert(res.error || 'Failed to update status');
    }
  };

  // Submit quick field update
  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateMessage.trim()) return;

    await teamMemberService.addWorkUpdate(report.id, {
      teamMemberId: memberId,
      teamMemberName: teamMemberProfile?.name || 'Field Technician',
      updateType: updateType as any,
      message: updateMessage.trim(),
    });

    setUpdateMessage('');
    setShowUpdateModal(false);
    const refreshed = await teamMemberService.getWorkUpdates(report.id);
    setUpdates(refreshed);
  };

  // Submit completion
  const handleCompleteWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completionNotes.trim()) return;

    setActionLoading(true);
    await teamMemberService.updateWorkStatus(report.id, memberId, 'completed', {
      notes: completionNotes.trim(),
      photoUrl: completionPhotoUrl || undefined,
    });
    setActionLoading(false);
    setShowCompletionModal(false);
    setReport({ ...report, status: 'completed', completionNotes, afterPhotoUrl: completionPhotoUrl });
    const refreshed = await teamMemberService.getWorkUpdates(report.id);
    setUpdates(refreshed);
  };

  // Status Stepper Index
  const steps: { key: WorkStatus; label: string; desc: string }[] = [
    { key: 'assigned', label: '1. Assigned', desc: 'Dispatched by Admin' },
    { key: 'accepted', label: '2. Accepted', desc: 'Acknowledged' },
    { key: 'in_progress', label: '3. In Progress', desc: 'Field repair active' },
    { key: 'completed', label: '4. Completed', desc: 'Awaiting Admin sign-off' },
    { key: 'admin_verified', label: '5. Admin Verified', desc: 'Closed & sealed' },
  ];

  const currentStepIdx = steps.findIndex((s) => s.key === report.status);

  return (
    <div className="space-y-6 select-none font-sans text-left">
      {/* Back button & Title header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
              {report.reportNumber}
            </span>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              {report.issueType.replace('_', ' ')}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
            {report.title}
          </h1>
        </div>

        {/* Directions CTA */}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${report.location.latitude},${report.location.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs transition-colors flex items-center gap-2 border border-slate-700 cursor-pointer self-start sm:self-auto"
        >
          <Navigation className="w-4 h-4" />
          <span>Get Directions</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>
      </div>

      {/* 5-STAGE WORK STATUS PROGRESSION STEPPER */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0E1A30] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Work Status Lifecycle
          </span>
          <span className="text-[11px] font-mono text-amber-400 font-bold">
            Current: {report.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          {steps.map((st, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div
                key={st.key}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isCurrent
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  ) : null}
                  <span>{st.label}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{st.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Security Notice: Admin Verification is Admin-only */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span>
            Stage 5 (Admin Verification) is performed solely by the Municipal Administrator after reviewing field evidence.
          </span>
        </div>
      </div>

      {/* ACTION BAR: Fast state transition buttons */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-[#0E1A30] border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-white uppercase tracking-wider">
            Required Next Action
          </p>
          <p className="text-xs text-slate-400">
            {report.status === 'assigned' && 'Acknowledge dispatch to confirm receipt of task.'}
            {report.status === 'accepted' && 'Mark as in-progress upon arriving on site.'}
            {report.status === 'in_progress' && 'Upload before/after photos and submit completion notes.'}
            {report.status === 'completed' && 'Field work submitted. Waiting for Municipal Admin sign-off.'}
            {report.status === 'admin_verified' && 'Report verified by Admin. Issue is closed.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {report.status === 'assigned' && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleTransition('accepted')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md"
            >
              {actionLoading ? 'Updating...' : 'Accept Assignment'}
            </button>
          )}

          {report.status === 'accepted' && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleTransition('in_progress')}
              className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
            >
              {actionLoading ? 'Updating...' : 'Start Field Work'}
            </button>
          )}

          {report.status === 'in_progress' && (
            <>
              <button
                type="button"
                onClick={() => setShowUpdateModal(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors border border-slate-700 cursor-pointer flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                <span>Add Progress Note</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/team/evidence?reportId=${report.id}`)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors border border-slate-700 cursor-pointer flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Upload Photos</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCompletionModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Completion</span>
              </button>
            </>
          )}

          {report.status === 'completed' && (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Completion Submitted · Under Admin Review</span>
            </div>
          )}

          {report.status === 'admin_verified' && (
            <div className="px-3.5 py-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Admin Verified & Closed</span>
            </div>
          )}
        </div>
      </div>

      {/* DUAL COLUMN: Issue & Location Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Issue, Instructions, Citizen, Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Info Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0E1A30] border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400" />
              <span>Issue Information</span>
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              {report.description}
            </p>

            {/* Instructions box */}
            {report.instructions && (
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-1">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Supervisor Dispatch Instructions:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {report.instructions}
                </p>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-400 border-t border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Reported On</span>
                <span className="text-slate-200 font-medium">{report.citizenReportDate}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Dispatched</span>
                <span className="text-slate-200 font-medium">{report.assignedDate}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Target Deadline</span>
                <span className="text-amber-400 font-semibold">{report.deadline || 'Today, 6:00 PM'}</span>
              </div>
            </div>
          </div>

          {/* Privacy-Safe Citizen Contact Info */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0E1A30] border border-slate-800 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span>Citizen Reporter Contact (Minimal / Field Access Only)</span>
            </h2>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <div>
                <p className="font-semibold text-white">
                  {report.citizenInfo?.name || 'Local Resident Reporter'}
                </p>
                <p className="text-slate-400 text-[11px]">
                  {report.citizenInfo?.locality || report.location.ward}
                </p>
              </div>
              {report.citizenInfo?.phone && (
                <div className="flex items-center gap-1.5 font-mono text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{report.citizenInfo.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Photographic Evidence Gallery */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0E1A30] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Field Photographic Evidence</span>
              </h2>
              <NavLink
                to={`/team/evidence?reportId=${report.id}`}
                className="text-xs font-bold text-amber-400 hover:underline"
              >
                + Upload New Photo
              </NavLink>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Before Photo */}
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900 text-center space-y-1 pb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block pt-1.5">
                  Before Work
                </span>
                {report.beforePhotoUrl ? (
                  <img
                    src={report.beforePhotoUrl}
                    alt="Before repair"
                    className="w-full h-36 object-cover"
                  />
                ) : (
                  <div className="h-36 flex flex-col items-center justify-center text-slate-500 text-xs">
                    <Camera className="w-6 h-6 mb-1 text-slate-600" />
                    <span>No photo uploaded</span>
                  </div>
                )}
              </div>

              {/* During Photo */}
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900 text-center space-y-1 pb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block pt-1.5">
                  During Work
                </span>
                {report.duringPhotoUrl ? (
                  <img
                    src={report.duringPhotoUrl}
                    alt="During repair"
                    className="w-full h-36 object-cover"
                  />
                ) : (
                  <div className="h-36 flex flex-col items-center justify-center text-slate-500 text-xs">
                    <Camera className="w-6 h-6 mb-1 text-slate-600" />
                    <span>No photo uploaded</span>
                  </div>
                )}
              </div>

              {/* After Photo */}
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900 text-center space-y-1 pb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block pt-1.5">
                  After Work (Proof)
                </span>
                {report.afterPhotoUrl ? (
                  <img
                    src={report.afterPhotoUrl}
                    alt="After repair"
                    className="w-full h-36 object-cover"
                  />
                ) : (
                  <div className="h-36 flex flex-col items-center justify-center text-slate-500 text-xs">
                    <Camera className="w-6 h-6 mb-1 text-slate-600" />
                    <span>No photo uploaded</span>
                  </div>
                )}
              </div>
            </div>

            {report.completionNotes && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1">
                <span className="font-bold text-emerald-400 text-[11px] uppercase tracking-wider block">
                  Submitted Completion Summary:
                </span>
                <p className="text-slate-300 leading-relaxed">{report.completionNotes}</p>
              </div>
            )}
          </div>

          {/* Work Updates Timeline */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0E1A30] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span>Field Progress Updates ({updates.length})</span>
              </h2>
              {report.status === 'in_progress' && (
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(true)}
                  className="text-xs font-bold text-amber-400 hover:underline"
                >
                  + Add Progress Note
                </button>
              )}
            </div>

            <div className="space-y-3">
              {updates.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  No field progress notes recorded yet.
                </p>
              ) : (
                updates.map((up) => (
                  <div key={up.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400">{up.teamMemberName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(up.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{up.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Location Map & Assignment details */}
        <div className="space-y-6">
          {/* Map Preview */}
          <div className="p-5 rounded-2xl bg-[#0E1A30] border border-slate-800 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Location GPS Coordinates</span>
            </h2>

            <div className="h-56 rounded-xl overflow-hidden border border-slate-700">
              <MapContainer
                mode="detail"
                heightClass="h-56"
                detectedLocation={{
                  ward: report.location.ward,
                  city: report.location.city,
                  latitude: report.location.latitude,
                  longitude: report.location.longitude,
                  accuracy: report.location.accuracy || 6,
                }}
              />
            </div>

            <div className="text-xs space-y-1 text-slate-300">
              <p className="font-bold text-white">
                {report.location.address || 'Reported Location'}
              </p>
              <p className="text-slate-400 text-[11px]">
                {report.location.ward}, {report.location.city}
              </p>
              <p className="text-[10px] font-mono text-slate-500">
                GPS: {report.location.latitude.toFixed(6)}, {report.location.longitude.toFixed(6)} (±{report.location.accuracy || 6}m)
              </p>
            </div>
          </div>

          {/* Assignment Information Card */}
          <div className="p-5 rounded-2xl bg-[#0E1A30] border border-slate-800 space-y-3 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-sky-400" />
              <span>Municipal Assignment Record</span>
            </h2>

            <div className="space-y-2 divide-y divide-slate-800/80 text-slate-300">
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Assigned By:</span>
                <span className="font-semibold text-white">{report.assignedBy || 'Executive Desk'}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Field Team Member:</span>
                <span className="font-semibold text-white">{report.assignedMemberName || 'You'}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Department:</span>
                <span className="text-white">Water Supply & Distribution</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Service Ward:</span>
                <span className="text-white">{report.location.ward}</span>
              </div>
              {report.adminVerifiedBy && (
                <div className="flex justify-between pt-2 text-purple-300">
                  <span className="text-slate-400">Verified By:</span>
                  <span className="font-bold">{report.adminVerifiedBy}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK WORK UPDATE MODAL */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F1D36] border border-slate-700 rounded-2xl p-6 text-white space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Add Progress Update</span>
            </h3>

            <form onSubmit={handleSubmitUpdate} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-300">Update Category</label>
                <select
                  value={updateType}
                  onChange={(e) => setUpdateType(e.target.value)}
                  className="w-full bg-[#081224] text-white text-xs rounded-xl border border-slate-700 py-2.5 px-3 focus:outline-none focus:border-amber-500"
                >
                  <option value="work_started">Work Started on Site</option>
                  <option value="inspection_completed">Inspection Completed</option>
                  <option value="repair_started">Repair / Welding Started</option>
                  <option value="materials_required">Materials / Parts Required</option>
                  <option value="repair_completed">Repair Completed (Pre-Check)</option>
                  <option value="access_issue">Unable to Access Site</option>
                  <option value="escalated">Requires Additional Team Escalation</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-300">Progress Details / Notes</label>
                <textarea
                  rows={3}
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  required
                  placeholder="Describe current status, parts replaced, or pressure observations..."
                  className="w-full bg-[#081224] text-white text-xs rounded-xl border border-slate-700 p-3 focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Post Progress Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETION SUBMISSION MODAL */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0F1D36] border border-slate-700 rounded-2xl p-6 text-white space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Submit Work Completion for Admin Verification</span>
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Before marking this work as completed, summarize the repair actions performed and attach an after-repair photo. The Municipal Administrator will verify before closing the report.
            </p>

            <form onSubmit={handleCompleteWork} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-300">
                  Work Summary & Actions Completed *
                </label>
                <textarea
                  rows={3}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  required
                  placeholder="e.g. Excavated 1.2m, applied 150mm mechanical sleeve clamp over rupture, backfilled and restored pressure to 2.1 bar."
                  className="w-full bg-[#081224] text-white text-xs rounded-xl border border-slate-700 p-3 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-300">
                  Proof Photo URL (or upload via Evidence tab)
                </label>
                <input
                  type="url"
                  value={completionPhotoUrl}
                  onChange={(e) => setCompletionPhotoUrl(e.target.value)}
                  placeholder="https://... or upload photo in Evidence page"
                  className="w-full bg-[#081224] text-white text-xs rounded-xl border border-slate-700 py-2.5 px-3 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                <span>Note: This will advance status to </span>
                <span className="font-bold">Completed (Awaiting Admin Review)</span>.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompletionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                >
                  {actionLoading ? 'Submitting...' : 'Confirm & Submit to Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
