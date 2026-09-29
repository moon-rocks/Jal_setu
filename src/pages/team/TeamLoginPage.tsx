import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { JalSetuLogo } from '../../components/ui/JalSetuLogo';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
  Building2,
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
  Droplets,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const TeamLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#080E1A] font-sans">
      <div className="md:w-1/2 bg-gradient-to-br from-[#0B1527] via-[#091730] to-[#04284D] p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden select-none border-r border-slate-800">
        <div className="relative z-10 flex items-center gap-3">
          <JalSetuLogo size="lg" variant="light" showTagline={false} />
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-500 text-white shadow-xs">
            Team
          </span>
        </div>

        <div className="my-12 relative z-10 max-w-lg space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/20 text-xs font-semibold text-sky-300">
            <Building2 className="w-3.5 h-3.5" />
            <span>Muzaffarpur Municipal Corporation Portal</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Team Member Field Operations
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Field personnel portal for receiving municipal assignments, submitting repair evidence, and updating complaint status across Muzaffarpur.
          </p>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>Restricted Field Personnel Access</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Team Member accounts are provisioned exclusively by Municipal Administrators. Contact your department supervisor if you have not received login credentials.
            </p>
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Har Boond, Behtar Bihar.</span>
          <span className="font-mono">Field Personnel Access</span>
        </div>
      </div>

      <div className="md:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-md space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 block mb-1">
              Authorized Field Personnel
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In to Team Console
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Enter your official team member credentials to access assigned field work.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Team Member Email Address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter your official email address"
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label htmlFor="team-member-password" className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-sky-700 hover:text-sky-800 transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <Input
                id="team-member-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter your account password"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={(
                  <button
                    type="button"
                    onClick={() => setShowPassword((shown) => !shown)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
                autoComplete="current-password"
                required
              />
            </div>

            <Button
              type="submit"
              variant="civic"
              size="lg"
              isLoading={isLoading}
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Team Member Panel
            </Button>
          </form>

          <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-center text-xs">
            <NavLink
              to="/admin/login"
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-sky-700 font-semibold transition-colors border border-slate-200 flex items-center justify-center gap-1.5"
            >
              <HardHat className="w-3.5 h-3.5 text-sky-600" />
              <span>Admin Operations</span>
            </NavLink>
            <NavLink
              to="/login"
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-sky-700 font-semibold transition-colors border border-slate-200 flex items-center justify-center gap-1.5"
            >
              <Droplets className="w-3.5 h-3.5 text-sky-600" />
              <span>Citizen Portal</span>
            </NavLink>
          </div>
        </div>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-600" />
                <span>Reset Team Member Password</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSubmitted(false);
                  setForgotEmail('');
                }}
                aria-label="Close password reset"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs space-y-2 text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
                <p className="font-semibold text-sm">Request Submitted to Municipal Admin</p>
                <p className="text-slate-600">
                  Password reset requests for field personnel are processed by your department administrator for security verification.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your registered municipal email. A password reset request will be dispatched to your division administrator.
                </p>
                <Input
                  label="Official Email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  placeholder="Enter your official email address"
                  leftIcon={<Mail className="w-4 h-4" />}
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setShowForgotModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="civic" size="sm">
                    Submit Request
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
