import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { JalSetuLogo } from '../../components/ui/JalSetuLogo';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Droplets,
  CheckCircle2,
  HardHat,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const CitizenLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithPassword, signOut } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSkipForNow = async () => {
    setIsSkipping(true);
    setError(null);
    try {
      await signOut();
      navigate('/home', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Unable to continue as a guest. Please try again.');
      setIsSkipping(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await signInWithPassword(email.trim(), password);
      setIsLoading(false);

      if (res.success) {
        navigate('/home');
      } else {
        setError(res.error || 'Invalid email or password. Please verify or use Forgot Password.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Login failed. Please check your connection.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-50 font-sans">
      {/* Left Civic Hero Section */}
      <div className="md:w-1/2 bg-gradient-to-br from-[#0B1527] via-[#0F224A] to-[#0369A1] p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden select-none">
        {/* Background ambient water glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10">
          <JalSetuLogo size="lg" variant="light" showTagline={true} />
        </div>

        {/* Center Tagline & Civic Mission */}
        <div className="my-12 relative z-10 max-w-lg space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-sky-200">
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            <span>Bihar State Water Infrastructure Initiative</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Har Boond, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-sky-200 to-white">
              Behtar Bihar.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Report pipeline leaks, contaminated water, or low pressure directly to municipal field teams. Every verified report builds transparent, accountable water distribution across Muzaffarpur.
          </p>

          <div className="pt-4 grid grid-cols-2 gap-3 text-xs text-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Instant GPS location stamp</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Direct field team dispatch</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Transparent status timeline</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Municipal SCADA monitoring</span>
            </div>
          </div>
        </div>

        {/* Bottom trust footer */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Muzaffarpur Municipal Corporation</span>
          <span className="font-mono">Citizen Portal</span>
        </div>
      </div>

      {/* Right Login Form Container */}
      <div className="md:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-md space-y-6 text-left">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 block mb-1">
              Citizen Access
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In to JalSetu
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
              Enter your email and password to track reports and submit new water issues.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  autoComplete="email"
                  className="w-full bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <NavLink
                  to="/forgot-password"
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
                >
                  Forgot Password?
                </NavLink>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 py-3 pl-10 pr-11 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="civic"
              size="lg"
              isLoading={isLoading}
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleSkipForNow}
            isLoading={isSkipping}
            disabled={isLoading}
            className="w-full"
          >
            Skip for now
          </Button>

          {/* New Citizen Sign Up Link (OTP Hybrid Flow) */}
          <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-100 text-center space-y-1.5">
            <p className="text-xs text-slate-600 font-medium">
              First time reporting a water problem?
            </p>
            <NavLink
              to="/signup"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-800 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Create Account via Email OTP →</span>
            </NavLink>
          </div>

          {/* Portals Switcher */}
          <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-center text-xs">
            <NavLink
              to="/team/login"
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-amber-700 font-semibold transition-colors border border-slate-200 flex items-center justify-center gap-1.5"
            >
              <HardHat className="w-3.5 h-3.5 text-amber-600" />
              <span>Team Login</span>
            </NavLink>

            <NavLink
              to="/admin/login"
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-sky-700 font-semibold transition-colors border border-slate-200 flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-sky-600" />
              <span>Admin Portal</span>
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};
