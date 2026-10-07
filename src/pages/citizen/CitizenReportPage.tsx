import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { IssueCard, WATER_ISSUES } from '../../components/common/IssueCard';
import { PhotoPreview } from '../../components/common/PhotoPreview';
import { ReportTimeline } from '../../components/common/ReportTimeline';
import { IssueType, ReportStatus, ReportItem } from '../../types';
import {
  CheckCircle2,
  Camera,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Compass,
  AlertTriangle,
  RotateCcw,
  RotateCw,
  X,
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { useLocationContext } from '../../context/LocationContext';
import { RealLocationData } from '../../services/locationService';

export const CitizenReportPage: React.FC = () => {
  const navigate = useNavigate();
  const locationState = useLocation().state as { selectedIssue?: IssueType } | null;
  const {
    location: globalLocation,
    isLocating: isContextLocating,
    getFreshLocation,
    requestLocation,
    openDeniedModal,
  } = useLocationContext();

  // Step state: 1 (Issue), 2 (Photo), 3 (Review & Submit), 4 (Submitted Confirmation)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(
    locationState?.selectedIssue ? 2 : 1
  );

  const [selectedIssue, setSelectedIssue] = useState<IssueType>(
    locationState?.selectedIssue || 'pipeline_leakage'
  );

  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<ReportItem | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionWarning, setSubmissionWarning] = useState<string | null>(null);
  const [evidencePhotos, setEvidencePhotos] = useState<{ file: File; previewUrl: string; capturedAt: string }[]>([]);
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState(0);
  const previewUrls = useRef(new Set<string>());

  // Fresh GPS state for the report
  const [reportLocation, setReportLocation] = useState<RealLocationData | null>(null);
  const [isRefreshingGps, setIsRefreshingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleAcquireFreshGps = useCallback(async () => {
    setIsRefreshingGps(true);
    setGpsError(null);
    setReportLocation(null);
    try {
      const freshLoc = await getFreshLocation();
      if (freshLoc) {
        setReportLocation(freshLoc);
        if (!freshLoc.wardId || !freshLoc.wardNumber || !freshLoc.ward) {
          setGpsError('GPS was acquired, but no configured PostGIS ward boundary contains this location.');
        }
      } else {
        setGpsError('Please grant location permission to acquire fresh GPS coordinates.');
      }
    } catch (err: any) {
      setReportLocation(null);
      setGpsError(err?.message || 'Failed to acquire device GPS.');
    } finally {
      setIsRefreshingGps(false);
    }
  }, [getFreshLocation]);

  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  // Acquire fresh GPS when creating report if already permitted or on request
  useEffect(() => {
    if (globalLocation) {
      handleAcquireFreshGps();
    }
  }, []);

  const autoLocationText = reportLocation
    ? `${reportLocation.wardNumber ? `Ward ${reportLocation.wardNumber}` : 'Ward boundary unavailable'} · ${reportLocation.latitude.toFixed(6)}, ${reportLocation.longitude.toFixed(6)}`
    : 'GPS Location Pending';

  const selectedEvidence = evidencePhotos[selectedEvidenceIndex];
  const autoTimestampText = new Date(selectedEvidence?.capturedAt || Date.now()).toLocaleString();

  const selectedIssueMeta = WATER_ISSUES.find((i) => i.id === selectedIssue) || WATER_ISSUES[0];

  const handleCapturePhoto = (files?: File[]) => {
    if (!files?.length) return;
    setSubmitError(null);
    const availableSlots = 5 - evidencePhotos.length;
    const acceptedFiles = files.filter((file) => file.type.startsWith('image/')).slice(0, availableSlots);
    const additions = acceptedFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.add(previewUrl);
      return { file, previewUrl, capturedAt: new Date().toISOString() };
    });
    if (files.some((file) => !file.type.startsWith('image/'))) {
      setSubmitError('Only image files can be added as evidence.');
    } else if (files.length > availableSlots) {
      setSubmitError('You can attach up to 5 photos per report.');
    }
    if (additions.length) {
      setEvidencePhotos((current) => [...current, ...additions]);
      setSelectedEvidenceIndex(evidencePhotos.length + additions.length - 1);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const photo = evidencePhotos[index];
    if (photo) {
      URL.revokeObjectURL(photo.previewUrl);
      previewUrls.current.delete(photo.previewUrl);
    }
    setEvidencePhotos((current) => current.filter((_, photoIndex) => photoIndex !== index));
    setSelectedEvidenceIndex((current) => Math.max(0, current > index ? current - 1 : Math.min(current, evidencePhotos.length - 2)));
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportLocation?.gpsVerified || !reportLocation.wardId || !reportLocation.wardNumber || !reportLocation.ward) {
      setGpsError('A fresh GPS fix inside a configured PostGIS ward boundary is required before submitting.');
      return;
    }
    if (evidencePhotos.length < 3 || evidencePhotos.length > 5) {
      setSubmitError('Please add between 3 and 5 evidence photos before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmissionWarning(null);

    const result = await reportService.createReport({
      issueType: selectedIssue,
      title: selectedIssueMeta.title,
      description,
      latitude: reportLocation.latitude,
      longitude: reportLocation.longitude,
      accuracy: reportLocation.accuracy,
      wardName: reportLocation.ward,
      city: reportLocation.city,
      address: reportLocation.address,
      wardId: reportLocation.wardId,
      wardNumber: reportLocation.wardNumber,
      gpsVerified: reportLocation.gpsVerified,
      evidencePhotos: evidencePhotos.map(({ file, capturedAt }) => ({ file, capturedAt })),
    });

    setIsSubmitting(false);

    if (result.success && result.report) {
      setSubmittedReport(result.report);
      setCurrentStep(4);
    } else if (result.report) {
      setSubmittedReport(result.report);
      setSubmissionWarning(result.error || 'The report was created, but some evidence could not be saved.');
      setCurrentStep(4);
    } else {
      setSubmitError(result.error || 'Unable to submit the report. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 select-none">
      {/* Step Progress Header */}
      {currentStep <= 3 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Report Water Problem
            </h2>
            <span className="text-xs font-bold text-sky-600 font-mono">
              Step {currentStep} of 3
            </span>
          </div>

          {/* Stepper bar */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div
              className={`h-2 rounded-full transition-colors ${
                currentStep >= 1 ? 'bg-sky-600' : 'bg-slate-200'
              }`}
            />
            <div
              className={`h-2 rounded-full transition-colors ${
                currentStep >= 2 ? 'bg-sky-600' : 'bg-slate-200'
              }`}
            />
            <div
              className={`h-2 rounded-full transition-colors ${
                currentStep >= 3 ? 'bg-sky-600' : 'bg-slate-200'
              }`}
            />
          </div>

          <div className="flex justify-between text-[11px] font-semibold text-slate-500 mt-2">
            <span className={currentStep === 1 ? 'text-sky-700 font-bold' : ''}>
              1. Select Issue
            </span>
            <span className={currentStep === 2 ? 'text-sky-700 font-bold' : ''}>
              2. Capture Photo
            </span>
            <span className={currentStep === 3 ? 'text-sky-700 font-bold' : ''}>
              3. Review & Submit
            </span>
          </div>
        </div>
      )}

      {/* STEP 1: Select Issue */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                What type of water problem are you reporting?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Selecting the appropriate category dispatches the right equipment and technical crew.
              </p>
            </div>

            {/* GPS Status Indicator */}
            <div className="shrink-0">
              {reportLocation?.wardId && reportLocation.wardNumber ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate max-w-[160px]">{reportLocation.ward}</span>
                  <span className="font-mono text-[10px] text-emerald-600">±{reportLocation.accuracy}m</span>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAcquireFreshGps}
                  isLoading={isRefreshingGps}
                  leftIcon={<Compass className="w-3.5 h-3.5 text-sky-600" />}
                >
                  {reportLocation ? 'Retry Ward Verification' : 'Enable GPS Location'}
                </Button>
              )}
            </div>
          </div>

          {gpsError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{gpsError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {WATER_ISSUES.map((issue) => (
              <IssueCard
                key={issue.id}
                id={issue.id}
                title={issue.title}
                description={issue.description}
                isSelected={selectedIssue === issue.id}
                onClick={() => setSelectedIssue(issue.id)}
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button
              variant="ghost"
              size="md"
              onClick={() => navigate('/home')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Cancel
            </Button>
            <Button
              variant="civic"
              size="md"
              onClick={() => setCurrentStep(2)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next: Photo Evidence
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Capture Photo with Automatic Stamp Layout */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 block mb-0.5">
                Selected: {selectedIssueMeta.title}
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Capture Photo Evidence
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Visual proof is verified by municipal engineers before team dispatch.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 underline shrink-0 cursor-pointer"
            >
              Change Issue
            </button>
          </div>

          {/* Photo Preview & Camera Viewfinder Component */}
          <PhotoPreview
            photoCaptured={evidencePhotos.length > 0}
            photoUrl={selectedEvidence?.previewUrl}
            onCapture={handleCapturePhoto}
            onRetake={() => handleRemovePhoto(selectedEvidenceIndex)}
            onContinue={() => setCurrentStep(3)}
            canContinue={evidencePhotos.length >= 3}
            locationStampText={`📍 ${autoLocationText}`}
            timestampStampText={`🕐 ${autoTimestampText}`}
          />
          {gpsError && <p role="alert" className="text-xs font-semibold text-rose-700">{gpsError}</p>}

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Evidence photos</span>
              <span className={`font-mono font-bold ${evidencePhotos.length >= 3 ? 'text-emerald-700' : 'text-sky-700'}`}>
                {evidencePhotos.length}/5 photos · 3 required
              </span>
            </div>
            {evidencePhotos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {evidencePhotos.map((photo, index) => (
                  <div
                    key={`${photo.file.name}-${photo.capturedAt}`}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 ${index === selectedEvidenceIndex ? 'border-sky-500' : 'border-slate-200'}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedEvidenceIndex(index)}
                      className="w-full h-full cursor-pointer"
                      aria-label={`Preview evidence photo ${index + 1}`}
                    >
                      <img src={photo.previewUrl} alt={`Evidence photo ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1 right-1 rounded-full bg-slate-950/80 text-white p-1 hover:bg-rose-600 cursor-pointer"
                      aria-label={`Remove evidence photo ${index + 1}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {evidencePhotos.length < 3 && (
              <p className="text-[11px] text-amber-700">Add {3 - evidencePhotos.length} more photo{3 - evidencePhotos.length === 1 ? '' : 's'} to continue.</p>
            )}
            {submitError && <p role="alert" className="text-xs font-semibold text-rose-700">{submitError}</p>}
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-sky-900">
              <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Automatic Civic Metadata Stamp</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Each uploaded photo is permanently stamped with JalSetu, the PostGIS-detected ward, GPS coordinates, capture time, and report ID.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setCurrentStep(1)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Issue
            </Button>
            {evidencePhotos.length >= 3 && (
              <Button
                variant="civic"
                size="md"
                onClick={() => setCurrentStep(3)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Review & Submit
              </Button>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Review & Submit */}
      {currentStep === 3 && (
        <form onSubmit={handleSubmitReport} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Review & Submit Water Report
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Verify the issue details and GPS location prior to municipal submission.
            </p>
          </div>

          {/* Review Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Photo with Stamp */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 aspect-4/3 flex flex-col justify-end p-4 text-white relative">
              {selectedEvidence && (
                <img
                  src={selectedEvidence.previewUrl}
                  alt="Captured Evidence Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10 pointer-events-none" />
              <div className="absolute top-3 left-3 z-20">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white">
                  Stamp applied on submission
                </span>
              </div>
              <div className="relative z-20 text-xs space-y-1">
                <p className="font-bold text-sky-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{autoLocationText}</span>
                </p>
                <p className="text-slate-300 font-mono text-[11px] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{autoTimestampText}</span>
                </p>
              </div>
            </div>

            {/* Right: Issue & GIS Location Attributes */}
            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Reported Issue
                </span>
                <p className="text-sm font-bold text-slate-900">{selectedIssueMeta.title}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{selectedIssueMeta.description}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Location Verification
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleAcquireFreshGps}
                      disabled={isRefreshingGps}
                      className="inline-flex items-center gap-1 text-[10px] text-sky-700 hover:text-sky-800 font-semibold px-2 py-0.5 rounded-md hover:bg-sky-100 transition-colors cursor-pointer"
                      title="Acquire fresh satellite GPS fix"
                    >
                      <RotateCw className={`w-3 h-3 ${isRefreshingGps ? 'animate-spin' : ''}`} />
                      <span>{isRefreshingGps ? 'Acquiring...' : 'Recalibrate GPS'}</span>
                    </button>
                    {reportLocation && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        GIS Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2">
                    Ward: {reportLocation?.ward || 'Not verified'} · GPS: {reportLocation ? `${reportLocation.latitude.toFixed(6)}, ${reportLocation.longitude.toFixed(6)}` : 'Unavailable'}
                  </p>
                </div>

                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>
                    {reportLocation ? `${reportLocation.ward} · ${reportLocation.city}` : 'GPS Location Required'}
                  </span>
                </p>

                {reportLocation?.address && (
                  <p className="text-[11px] text-slate-600 mt-1 pl-5">
                    {reportLocation.address}
                  </p>
                )}

                {reportLocation ? (
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                    <div>
                      <span className="block text-[10px] uppercase text-slate-400 font-bold">Fix Status</span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Verified on GIS Map
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-slate-400 font-bold">GPS Accuracy</span>
                      <span className="text-emerald-600 font-semibold font-mono">±{reportLocation.accuracy} meters</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-2">
                    {gpsError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                        <p className="font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Location Access Required</span>
                        </p>
                        <p className="text-[11px] text-rose-700 leading-relaxed">{gpsError}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="civic"
                        size="sm"
                        onClick={handleAcquireFreshGps}
                        isLoading={isRefreshingGps}
                        leftIcon={<Compass className="w-3.5 h-3.5" />}
                        className="flex-1"
                      >
                        Acquire Device GPS
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={openDeniedModal}
                        className="text-xs"
                      >
                        How to Enable Location
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Verified Timestamp
                </span>
                <p className="font-mono text-slate-800">{autoTimestampText}</p>
              </div>
            </div>
          </div>

          {/* Description Textarea */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="issue-description" className="text-xs font-semibold text-slate-700 select-none">
              Additional Description or Landmark (Optional)
            </label>
            <textarea
              id="issue-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Water is bubbling out of the pavement near the public handpump. High pressure leak causing puddles."
              className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-sm rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setCurrentStep(2)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Photo
            </Button>
            <Button
              type="submit"
              variant="civic"
              size="lg"
              isLoading={isSubmitting}
              disabled={!reportLocation?.gpsVerified || !reportLocation.wardId || !reportLocation.wardNumber || !reportLocation.ward || evidencePhotos.length < 3 || evidencePhotos.length > 5 || isSubmitting}
              rightIcon={<CheckCircle2 className="w-5 h-5" />}
            >
              {!reportLocation?.gpsVerified || !reportLocation.wardId || !reportLocation.wardNumber || !reportLocation.ward
                ? 'Verified GPS Ward Required'
                : evidencePhotos.length < 3
                  ? 'Add at Least 3 Photos'
                  : 'Submit Water Report'}
            </Button>
          </div>
          {submitError && <p role="alert" className="text-xs font-semibold text-rose-700 text-right">{submitError}</p>}
        </form>
      )}

      {/* STEP 4: Report Submitted Success Confirmation Screen */}
      {currentStep === 4 && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm space-y-6 text-center">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-sm ${submissionWarning ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {submissionWarning ? <AlertTriangle className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <span className={`text-xs font-bold uppercase tracking-wider ${submissionWarning ? 'text-amber-700' : 'text-emerald-600'}`}>
              {submissionWarning ? 'Report Created · Evidence Issue' : 'Submitted Successfully'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {submissionWarning ? 'Report Registered with an Evidence Warning' : 'Report Registered with Municipal Control'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {submissionWarning
                ? submissionWarning
                : 'Thank you for helping protect Bihar\u2019s water infrastructure. A municipal desk engineer is reviewing the evidence for dispatch.'}
            </p>
          </div>

          {/* Ticket ID Box */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500">Report Reference:</span>
            <span className="text-sm font-bold font-mono text-sky-700">{submittedReport?.id || 'Unavailable'}</span>
          </div>

          {/* Visual Status Timeline (Submitted -> Location Verified -> Under Review -> Team Assigned -> Repair In Progress -> Resolved) */}
          <div className="max-w-md mx-auto text-left pt-2 pb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Resolution Pipeline
            </h4>
            <ReportTimeline currentStatus="submitted" />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-slate-100">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/my-reports')}
            >
              Track in My Reports
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setCurrentStep(1);
                setDescription('');
                evidencePhotos.forEach((photo) => {
                  URL.revokeObjectURL(photo.previewUrl);
                  previewUrls.current.delete(photo.previewUrl);
                });
                setEvidencePhotos([]);
                setSelectedEvidenceIndex(0);
                setSubmitError(null);
              }}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Report Another Issue
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => navigate('/home')}
            >
              Back to Home
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
