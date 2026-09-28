import React from 'react';
import {
  HelpCircle,
  Phone,
  ShieldAlert,
  HardHat,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export const TeamHelpPage: React.FC = () => {
  return (
    <div className="space-y-6 select-none font-sans text-left max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-amber-400" />
          <span>Field Protocols & Municipal Operations Guide</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Standard operating procedures, emergency trunk line isolation hotlines, and safety rules for field repair teams.
        </p>
      </div>

      {/* Emergency Hotlines Box */}
      <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-rose-300 font-bold text-sm uppercase tracking-wider">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <span>Emergency Trunk Line Isolation Contacts</span>
        </div>
        <p className="text-xs text-rose-200/90 leading-relaxed">
          In case of sudden high-pressure burst exceeding 4 bar or electrical hazard near water bodies, contact the central telemetry SCADA control room immediately before excavating:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-500/30 font-mono text-white flex items-center justify-between">
            <span>SCADA Control Desk:</span>
            <span className="font-bold text-rose-400">+91 621 221 4455</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-500/30 font-mono text-white flex items-center justify-between">
            <span>Executive Water Engineer:</span>
            <span className="font-bold text-amber-400">+91 94318 12000</span>
          </div>
        </div>
      </div>

      {/* Standard Operating Procedure (SOP) */}
      <div className="p-6 rounded-3xl bg-[#0E1A30] border border-slate-800 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <HardHat className="w-5 h-5 text-amber-400" />
          <span>5-Step Standard Field Procedure</span>
        </h2>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-bold text-amber-400">Step 1: Receipt & Acknowledgment</span>
            <p className="text-slate-400 leading-relaxed">
              Open the assigned report and tap "Accept Assignment" within 15 minutes of dispatch. Check the GPS coordinate pin on the Field Map.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-bold text-blue-400">Step 2: On-Site Safety & Before Photo</span>
            <p className="text-slate-400 leading-relaxed">
              Upon arriving at the repair location, set safety cones and tap "Start Field Work". Capture and upload a clear "Before Repair" photograph showing the leakage point.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-bold text-sky-400">Step 3: Execution & Interim Updates</span>
            <p className="text-slate-400 leading-relaxed">
              Perform excavation, pipe isolation, clamp attachment, or valve replacement. Log progress updates if additional parts or traffic assistance are needed.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400">Step 4: Pressure Test & Proof Photo</span>
            <p className="text-slate-400 leading-relaxed">
              Gradually restore line pressure to test seal integrity (minimum 1.8 bar). Capture an "After Repair" photograph clearly showing the dry, sealed joint.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-bold text-purple-400">Step 5: Completion Submission</span>
            <p className="text-slate-400 leading-relaxed">
              Tap "Submit Completion" and summarize repair work done. The task will transition to "Awaiting Municipal Admin Verification" until the supervisor reviews evidence and approves.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
