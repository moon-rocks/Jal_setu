import React, { useState, useRef } from 'react';
import { Camera, X, Check, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';

export interface PhotoPreviewProps {
  photoCaptured: boolean;
  photoUrl?: string | null;
  onCapture: (files?: File[]) => void;
  onRetake: () => void;
  onContinue: () => void;
  canContinue?: boolean;
  locationStampText?: string;
  timestampStampText?: string;
  className?: string;
}

export const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  photoCaptured,
  photoUrl,
  onCapture,
  onRetake,
  onContinue,
  canContinue = true,
  locationStampText = '[Location Automatically Captured on Submit]',
  timestampStampText = '[Date & Time Automatically Stamped]',
  className = '',
}) => {
  const [activeFacingMode, setActiveFacingMode] = useState<'back' | 'front'>('back');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) onCapture(files);
    e.target.value = '';
  };

  const handleTriggerCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      onCapture();
    }
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Hidden native camera/file input for high-resolution mobile camera capture */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture={activeFacingMode === 'back' ? 'environment' : 'user'}
        onChange={handleFileChange}
        multiple
        className="hidden"
      />

      {/* Viewport / Frame */}
      <div className="relative w-full aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700/60 shadow-lg flex items-center justify-center text-white">
        {!photoCaptured ? (
          /* Camera Viewfinder Simulation */
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-950/80 via-slate-900 to-slate-950">
            {/* Viewfinder crosshairs */}
            <div className="absolute inset-8 sm:inset-12 border border-white/20 rounded-xl pointer-events-none">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-sky-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-sky-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-sky-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-sky-400 rounded-br-lg" />
            </div>

            {/* Camera Sensor Icon / Water infrastructure inspection motif */}
            <div className="flex flex-col items-center gap-3 text-center z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-sky-400 shadow-inner">
                <Camera className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white tracking-wide">
                  Water Issue Photo Evidence
                </p>
                <p className="text-xs text-slate-400 mt-0.5 max-w-xs">
                  Position the pipe leak, damaged tap, or dirty water within the frame
                </p>
              </div>
            </div>

            {/* Top camera status indicator */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs text-slate-300 font-mono">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                SENSOR READY
              </span>
              <button
                type="button"
                onClick={() => setActiveFacingMode((prev) => (prev === 'back' ? 'front' : 'back'))}
                className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs hover:bg-black/60 transition-colors cursor-pointer"
              >
                Switch Camera ({activeFacingMode})
              </button>
            </div>
          </div>
        ) : (
          /* Stamped Photo Preview */
          <div className="relative w-full h-full bg-slate-800 flex items-center justify-center overflow-hidden">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Captured Issue"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-sky-950 to-slate-900 flex items-center justify-center">
                <div className="text-center p-6 text-slate-400">
                  <p className="text-sm font-medium text-slate-300">Evidence photo unavailable</p>
                </div>
              </div>
            )}

            {/* Gradient protection for stamps */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

            {/* Verified Authentic Civic Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-sm z-10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Evidence Photo Preview</span>
            </div>

            {/* AUTOMATIC PHOTO STAMP OVERLAY */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 sm:p-5 text-left text-white space-y-1 z-10">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-sky-300">
                <MapPin className="w-4 h-4 shrink-0 text-sky-400" />
                <span className="truncate">{locationStampText}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-300 font-mono">
                <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span>{timestampStampText}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-3">
        {!photoCaptured ? (
          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            <Button
              variant="civic"
              size="lg"
              onClick={handleTriggerCamera}
              leftIcon={<Camera className="w-5 h-5" />}
              className="w-full sm:w-auto px-8"
            >
              Capture Photo
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            <Button
              variant="civic"
              size="lg"
              onClick={handleTriggerCamera}
              leftIcon={<Camera className="w-5 h-5" />}
              className="w-full sm:w-auto px-8"
            >
              Add Photos
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={onRetake}
              leftIcon={<X className="w-4 h-4" />}
            >
              Remove Selected Photo
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={onContinue}
              disabled={!canContinue}
              rightIcon={<Check className="w-4 h-4" />}
            >
              Continue with Photo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
