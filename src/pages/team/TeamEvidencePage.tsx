import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Image as ImageIcon,
  ArrowRight,
  Trash2,
  HardHat,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teamMemberService } from '../../services/teamMemberService';
import { AssignedReportItem } from '../../types/teamMember';

export const TeamEvidencePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialReportId = searchParams.get('reportId') || '';
  const navigate = useNavigate();

  const { user, teamMemberProfile } = useAuth();
  const memberId = teamMemberProfile?.id || user?.id || '';

  const [reports, setReports] = useState<AssignedReportItem[]>([]);
  const [selectedReportId, setSelectedReportId] = useState(initialReportId);
  const [photoType, setPhotoType] = useState<'before' | 'during' | 'after'>('after');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadReports() {
      const list = await teamMemberService.getAssignedReports(memberId);
      setReports(list);
      if (!selectedReportId && list.length > 0) {
        setSelectedReportId(list[0].id);
      }
    }
    loadReports();
  }, [memberId, selectedReportId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation: File type (JPEG, PNG, WebP)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Invalid file format. Only JPEG, PNG, and WebP images are accepted.');
      return;
    }

    // Validation: File size (< 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setErrorMsg('File too large. Maximum allowable file size is 10 MB.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedReportId) {
      setErrorMsg('Please select an assigned task and an image file.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsUploading(true);
    setUploadProgress(25);

    try {
      setUploadProgress(60);
      const res = await teamMemberService.uploadEvidencePhoto(selectedReportId, selectedFile, photoType);
      setUploadProgress(100);
      setIsUploading(false);

      if (res.success) {
        setSuccessMsg(`Successfully uploaded ${photoType.toUpperCase()} evidence photo to municipal storage.`);
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        setErrorMsg(res.error || 'Upload failed. Please check network connection.');
      }
    } catch (err: any) {
      setIsUploading(false);
      setErrorMsg(err?.message || 'Error occurred while transmitting image.');
    }
  };

  const selectedReport = reports.find((r) => r.id === selectedReportId);

  return (
    <div className="space-y-6 select-none font-sans text-left max-w-4xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Camera className="w-6 h-6 text-emerald-400" />
          <span>Field Photographic Evidence Upload</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Upload clear before, during, and after repair photos for municipal verification and audit record.
        </p>
      </div>

      {/* Main Upload Box */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1A30] border border-slate-800 space-y-6 shadow-xl">
        {/* Error Feedback */}
        {errorMsg && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Feedback */}
        {successMsg && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
            {selectedReportId && (
              <button
                type="button"
                onClick={() => navigate(`/team/reports/${selectedReportId}`)}
                className="font-bold underline hover:text-white"
              >
                View in Report Details →
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-5">
          {/* Select Assigned Report */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-300">
              Select Assigned Report *
            </label>
            <select
              value={selectedReportId}
              onChange={(e) => setSelectedReportId(e.target.value)}
              required
              className="w-full bg-[#081224] text-white text-xs rounded-xl border border-slate-700 py-3 px-3.5 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {reports.length === 0 ? (
                <option value="">No assigned reports in queue</option>
              ) : (
                reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    [{r.reportNumber}] {r.title} — {r.location.ward} ({r.status.toUpperCase()})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Photo Phase Selector */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-300">
              Evidence Stage *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'before', label: '1. Before Repair', desc: 'Initial leak damage' },
                { id: 'during', label: '2. During Work', desc: 'Excavation & clamp' },
                { id: 'after', label: '3. After Repair', desc: 'Proof of restoration' },
              ].map((phase) => (
                <button
                  key={phase.id}
                  type="button"
                  onClick={() => setPhotoType(phase.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    photoType === phase.id
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-xs'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="font-bold text-xs">{phase.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{phase.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* File Drag / Select Box */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Photo Evidence File (JPG, PNG, WebP under 10MB) *
            </label>

            {!previewUrl ? (
              <label className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-500 bg-[#081224] transition-colors cursor-pointer group">
                <Upload className="w-8 h-8 text-slate-500 group-hover:text-amber-400 transition-colors mb-2" />
                <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300">
                  Tap to capture with camera or choose photo
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Supports geotagged JPEG, PNG, WebP up to 10MB
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 p-2 text-center">
                <img
                  src={previewUrl}
                  alt="Selected evidence preview"
                  className="max-h-72 mx-auto rounded-xl object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-semibold hover:bg-rose-500/30 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove / Choose Another</span>
                </button>
              </div>
            )}
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Encrypting & Storing in Supabase...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Submit Button */}
          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-amber-500/20"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading Evidence...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload {photoType.toUpperCase()} Photo</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
