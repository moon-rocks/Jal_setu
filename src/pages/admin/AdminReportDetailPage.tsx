import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { MapContainer } from '../../components/common/MapContainer';
import { EmptyState } from '../../components/ui/EmptyState';
import { ReportTimeline } from '../../components/common/ReportTimeline';
import {
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Users,
  Sparkles,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Image as ImageIcon,
  HardHat,
  Send,
  Camera,
  XCircle,
} from 'lucide-react';
import { ReportStatus, ReportItem } from '../../types';
import { reportService } from '../../services/reportService';
import { teamService } from '../../services/teamService';
import { auditService } from '../../services/auditService';
import { teamMemberService } from '../../services/teamMemberService';
import { TeamMemberProfile, AssignedReportItem } from '../../types/teamMember';
import { useRealtimeSubscription } from '../../hooks/useRealtime';

export const AdminReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<ReportItem | null>(null);
  const [assignedReportData, setAssignedReportData] = useState<AssignedReportItem | null>(null);
  const [currentStatus, setCurrentStatus] = useState<ReportStatus>('under_review');
  const [teamMembers, setTeamMembers] = useState<TeamMemberProfile[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [assignmentDeadline, setAssignmentDeadline] = useState('Today, 6:00 PM');
  const [assignmentInstructions, setAssignmentInstructions] = useState('');
  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [aiData, setAiData] = useState<{ confidence?: number; summary?: string; recommendation?: string } | null>(null);
  const [timelineTimestamps, setTimelineTimestamps] = useState<Partial<Record<ReportStatus, string>>>({});
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Verification modal / feedback
  const [verificationFeedback, setVerificationFeedback] = useState('Work inspected and verified against municipal hydraulic specifications.');
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchReport = async () => {
    if (!id) return;
    setIsLoading(true);
    const [data, history, aiResult, members, assignedDetail] = await Promise.all([
      reportService.getReportById(id),
      reportService.getStatusHistory(id),
      reportService.getAiAnalysis(id),
      teamMemberService.getTeamMembers({ status: 'active' }),
      teamMemberService.getAssignedReportById(id),
    ]);

    if (data) {
      setReport(data);
      setCurrentStatus(data.status);
      if (data.status !== 'submitted') setIsLocationVerified(true);
    }

    if (assignedDetail) {
      setAssignedReportData(assignedDetail);
      if (assignedDetail.assignedMemberId) {
        setSelectedMemberId(assignedDetail.assignedMemberId);
      }
      if (assignedDetail.deadline) {
        setAssignmentDeadline(assignedDetail.deadline);
      }
      if (assignedDetail.instructions) {
        const [assignmentDeadline, setAssignmentDeadline] = useState('');
      }
    }

    if (members && members.length > 0) {
      setTeamMembers(members);
      if (!selectedMemberId && members.length > 0) {
        setSelectedMemberId(members[0].id);
      }
    }

    if (aiResult) {
      setAiData({
        confidence: aiResult.confidence,
        summary: aiResult.summary,
        recommendation: aiResult.recommendation,
      });
    }

    if (history && history.length > 0) {
      const tsMap: Partial<Record<ReportStatus, string>> = {};
      history.forEach((h: any) => {
        if (h.to_status) {
          tsMap[h.to_status as ReportStatus] = new Date(h.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            month: 'short',
            day: 'numeric',
          });
        }
      });
      setTimelineTimestamps(tsMap);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  useRealtimeSubscription('reports', () => {
    fetchReport();
  });

  const reportId = report?.id || id || '';
  const issueTitle = report?.issueTitle || '';
  const ward = report?.location?.ward || '';
  const city = report?.location?.city || '';
  const latitude = report?.location?.latitude;
  const longitude = report?.location?.longitude;
  const accuracy = report?.location?.accuracy;
  const timestamp = report?.submittedAt || '';
  const aiConfidence = aiData?.confidence ?? report?.aiConfidence;
  const aiSummary = aiData?.summary;

  const handleVerifyLocation = async () => {
    setIsLocationVerified(true);
    setCurrentStatus('location_verified');
    await reportService.updateReportStatus(reportId, 'location_verified', {
      reason: `GIS boundary verified for ${ward}`,
    });
    await auditService.logAction('VERIFY_LOCATION', 'REPORT', reportId, { ward });
  };

  // Assign Team Member
  const handleAssignTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;

    const chosen = teamMembers.find((m) => m.id === selectedMemberId);
    if (!chosen) return;

    setIsLoading(true);
    await teamMemberService.assignReportToMember(reportId, selectedMemberId, {
      deadline: assignmentDeadline,
      instructions: assignmentInstructions,
      assignedBy: 'Superintendent Engineer',
    });

    setCurrentStatus('team_assigned');
    setFeedbackNotice(`Dispatched assignment to ${chosen.name} (${chosen.designation}). Notification sent.`);
    setTimeout(() => setFeedbackNotice(null), 4000);
    fetchReport();
  };

  const handleVerifyWork = async (approved: boolean) => {
    setIsVerifying(true);
    await teamMemberService.adminVerifyReport(
      reportId,
      'admin-superintendent',
      approved,
      verificationFeedback
    );
    setIsVerifying(false);

    if (approved) {
      setCurrentStatus('resolved');
      setFeedbackNotice('Work verified and signed off. Report is marked as Resolved.');
    } else {
      setCurrentStatus('repair_in_progress');
      setFeedbackNotice('Completion rejected. Revision request dispatched to field team.');
    }
    setTimeout(() => setFeedbackNotice(null), 4000);
    fetchReport();
  };

  const handleStatusChange = async (newStatus: ReportStatus) => {
    setCurrentStatus(newStatus);
    await reportService.updateReportStatus(reportId, newStatus, {
      reason: `Administrative transition to ${newStatus}`,
    });
    await auditService.logAction('UPDATE_STATUS', 'REPORT', reportId, { status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Loading Incident Details...
        </p>
      </div>
    );
  }

  if (!report) {
    return <EmptyState title="Report not found" description="This report does not exist or is not available to your account." actionLabel="Back to reports" onAction={() => navigate('/admin/reports')} />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 select-none font-sans text-left">
      {/* Top Header */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold font-mono text-slate-400">
            Case: {reportId}
          </span>
          <StatusBadge status={currentStatus} />
        </div>
      </div>

      {feedbackNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Photo Evidence & GIS Map (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Photo Evidence with Watermark */}
          <div className="rounded-3xl border border-slate-200 overflow-hidden bg-slate-900 shadow-sm relative aspect-4/3 flex flex-col justify-between p-4 text-white">
            {report?.photoUrl && (
              <img
                src={report.photoUrl}
                alt="Report Incident Photo"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 pointer-events-none z-10" />

            <div className="flex items-center justify-between z-20">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Report Evidence</span>
              </span>
              {aiConfidence != null && <span className="text-[11px] font-mono bg-black/60 px-2 py-0.5 rounded text-slate-300">
                AI Match: {aiConfidence}%
              </span>}
            </div>

            {!report?.photoUrl && (
              <div className="my-auto text-center text-slate-400 z-20">
                <p className="text-xs font-semibold text-slate-300">No evidence photo attached</p>
              </div>
            )}

            {/* Automatically stamped overlay */}
            <div className="z-20 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>{ward || 'Ward unavailable'}{city ? `, ${city}` : ''}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{timestamp}</span>
                </span>
                <span>{accuracy == null ? 'Accuracy unavailable' : `Accuracy ±${accuracy}m`}</span>
              </div>
            </div>
          </div>

          {/* Operational Map */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                GIS Incident Location
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                {latitude !== undefined && longitude !== undefined
                  ? `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`
                  : 'Coordinates Pending'}
              </span>
            </div>
            <MapContainer
              mode="detail"
              detectedLocation={
                latitude !== undefined && longitude !== undefined
                  ? {
                      ward,
                      city,
                      latitude,
                      longitude,
                      accuracy,
                    }
                  : undefined
              }
              heightClass="h-[240px]"
            />
          </div>

          {/* ADMIN VERIFICATION REVIEW BOX (When completion evidence is submitted) */}
          {(assignedReportData?.status === 'completed' || assignedReportData?.completionNotes || assignedReportData?.afterPhotoUrl) && (
            <Card variant="default" padding="md" className="border-emerald-300 bg-emerald-50/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Submitted Completion Evidence Review</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {assignedReportData?.status === 'admin_verified' ? 'VERIFIED' : 'AWAITING APPROVAL'}
                </span>
              </div>

              {/* Photo comparisons */}
              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white p-1">
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">Before Repair</span>
                  {assignedReportData?.beforePhotoUrl ? (
                    <img
                      src={assignedReportData.beforePhotoUrl}
                      alt="Before"
                      className="w-full h-28 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="h-28 flex items-center justify-center text-slate-400 text-[11px]">No before photo</div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white p-1">
                  <span className="text-[10px] font-bold text-emerald-700 block mb-1">After Repair (Proof)</span>
                  {assignedReportData?.afterPhotoUrl ? (
                    <img
                      src={assignedReportData.afterPhotoUrl}
                      alt="After"
                      className="w-full h-28 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="h-28 flex items-center justify-center text-slate-400 text-[11px]">No after photo</div>
                  )}
                </div>
              </div>

              {assignedReportData?.completionNotes && (
                <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs space-y-1">
                  <span className="font-bold text-emerald-800">Field Technician Summary:</span>
                  <p className="text-slate-700 leading-relaxed">{assignedReportData.completionNotes}</p>
                </div>
              )}

              {/* Verification Feedback Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Supervisor Inspection Feedback</label>
                <textarea
                  rows={2}
                  value={verificationFeedback}
                  onChange={(e) => setVerificationFeedback(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={() => handleVerifyWork(false)}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject & Request Revision</span>
                </button>

                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={() => handleVerifyWork(true)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isVerifying ? 'Verifying...' : 'Approve & Mark Verified'}</span>
                </button>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Case Management & Operations (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Issue & Citizen Report Summary */}
          <Card variant="default" padding="md" className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Reported Issue
                </span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {issueTitle}
                </h3>
              </div>
              <PriorityBadge priority={report.priority} />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              &ldquo;{report.description || 'No description provided.'}&rdquo;
            </p>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Ward Zone</span>
                <span className="font-semibold text-slate-800">{ward || 'Ward unavailable'}{city ? `, ${city}` : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp</span>
                <span className="font-mono text-slate-700">{timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">GPS Confidence</span>
                <span className="font-mono text-slate-700 font-semibold">{accuracy == null ? 'Unavailable' : `±${accuracy}m`}</span>
              </div>
            </div>
          </Card>

          {/* AI Assistance Card */}
          <Card variant="subtle" padding="md" className="bg-sky-50/50 border-sky-200/80 space-y-2.5">
            <div className="flex items-center gap-2 text-sky-950 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>AI Automated Diagnostic</span>
              {aiConfidence != null && <span className="ml-auto font-mono text-[11px] text-sky-700 bg-sky-100 px-2 py-0.5 rounded font-bold">{aiConfidence}% Match</span>}
            </div>
            <p className="text-xs text-slate-600">
              {aiSummary || 'AI analysis is not available for this report.'}
            </p>
          </Card>

          {/* TEAM MEMBER ASSIGNMENT SYSTEM (Section 18) */}
          <Card variant="default" padding="md" className="space-y-4 border-sky-200 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <HardHat className="w-4 h-4 text-sky-600" />
              <span>Assign to Field Team Member</span>
            </h4>

            <form onSubmit={handleAssignTeamMember} className="space-y-3">
              {/* Team Member Select */}
              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-slate-700">Select Field Personnel *</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  required
                  className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 py-2.5 px-3 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.designation} ({m.teamName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Deadline */}
              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-slate-700">Target Resolution Deadline</label>
                <input
                  type="text"
                  value={assignmentDeadline}
                  onChange={(e) => setAssignmentDeadline(e.target.value)}
                  placeholder="e.g. Today, 5:00 PM"
                  className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 py-2 px-3 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Instructions */}
              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-slate-700">Dispatch Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={assignmentInstructions}
                  onChange={(e) => setAssignmentInstructions(e.target.value)}
                  placeholder="e.g. Carry 150mm mechanical sleeve clamp. Isolate valve at sector 4 junction first."
                  className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-sky-500 placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-sky-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Assignment & Notify Personnel</span>
              </button>
            </form>
          </Card>

          {/* Operational Actions (Location verification & Status override) */}
          <Card variant="default" padding="md" className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Administrative Overrides
            </h4>

            <div>
              <Button
                variant={isLocationVerified ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleVerifyLocation}
                className="w-full justify-between text-xs"
                leftIcon={<MapPin className="w-4 h-4" />}
                rightIcon={isLocationVerified ? <Check className="w-4 h-4 text-emerald-600" /> : undefined}
              >
                <span>{isLocationVerified ? 'Location Verified with GIS' : 'Verify Location with Ward GIS'}</span>
              </Button>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-slate-700">
                Override Report Status
              </label>
              <select
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value as ReportStatus)}
                className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
              >
                <option value="submitted">Submitted</option>
                <option value="location_verified">Location Verified</option>
                <option value="under_review">Under Review</option>
                <option value="team_assigned">Team Assigned</option>
                <option value="repair_in_progress">Repair In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </Card>

          {/* Timeline */}
          <Card variant="default" padding="md">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Live Case Progress
            </h4>
            <ReportTimeline currentStatus={currentStatus} timestamps={timelineTimestamps} />
          </Card>
        </div>
      </div>
    </div>
  );
};
