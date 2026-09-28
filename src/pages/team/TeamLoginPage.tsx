import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { JalSetuLogo } from '../../components/ui/JalSetuLogo';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
  Wrench,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  HardHat,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Radio,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const TeamLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setError('Please enter your official municipal email address.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await signInWithPassword(email.trim(), password, 'team');
      setIsLoading(false);

      if (res.success) {
        setSuccessMsg('Authorization verified. Launching Field Terminal...');
        setTimeout(() => {
          navigate('/team/dashboard');
        }, 600);
      } else {
        setError(res.error || 'Authentication failed. Please verify your team member credentials.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Network error connecting to municipal authentication servers.');
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#0B1527] font-sans text-slate-100">
      {/* Left Field Command Hero Branding */}
      <div className="md:w-1/2 bg-gradient-to-br from-[#070F1E] via-[#0C1B33] to-[#082245] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden select-none border-r border-slate-800">
        {/* Ambient atmospheric glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <JalSetuLogo size="lg" variant="light" showTagline={false} />
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>Field Operations</span>
          </div>
        </div>

        {/* Center Field Mission Info */}
        <div className="my-10 relative z-10 max-w-lg space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/20 text-xs font-semibold text-sky-300">
            <HardHat className="w-3.5 h-3.5" />
            <span>Water Supply & Pipeline Maintenance Division</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Team Member <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-sky-300">
              Field Terminal
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Authorized portal for field engineers, plumbers, and rapid repair crews. Manage assigned leak investigations, submit GPS photographic evidence, and update status in real time.
          </p>

          <div className="pt-2 grid grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Real-time dispatch assignments</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Before & after photo verification</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Interactive offline-ready field map</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Direct supervisor communications</span>
            </div>
          </div>

          {/* Security policy box */}
          <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>No Public Registration</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Team Member accounts are provisioned exclusively by Municipal Administrators. Contact your department supervisor if you have not received login credentials.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Har Boond, Behtar Bihar.</span>
          <span className="font-mono text-slate-400">JALSETU FIELD v2.4</span>
        </div>
      </div>

      {/* Right Login Container */}
      <div className="md:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-[#0E1A30]">
        <div className="w-full max-w-md space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
              <Wrench className="w-3.5 h-3.5" />
              <span>Field Personnel Access</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Team Member Login
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Enter your official email and password to access your field queue.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-300">
                Official Email / Username
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="e.g. rajesh.kumar@muzaffarpur.gov.in"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  autoComplete="email"
                  className="w-full bg-[#081224] text-white text-sm rounded-xl border border-slate-700 py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all placeholder:text-slate-600"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password Field with Show/Hide toggle */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  autoComplete="current-password"
                  className="w-full bg-[#081224] text-white text-sm rounded-xl border border-slate-700 py-3 pl-10 pr-11 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all placeholder:text-slate-600"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Session */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/20"
                />
                <span>Remember session on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Field Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Field Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Portal Switcher (Citizen or Admin) */}
          <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center text-xs">
            <NavLink
              to="/login"
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-sky-300 transition-colors border border-slate-800"
            >
              Citizen Portal
            </NavLink>
            <NavLink
              to="/admin/login"
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors border border-slate-800"
            >
              Admin Operations
            </NavLink>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F1D36] border border-slate-700 rounded-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Reset Team Member Password</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSubmitted(false);
                  setForgotEmail('');
                }}
                className="text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {forgotSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-2 text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                <p className="font-semibold text-sm">Request Submitted to Municipal Admin</p>
                <p className="text-slate-400">
                  Password reset requests for field personnel are processed by your department administrator for security verification.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your registered municipal email. A password reset request will be dispatched to your division administrator.
                </p>
                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-slate-300">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="e.g. rajesh.kumar@muzaffarpur.gov.in"
                    className="w-full bg-[#081224] text-white text-sm rounded-xl border border-slate-700 py-2.5 px-3.5 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
