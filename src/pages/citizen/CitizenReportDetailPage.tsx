import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { ReportTimeline } from '../../components/common/ReportTimeline';
import { EmptyState } from '../../components/ui/EmptyState';
import { MapContainer } from '../../components/common/MapContainer';
import { MapPin, Clock, ShieldCheck, UserCheck, Image as ImageIcon, Loader2 } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { ReportItem, ReportStatus } from '../../types';
import { useRealtimeSubscription } from '../../hooks/useRealtime';

export const CitizenReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<ReportItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timelineTimestamps, setTimelineTimestamps] = useState<Partial<Record<ReportStatus, string>>>({});

  const fetchReport = async () => {
    if (!id) return;
    setIsLoading(true);
    const [data, history] = await Promise.all([
      reportService.getReportById(id),
      reportService.getStatusHistory(id),
    ]);

    if (data) setReport(data);

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Loading Report Timeline...
        </p>
      </div>
    );
  }

  if (!report) {
    return <EmptyState title="Report not found" description="This report does not exist or is not available to your account." actionLabel="Back to my reports" onAction={() => navigate('/my-reports')} />;
  }

  const reportId = report.id;
  const issueTitle = report.issueTitle;
  const wardName = report.location.ward;
  const cityName = report.location.city;
  const latitude = report.location.latitude;
  const longitude = report.location.longitude;
  const accuracyMeters = report.location.accuracy;
  const submittedTimestamp = report.submittedAt;
  const currentStatus = report.status;

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none">
      {/* Back Header */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold font-mono text-slate-400">
            Reference: {reportId}
          </span>
          <StatusBadge status={currentStatus} />
        </div>
      </div>

      {/* Main Grid: Evidence & Issue Info */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Photo Evidence & GIS Map (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          {/* Photo Evidence with Automatic Stamp */}
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
            </div>

            {!report?.photoUrl && (
              <div className="text-center text-slate-400 my-auto z-20">
                <ImageIcon className="w-12 h-12 mx-auto mb-1 text-sky-400/50" />
                <p className="text-xs text-slate-300 font-medium">No evidence photo attached</p>
              </div>
            )}

            {/* Automatic Stamp Bar */}
            <div className="z-20 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 rounded-xl space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>{wardName}{wardName && cityName ? ', ' : ''}{cityName}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{submittedTimestamp}</span>
                </span>
                <span>{accuracyMeters == null ? 'Accuracy unavailable' : `±${Math.round(accuracyMeters)}m GPS`}</span>
              </div>
            </div>
          </div>

          {/* GIS Location Map */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Verified Incident Location
              </h4>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {latitude !== undefined && longitude !== undefined
                  ? 'GPS Pinpoint Verified'
                  : 'Coordinates Pending'}
              </span>
            </div>
            <MapContainer
              mode="detail"
              detectedLocation={
                latitude !== undefined && longitude !== undefined
                  ? {
                      ward: wardName,
                      city: cityName,
                      latitude,
                      longitude,
                      accuracy: accuracyMeters,
                    }
                  : undefined
              }
              heightClass="h-[220px]"
            />
          </div>
        </div>

        {/* Right Column: Status Pipeline & Details (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <Card variant="default" padding="md" className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Issue Summary
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
                <span className="text-slate-400">Assigned Ward</span>
                <span className="font-semibold text-slate-800">{wardName}, {cityName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Team</span>
                <span className="font-semibold text-sky-700">
                  {report?.assignedTeamName || 'Queued for Assignment'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Submission Date</span>
                <span className="font-mono text-slate-700">{submittedTimestamp}</span>
              </div>
            </div>
          </Card>

          {/* Dynamic Resolution Pipeline Timeline with Real Timestamps */}
          <Card variant="default" padding="md">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Official Resolution Pipeline
            </h4>
            <ReportTimeline currentStatus={currentStatus} timestamps={timelineTimestamps} completedAt={report.completedAt} />
          </Card>
        </div>
      </div>
    </div>
  );
};
